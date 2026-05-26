import sys
import os

# Auto-redirect to virtual environment if running with system Python
_venv_python = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.venv', 'Scripts', 'python.exe')
if sys.executable.lower() != _venv_python.lower() and os.path.exists(_venv_python):
    os.execv(_venv_python, [_venv_python] + sys.argv)

import re
import uuid
import secrets
import hashlib
import json
import logging
from functools import wraps
from datetime import datetime, timedelta
from flask import Flask, render_template, request, session, redirect, url_for, flash, g
from flask_mysqldb import MySQL
from flask_wtf import FlaskForm
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from wtforms import StringField, PasswordField, SubmitField, SelectField, DecimalField, TextAreaField
from wtforms.validators import DataRequired, Email, Length, EqualTo, NumberRange, Optional
from werkzeug.utils import secure_filename
import MySQLdb.cursors
import bcrypt
from dotenv import load_dotenv
load_dotenv('YoCoin.env')
from blockchain import Blockchain
from notifications import NotificationService
from validators import validate_uganda_phone, validate_national_id, validate_password_strength
from audit import log_action
from credit_scoring import calculate_credit_score, update_score_on_repayment, get_score_tier
from loan_manager import check_for_defaults, generate_repayment_schedule, get_days_until_due, get_loan_status_summary
from security import check_account_lockout, record_failed_login, reset_failed_logins, sanitize_input, require_fresh_session
from monitoring import detect_suspicious_activity, log_suspicious_activity
from mobile_money import MobileMoneyService
from credit_triggers import trigger_score_recalculation
from two_factor import TwoFactorAuth
from cache import global_cache, QueryCache

logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', secrets.token_hex(32))
app.config['WTF_CSRF_ENABLED'] = True
app.config['SESSION_COOKIE_SECURE'] = os.getenv('SESSION_COOKIE_SECURE', 'False').lower() == 'true'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=24)
app.config['UPLOAD_FOLDER'] = 'static/profile_pics'
app.config['KYC_UPLOAD_FOLDER'] = 'static/kyc'
app.config['MAX_CONTENT_LENGTH'] = 2 * 1024 * 1024
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
ALLOWED_KYC_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}

for folder in [app.config['UPLOAD_FOLDER'], app.config['KYC_UPLOAD_FOLDER']]:
    os.makedirs(folder, exist_ok=True)

app.config['MYSQL_HOST'] = os.getenv('DB_HOST', 'localhost')
app.config['MYSQL_USER'] = os.getenv('DB_USER', 'yocoin_user')
app.config['MYSQL_PASSWORD'] = os.getenv('DB_PASSWORD', 'securepassword123')
app.config['MYSQL_DB'] = os.getenv('DB_NAME', 'yocoin_db')
app.config['MYSQL_CURSORCLASS'] = 'DictCursor'

mysql = MySQL(app)

with app.app_context():
    blockchain = Blockchain(mysql)
    notifications = NotificationService(mysql)
    mobile_money = MobileMoneyService(mysql)
    two_factor_auth = TwoFactorAuth(mysql)
    query_cache = QueryCache(mysql, global_cache)

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

@app.before_request
def before_request_logging():
    g.start_time = datetime.now()
    logger.info(f'{request.method} {request.path} from {request.remote_addr}')

@app.after_request
def after_request_logging(response):
    if hasattr(g, 'start_time'):
        duration = (datetime.now() - g.start_time).total_seconds() * 1000
        logger.info(f'{request.method} {request.path} - {response.status_code} ({duration:.0f}ms)')
    return response

@app.teardown_appcontext
def cleanup_defaults(exception=None):
    if exception is None and request and request.path.startswith('/'):
        try:
            check_for_defaults(mysql, notifications)
            send_5day_reminders()
        except Exception as e:
            logger.error(f'cleanup_defaults failed: {e}')

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'loggedin' not in session:
            flash('Please log in to access this page', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'role' not in session or session['role'] != 'admin':
            flash('Admin access required', 'danger')
            return redirect(url_for('dashboard'))
        return f(*args, **kwargs)
    return decorated_function

def generate_user_id():
    return str(uuid.uuid4())

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

def verify_password(password, hashed):
    if isinstance(hashed, str):
        hashed = hashed.encode('utf-8')
    return bcrypt.checkpw(password.encode('utf-8'), hashed)

def allowed_file(filename, allowed_set=None):
    if allowed_set is None:
        allowed_set = ALLOWED_EXTENSIONS
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_set

def validate_file_magic(file_stream, allowed_types=None):
    """Validate file content using magic bytes"""
    if allowed_types is None:
        allowed_types = {
            b'\x89PNG\r\n\x1a\n': 'png',
            b'\xff\xd8\xff': 'jpg',
            b'GIF87a': 'gif',
            b'GIF89a': 'gif',
            b'%PDF': 'pdf'
        }
    header = file_stream.read(8)
    file_stream.seek(0)
    for magic, ext in allowed_types.items():
        if header[:len(magic)] == magic:
            return True, ext
    return False, None

def calculate_due_date(term_months):
    """Calculate due date from term in months"""
    return datetime.now() + timedelta(days=int(term_months) * 30)

def get_interest_rate(user_id):
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('SELECT credit_score FROM users WHERE user_id = %s', (user_id,))
        result = cursor.fetchone()
    finally:
        cursor.close()
    credit_score = result['credit_score'] if result else 500
    return 3.5 if credit_score > 700 else 5.0 if credit_score > 600 else 7.5

def get_last_block_index():
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('SELECT COALESCE(MAX(block_index), 1) as last_index FROM blockchain_blocks')
        result = cursor.fetchone()
    finally:
        cursor.close()
    return result['last_index'] or 1

class RegistrationForm(FlaskForm):
    name = StringField('Full Name', validators=[DataRequired(), Length(min=2, max=100)])
    email = StringField('Email', validators=[DataRequired(), Email(), Length(max=100)])
    phone = StringField('Phone', validators=[DataRequired(), Length(min=9, max=15)])
    region = SelectField('Region', validators=[DataRequired()],
        choices=[('', 'Select region'), ('Karamoja', 'Karamoja'), ('Central', 'Central'),
                 ('Northern', 'Northern'), ('Western', 'Western'), ('Eastern', 'Eastern')])
    national_id = StringField('National ID', validators=[DataRequired(), Length(min=5, max=50)])
    password = PasswordField('Password', validators=[
        DataRequired(), Length(min=8, message='Minimum 8 characters'),
        EqualTo('confirm_password', message='Passwords must match')
    ])
    confirm_password = PasswordField('Confirm Password')
    submit = SubmitField('Create Account')

class LoginForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired()])
    submit = SubmitField('Sign In')

class LoanApplicationForm(FlaskForm):
    amount = DecimalField('Loan Amount (UGX)', validators=[
        DataRequired(), NumberRange(min=50000, max=1000000)
    ])
    purpose = SelectField('Purpose', validators=[DataRequired()],
        choices=[('', 'Select purpose'), ('boda_boda', 'Boda Boda'), ('solar', 'Solar'),
                 ('farming', 'Farming Equipment'), ('business', 'Small Business'), ('other', 'Other')])
    term_months = SelectField('Term (Months)', validators=[DataRequired()],
        choices=[(3, '3 months'), (6, '6 months'), (12, '12 months'), (24, '24 months')])

class RepaymentForm(FlaskForm):
    loan_id = SelectField("Select Loan", coerce=str, validators=[DataRequired()])
    amount = StringField("Payment Amount (UGX)", validators=[DataRequired()])
    payment_method = SelectField("Payment Method", validators=[DataRequired()],
        choices=[("mobile_money", "Mobile Money (MTN/Airtel)"), ("bank", "Bank Transfer"), ("cash", "Cash Payment")])
    account_number = StringField('Account / Phone', validators=[Optional(), Length(max=50)])
    transaction_reference = StringField('Transaction Reference', validators=[Optional(), Length(max=100)])
    submit = SubmitField("Make Payment")

class PasswordResetRequestForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email()])
    submit = SubmitField('Send Reset Link')

class PasswordResetForm(FlaskForm):
    recovery_answer = StringField('Security Answer', validators=[DataRequired()])
    new_password = PasswordField('New Password', validators=[
        DataRequired(), Length(min=8, message='Minimum 8 characters'),
        EqualTo('confirm_password', message='Passwords must match')
    ])
    confirm_password = PasswordField('Confirm Password')
    submit = SubmitField('Reset Password')

class KYCUploadForm(FlaskForm):
    document_type = SelectField('Document Type', validators=[DataRequired()],
        choices=[('', 'Select document type'),
                 ('national_id_front', 'National ID (Front)'),
                 ('national_id_back', 'National ID (Back)'),
                 ('selfie', 'Selfie with ID'),
                 ('utility_bill', 'Proof of Address')])
    submit = SubmitField('Upload Document')

@app.route('/')
def home():
    if 'loggedin' in session:
        if session.get('role') == 'admin':
            return redirect(url_for('admin_dashboard'))
        return redirect(url_for('dashboard'))
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
@limiter.limit("30 per hour")
def register():
    form = RegistrationForm()
    if request.method == 'POST' and form.validate_on_submit():
        phone_valid, normalized_phone = validate_uganda_phone(form.phone.data)
        if not phone_valid:
            flash('Invalid phone format. Use +256XXXXXXXXX or 0XXXXXXXXX', 'danger')
            return render_template('register.html', form=form)

        nid_valid, nid_error = validate_national_id(form.national_id.data)
        if not nid_valid:
            flash(f'Invalid National ID: {nid_error}', 'danger')
            return render_template('register.html', form=form)

        pw_valid, pw_issues = validate_password_strength(form.password.data)
        if not pw_valid:
            for issue in pw_issues:
                flash(issue, 'danger')
            return render_template('register.html', form=form)

        user_id = generate_user_id()
        referral_code = f'YC-{user_id[:6].upper()}'
        referred_by = request.form.get('referral_code', '').strip() or request.args.get('ref', '')
        cursor = mysql.connection.cursor()
        try:
            cursor.execute('INSERT INTO users (user_id, name, email, phone, region, national_id, referral_code, referred_by) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)',
                (user_id, form.name.data, form.email.data, normalized_phone, form.region.data, form.national_id.data.upper(), referral_code, referred_by if referred_by else None))
            hashed_pw = hash_password(form.password.data)
            cursor.execute('INSERT INTO user_auth (user_id, password_hash, salt) VALUES (%s, %s, %s)', (user_id, hashed_pw, ''))
            cursor.execute('INSERT INTO token_balances (address, balance) VALUES (%s, 0)', (user_id,))
            cursor.execute('INSERT INTO notification_preferences (user_id, email_enabled, sms_enabled, phone) VALUES (%s, TRUE, FALSE, %s)',
                (user_id, normalized_phone))
            token = secrets.token_urlsafe(32)
            expires = datetime.now() + timedelta(hours=24)
            cursor.execute('INSERT INTO email_verification (user_id, token, expires_at) VALUES (%s, %s, %s)',
                (user_id, token, expires))
            mysql.connection.commit()
            if referred_by:
                cursor2 = mysql.connection.cursor()
                try:
                    cursor2.execute('SELECT user_id FROM users WHERE referral_code = %s', (referred_by,))
                    referrer = cursor2.fetchone()
                    if referrer:
                        cursor2.execute('INSERT INTO referrals (referrer_id, referred_id, referral_code) VALUES (%s, %s, %s)',
                            (referrer['user_id'], user_id, referred_by))
                        mysql.connection.commit()
                finally:
                    cursor2.close()
            verify_url = request.url_root.rstrip('/') + url_for('verify_email', token=token)
            notifications.send_email(form.email.data, 'Verify Your YoCoin Email',
                f'<h2>Welcome {form.name.data}!</h2><p>Click to verify your email: <a href="{verify_url}">Verify Email</a></p>')
            log_action(mysql, 'user_registered', user_id, 'user', user_id, 'New user registration', request)
            flash('Account created! Please check your email to verify your account.', 'success')
            return redirect(url_for('login'))
        except MySQLdb.IntegrityError:
            mysql.connection.rollback()
            flash('Email or phone already registered', 'danger')
        except Exception as e:
            mysql.connection.rollback()
            import traceback
            traceback.print_exc()
            flash(f'Registration failed: {str(e)}', 'danger')
        finally:
            cursor.close()
    return render_template('register.html', form=form)

@app.route('/login', methods=['GET', 'POST'])
@limiter.limit("60 per hour")
def login():
    form = LoginForm()
    if request.method == 'POST' and form.validate_on_submit():
        is_locked, remaining = check_account_lockout(mysql, form.email.data)
        if is_locked:
            flash(f'Account locked. Try again in {remaining} minutes', 'danger')
            return render_template('login.html', form=form)

        cursor = mysql.connection.cursor()
        try:
            cursor.execute(
                'SELECT u.*, ua.password_hash FROM users u '
                'JOIN user_auth ua ON u.user_id = ua.user_id '
                'WHERE u.email = %s',
                (form.email.data,)
            )
            user = cursor.fetchone()

            if user and verify_password(form.password.data, user['password_hash']):
                reset_failed_logins(mysql, form.email.data)

                session['pending_login'] = {
                    'user_id': user['user_id'],
                    'name': user['name'],
                    'email': user['email'],
                    'user_agent': request.headers.get('User-Agent', '')
                }

                if two_factor_auth.is_enabled(user['user_id']):
                    log_action(mysql, '2fa_required', user['user_id'], 'user', user['user_id'], '2FA verification required', request)
                    flash('Enter your authentication code', 'info')
                    return redirect(url_for('verify_2fa'))

                _complete_login(user, request)
                flash('Welcome back!', 'success')
                return redirect(url_for('dashboard'))
            else:
                record_failed_login(mysql, form.email.data)
                log_action(mysql, 'login_failed', user['user_id'] if user else None, 'user', user['user_id'] if user else None, 'Failed login attempt', request)
                flash('Invalid email or password', 'danger')
        finally:
            cursor.close()
    return render_template('login.html', form=form)

def _complete_login(user, req):
    session.permanent = True
    session['loggedin'] = True
    session['user_id'] = user['user_id']
    session['name'] = user['name']
    session['email'] = user['email']
    session['login_time'] = datetime.now().isoformat()
    session['user_agent'] = req.headers.get('User-Agent', '')
    is_admin = False
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('SELECT 1 FROM admins WHERE user_id = %s LIMIT 1', (user['user_id'],))
        is_admin = cursor.fetchone() is not None
        cursor.execute('UPDATE users SET last_login = NOW() WHERE user_id = %s', (user['user_id'],))
        cursor.execute('''
            INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent)
            VALUES (%s, %s, %s, %s)
        ''', (user['user_id'], secrets.token_hex(32), req.remote_addr, req.headers.get('User-Agent', '')))
        mysql.connection.commit()
    except Exception as e:
        logger.error(f'Login completion error: {e}')
    finally:
        cursor.close()
    session['role'] = 'admin' if is_admin else 'user'
    session['profile_image'] = user.get('image_file')
    log_action(mysql, 'user_login', user['user_id'], 'user', user['user_id'], 'User logged in', req)
    session.pop('pending_login', None)

@app.route('/verify-2fa', methods=['GET', 'POST'])
@limiter.limit("60 per hour")
def verify_2fa():
    if 'pending_login' not in session:
        return redirect(url_for('login'))
    if request.method == 'POST':
        token = request.form.get('totp_code', '').strip()
        use_backup = request.form.get('use_backup', '').lower() == 'true'
        user_id = session['pending_login']['user_id']
        if use_backup:
            valid = two_factor_auth.verify_backup_code(user_id, token)
        else:
            valid = two_factor_auth.verify_login(user_id, token)
        if valid:
            cursor = mysql.connection.cursor()
            try:
                cursor.execute('SELECT * FROM users WHERE user_id = %s', (user_id,))
                user = cursor.fetchone()
            finally:
                cursor.close()
            if user:
                _complete_login(user, request)
                flash('Welcome back!', 'success')
                return redirect(url_for('dashboard'))
        flash('Invalid authentication code', 'danger')
    return render_template('verify_2fa.html')

@app.route('/2fa/setup', methods=['GET', 'POST'])
@login_required
def setup_2fa():
    if two_factor_auth.is_enabled(session['user_id']):
        flash('2FA is already enabled', 'info')
        return redirect(url_for('profile'))
    if request.method == 'POST':
        token = request.form.get('totp_code', '').strip()
        if two_factor_auth.verify_setup(session['user_id'], token):
            backup_codes = two_factor_auth.generate_backup_codes(session['user_id'])
            flash('2FA enabled! Save these backup codes securely.', 'success')
            return render_template('2fa_backup_codes.html', codes=backup_codes)
        flash('Invalid code. Try again.', 'danger')
    secret, uri, qr_uri = two_factor_auth.setup_2fa(session['user_id'])
    if not secret:
        flash('Failed to setup 2FA', 'danger')
        return redirect(url_for('profile'))
    return render_template('2fa_setup.html', secret=secret, uri=uri, qr_uri=qr_uri)

@app.route('/2fa/disable', methods=['GET', 'POST'])
@login_required
def disable_2fa():
    if not two_factor_auth.is_enabled(session['user_id']):
        flash('2FA is not enabled', 'info')
        return redirect(url_for('profile'))
    if request.method == 'POST':
        token = request.form.get('totp_code', '').strip()
        if two_factor_auth.disable_2fa(session['user_id'], token):
            flash('2FA disabled', 'success')
            return redirect(url_for('profile'))
        flash('Invalid code', 'danger')
    return render_template('2fa_disable.html')

@app.route('/dashboard')
@login_required
def dashboard():
    if session.get('role') == 'admin':
        return redirect(url_for('admin_dashboard'))
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('''
            SELECT u.*,
                COALESCE((SELECT SUM(amount) FROM loans WHERE user_id = u.user_id AND status = 'disbursed'), 0) -
                COALESCE((SELECT SUM(amount) FROM loan_repayments WHERE user_id = u.user_id), 0) as yocoin_balance
            FROM users u WHERE u.user_id = %s
        ''', (session['user_id'],))
        user = cursor.fetchone()
        cursor.execute('SELECT * FROM loans WHERE user_id = %s ORDER BY application_date DESC LIMIT 5', (session['user_id'],))
        loans = cursor.fetchall()
        cursor.execute('SELECT * FROM blockchain_transactions WHERE sender_address = %s OR recipient_address = %s ORDER BY timestamp DESC LIMIT 10', (session['user_id'], session['user_id']))
        transactions = cursor.fetchall()
        cursor.execute('''
            SELECT COUNT(*) as pending_count FROM loans
            WHERE user_id = %s AND status = 'pending'
        ''', (session['user_id'],))
        pending_loans = cursor.fetchone()
        cursor.execute('''
            SELECT kyc_status FROM users WHERE user_id = %s
        ''', (session['user_id'],))
        kyc_status_row = cursor.fetchone()
    finally:
        cursor.close()

    kyc_status = kyc_status_row['kyc_status'] if kyc_status_row else 'not_started'
    score_tier = get_score_tier(user['credit_score'] if user else 500)
    loan_summary = get_loan_status_summary(mysql, session['user_id'])

    cursor = mysql.connection.cursor()
    try:
        cursor.execute('''
            SELECT l.loan_id, ANY_VALUE(l.amount) as amount, COALESCE(SUM(lr.amount), 0) as paid
            FROM loans l LEFT JOIN loan_repayments lr ON l.loan_id = lr.loan_id AND lr.status = 'paid'
            WHERE l.user_id = %s AND l.status IN ('approved', 'disbursed')
            GROUP BY l.loan_id
        ''', (session['user_id'],))
        rows = cursor.fetchall()
        repayment_progress = []
        for r in rows:
            try:
                repayment_progress.append({
                    'loan_id': r['loan_id'][:8],
                    'amount': float(r['amount']),
                    'paid': float(r['paid']),
                    'pct': round(float(r['paid']) / float(r['amount']) * 100, 1) if float(r['amount']) > 0 else 0
                })
            except (KeyError, TypeError, ValueError):
                pass
        cursor.execute('''
            SELECT DATE(application_date) as date, COUNT(*) as cnt
            FROM loans WHERE user_id = %s GROUP BY DATE(application_date) ORDER BY date ASC LIMIT 12
        ''', (session['user_id'],))
        loan_history_raw = cursor.fetchall()
        loan_history_labels = [str(r['date']) if r['date'] else '' for r in loan_history_raw]
        loan_history_data = [r['cnt'] for r in loan_history_raw]
    except Exception:
        repayment_progress = []
        loan_history_raw = []
        loan_history_labels = []
        loan_history_data = []
    finally:
        cursor.close()

    _all_news = [
        {"title": "Oil Pipeline Construction to Create 10,000 Jobs", "category": "Energy", "date": "May 8", "summary": "TotalEnergies announces major hiring for East African Crude Oil Pipeline project.", "image": "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=250&fit=crop", "url": "https://www.google.com/search?q=TotalEnergies+East+African+Crude+Oil+Pipeline+jobs+Uganda"},
        {"title": "Kampala Stock Exchange Sees 15% Growth", "category": "Finance", "date": "May 7", "summary": "Local investors show renewed interest in manufacturing and banking stocks.", "image": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=250&fit=crop", "url": "https://www.google.com/search?q=Kampala+Stock+Exchange+growth+Uganda"},
        {"title": "Coffee Exports Hit Record High", "category": "Agriculture", "date": "May 6", "summary": "Uganda coffee exports earn $800M as global demand rises.", "image": "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=250&fit=crop", "url": "https://www.google.com/search?q=Uganda+coffee+exports+record+high"},
        {"title": "Solar Energy Investments Surge", "category": "Energy", "date": "May 5", "summary": "International investors pour $200M into Uganda solar projects.", "image": "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=250&fit=crop", "url": "https://www.google.com/search?q=Uganda+solar+energy+investments"},
        {"title": "Mobile Money Transactions Reach New Peak", "category": "Technology", "date": "May 4", "summary": "Uganda leads East Africa in mobile money adoption with 25M active users.", "image": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=250&fit=crop", "url": "https://www.google.com/search?q=Uganda+mobile+money+transactions+peak"},
        {"title": "Agricultural Tech Startups Boom in Kampala", "category": "Agriculture", "date": "May 3", "summary": "Over 50 agritech startups launched in Uganda this year, transforming farming.", "image": "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=250&fit=crop", "url": "https://www.google.com/search?q=Uganda+agritech+startups+Kampala"},
        {"title": "Uganda Tourism Revenue Grows 22%", "category": "Tourism", "date": "May 2", "summary": "Wildlife safaris and eco-tourism drive record numbers of visitors to Uganda national parks.", "image": "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400&h=250&fit=crop", "url": "https://www.google.com/search?q=Uganda+tourism+revenue+growth"},
        {"title": "New Mobile Money Tax Policies Announced", "category": "Finance", "date": "May 1", "summary": "URA introduces simplified mobile money tax structure for digital financial transactions.", "image": "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=250&fit=crop", "url": "https://www.google.com/search?q=Uganda+mobile+money+tax+policies"},
        {"title": "Youth Entrepreneurship Fund Launched", "category": "Business", "date": "Apr 30", "summary": "Government launches UGX 50B fund to support young entrepreneurs across all regions.", "image": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=250&fit=crop", "url": "https://www.google.com/search?q=Uganda+youth+entrepreneurship+fund"},
        {"title": "Electric Boda Bodas Gain Traction", "category": "Transport", "date": "Apr 29", "summary": "Electric motorcycle startup partners with SACCOs to offer affordable e-boda financing.", "image": "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&h=250&fit=crop", "url": "https://www.google.com/search?q=Uganda+electric+boda+boda"},
        {"title": "Central Bank Cuts Interest Rates", "category": "Finance", "date": "Apr 28", "summary": "Bank of Uganda reduces policy rate to 8.5% to stimulate economic growth and lending.", "image": "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=250&fit=crop", "url": "https://www.google.com/search?q=Bank+of+Uganda+interest+rate+cut"},
        {"title": "SACCO Digital Transformation Drive", "category": "Technology", "date": "Apr 27", "summary": "Over 200 SACCOs adopt mobile-first digital platforms for member loan management.", "image": "https://images.unsplash.com/photo-1573164574572-cb89e39749b7?w=400&h=250&fit=crop", "url": "https://www.google.com/search?q=Uganda+SACCO+digital+transformation"},
        {"title": "Farming Cooperatives Report Record Harvest", "category": "Agriculture", "date": "Apr 26", "summary": "Maize and coffee cooperatives in Eastern Uganda report best harvest season in decade.", "image": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=250&fit=crop", "url": "https://www.google.com/search?q=Uganda+farming+cooperatives+harvest"},
        {"title": "Women-Led SMEs Access Low-Interest Loans", "category": "Business", "date": "Apr 25", "summary": "New partnership provides collateral-free credit lines specifically for women entrepreneurs.", "image": "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=250&fit=crop", "url": "https://www.google.com/search?q=Uganda+women+SME+loans"},
        {"title": "Fintech Investment Triples in Kampala", "category": "Technology", "date": "Apr 24", "summary": "Ugandan fintech startups raise $120M in Q1, triple the amount from last year.", "image": "https://images.unsplash.com/photo-1559526324-593bc073d938?w=400&h=250&fit=crop", "url": "https://www.google.com/search?q=Uganda+fintech+investment"},
        {"title": "Cross-Border Mobile Payments Launch", "category": "Technology", "date": "Apr 23", "summary": "New interoperability allows Ugandans to send mobile money to Kenya and Tanzania directly.", "image": "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=250&fit=crop", "url": "https://www.google.com/search?q=East+Africa+cross+border+mobile+money"},
        {"title": "Solar Home Systems Reach 2M Households", "category": "Energy", "date": "Apr 22", "summary": "Off-grid solar adoption passes milestone, providing clean energy to rural communities.", "image": "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=250&fit=crop", "url": "https://www.google.com/search?q=Uganda+solar+home+systems"},
        {"title": "Credit Scoring Expands to Rural Areas", "category": "Finance", "date": "Apr 21", "summary": "Alternative credit scoring using mobile money data now available for rural borrowers.", "image": "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=250&fit=crop", "url": "https://www.google.com/search?q=Uganda+alternative+credit+scoring+rural"},
        {"title": "National ID Digital Verification Live", "category": "Technology", "date": "Apr 20", "summary": "NIRA launches API for instant National ID verification enabling faster KYC processes.", "image": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=250&fit=crop", "url": "https://www.google.com/search?q=Uganda+NIRA+digital+ID+verification"},
        {"title": "Microfinance Sector Grows 18%", "category": "Finance", "date": "Apr 19", "summary": "Uganda microfinance institutions report portfolio growth driven by digital lending.", "image": "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=250&fit=crop", "url": "https://www.google.com/search?q=Uganda+microfinance+sector+growth"},
        {"title": "Affordable Housing Loan Program Expanded", "category": "Business", "date": "Apr 18", "summary": "New low-interest housing loans available for teachers and civil servants across Uganda.", "image": "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=250&fit=crop", "url": "https://www.google.com/search?q=Uganda+affordable+housing+loans"},
        {"title": "Internet Penetration Hits 60%", "category": "Technology", "date": "Apr 17", "summary": "Mobile internet subscriptions surge as data costs drop by 40% year-on-year.", "image": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=250&fit=crop", "url": "https://www.google.com/search?q=Uganda+internet+penetration"},
        {"title": "Crop Insurance for Smallholder Farmers", "category": "Agriculture", "date": "Apr 16", "summary": "Satellite-based crop insurance product launched protecting farmers against drought.", "image": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=250&fit=crop", "url": "https://www.google.com/search?q=Uganda+crop+insurance+farmers"},
        {"title": "Kampala Startup Ecosystem Ranked Top 10", "category": "Business", "date": "Apr 15", "summary": "Kampala named among fastest-growing startup hubs in Africa by international index.", "image": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=250&fit=crop", "url": "https://www.google.com/search?q=Kampala+startup+ecosystem+ranking"},
    ]
    day_seed = (datetime.now().year * 365 + datetime.now().month * 30 + datetime.now().day) % len(_all_news)
    news_items = _all_news[day_seed:] + _all_news[:day_seed]
    return render_template('dashboard.html', user=user, loans=loans, transactions=transactions, news_items=news_items, pending_loans=pending_loans, kyc_status=kyc_status, score_tier=score_tier, loan_summary=loan_summary, repayment_progress=repayment_progress, loan_history_labels=loan_history_labels, loan_history_data=loan_history_data)

@app.route('/apply_loan', methods=['GET', 'POST'])
@login_required
def apply_loan():
    if session.get('role') == 'admin':
        flash('Admins cannot apply for loans. Register a regular account to borrow.', 'danger')
        return redirect(url_for('admin_dashboard'))
    form = LoanApplicationForm()
    if request.method == 'POST' and form.validate_on_submit():
        cursor = mysql.connection.cursor()
        try:
            cursor.execute('SELECT kyc_status FROM users WHERE user_id = %s', (session['user_id'],))
            user = cursor.fetchone()
            is_admin = session.get('role') == 'admin'
            if not is_admin and (not user or user.get('kyc_status') != 'verified'):
                flash('Please complete KYC verification before applying for a loan', 'warning')
                return redirect(url_for('kyc_upload'))

            loan_id = generate_user_id()
            interest_rate = get_interest_rate(session['user_id'])
            due_date = calculate_due_date(form.term_months.data)

            cursor.execute('''
                INSERT INTO loans (loan_id, user_id, amount, purpose, term_months, interest_rate, status, due_date)
                VALUES (%s, %s, %s, %s, %s, %s, "pending", %s)
            ''', (loan_id, session['user_id'], form.amount.data, form.purpose.data, form.term_months.data, interest_rate, due_date))

            block_index = get_last_block_index()
            blockchain.add_transaction('YoCoin System', session['user_id'], float(form.amount.data), 'Loan application submitted')
            new_block = blockchain.new_block(blockchain.proof_of_work(block_index))
            cursor.execute('INSERT INTO blockchain_transactions (transaction_id, block_index, sender_address, recipient_address, amount, message, transaction_hash) VALUES (%s, %s, %s, %s, %s, %s, %s)',
                (generate_user_id(), new_block.index, 'YoCoin System', session['user_id'], form.amount.data, f'Loan #{loan_id}', hashlib.sha256(f'{loan_id}{datetime.now().isoformat()}'.encode()).hexdigest()))
            mysql.connection.commit()

            cursor.execute('SELECT email, name FROM users WHERE user_id = %s', (session['user_id'],))
            user_info = cursor.fetchone()
            notifications.notify_loan_submitted(session['user_id'], user_info['email'], user_info['name'], form.amount.data)

            notify_admins(mysql, 'loan_submitted', f'New Loan Application', f'{user_info["name"]} applied for UGX {form.amount.data:,.0f}', loan_id)

            log_action(mysql, 'loan_applied', session['user_id'], 'loan', loan_id, f'Loan application: {form.amount.data} UGX', request)

            flash('Loan application submitted!', 'success')
            return redirect(url_for('dashboard'))
        except Exception:
            mysql.connection.rollback()
            flash('Application failed. Try again.', 'danger')
        finally:
            cursor.close()
    return render_template('apply_loan.html', form=form)

@app.route("/repayment", methods=["GET", "POST"])
@login_required
def repayment():
    if session.get('role') == 'admin':
        flash('Admins cannot repay loans. Log in with a regular account.', 'danger')
        return redirect(url_for('admin_dashboard'))
    cursor = mysql.connection.cursor()
    try:
        cursor.execute("""
            SELECT loan_id, amount, amount - COALESCE((SELECT SUM(amount) FROM loan_repayments WHERE loan_id = loans.loan_id), 0) as balance,
            interest_rate, term_months, application_date, due_date
            FROM loans WHERE user_id = %s AND status IN ("approved", "disbursed")
        """, (session["user_id"],))
        active_loans = cursor.fetchall()

        if not active_loans:
            flash("No active loans to repay", "info")
            return redirect(url_for("apply_loan"))

        form = RepaymentForm()
        form.loan_id.choices = [(loan["loan_id"], f'Loan #{loan["loan_id"][:8]} - Balance: UGX {loan["balance"]:,.0f}') for loan in active_loans]

        if request.method == "POST" and form.validate_on_submit():
            selected_loan = next((l for l in active_loans if l["loan_id"] == form.loan_id.data), None)
            if not selected_loan:
                flash("Invalid loan selected", "danger")
                return redirect(url_for("repayment"))

            try:
                payment_amount = float(form.amount.data.replace(',', ''))
            except (ValueError, AttributeError):
                flash("Invalid payment amount", "danger")
                return redirect(url_for("repayment"))
            if payment_amount > float(selected_loan["balance"]):
                flash("Payment exceeds remaining balance", "warning")
                return redirect(url_for("repayment"))
            if payment_amount < 1000:
                flash("Minimum payment is UGX 1,000", "warning")
                return redirect(url_for("repayment"))

            try:
                account = form.account_number.data or ''
                payment_method_label = dict(form.payment_method.choices).get(form.payment_method.data, form.payment_method.data)
                use_api = request.form.get('use_api', 'false').lower() == 'true'

                cash_reference = None
                if form.payment_method.data == 'cash':
                    cash_ref_num = secrets.token_hex(4).upper()
                    cash_reference = f'YOC-CASH-{cash_ref_num}'
                    notify_user(mysql, session['user_id'], 'payment_instruction',
                        'Cash Payment Reference',
                        f'Your cash payment reference is {cash_reference}. '
                        f'Amount: UGX {payment_amount:,.0f}. '
                        f'Give this reference to the admin when making payment.',
                        form.loan_id.data)
                    flash(f'Cash payment reference: {cash_reference}. Show this to the admin.', 'info')

                if use_api and form.payment_method.data == 'mobile_money':
                    cursor.execute('SELECT phone FROM users WHERE user_id = %s', (session['user_id'],))
                    user_phone = cursor.fetchone()
                    success, txn_id, message, prov = mobile_money.collect_payment(
                        payment_amount, user_phone['phone'], 'auto', form.loan_id.data, session['user_id']
                    )
                    if not success:
                        flash(f'Mobile Money API: {message}. Try manual payment.', 'warning')
                        return redirect(url_for("repayment"))
                    flash(f'Payment request sent via {prov.upper()}. Check your phone. Ref: {txn_id[:12]}', 'info')

                stored_method = account if account else form.payment_method.data

                repayment_id = generate_user_id()
                cursor.execute("""
                    INSERT INTO loan_repayments (repayment_id, loan_id, user_id, amount, due_date, payment_method, payment_date, status, transaction_reference)
                    VALUES (%s, %s, %s, %s, %s, %s, NOW(), "paid", %s)
                """, (repayment_id, form.loan_id.data, session["user_id"], payment_amount, selected_loan['due_date'], stored_method, cash_reference or form.transaction_reference.data or None))

                cursor.execute('UPDATE token_balances SET balance = balance - %s WHERE address = %s',
                              (payment_amount, session["user_id"]))
                new_balance = float(selected_loan["balance"]) - payment_amount
                was_on_time = selected_loan.get('due_date') is None or datetime.now() <= selected_loan['due_date']
                days_early = max(0, (selected_loan['due_date'] - datetime.now()).days) if selected_loan.get('due_date') else 0

                if new_balance <= 0:
                    cursor.execute('UPDATE loans SET status = "repaid" WHERE loan_id = %s', (form.loan_id.data,))
                    flash("Loan fully repaid! Congratulations!", "success")
                    trigger_score_recalculation(mysql, session["user_id"], 'loan_repaid', {
                        'loan_amount': selected_loan["amount"],
                        'total_paid': selected_loan["amount"]
                    })
                else:
                    flash(f"Payment of UGX {payment_amount:,.0f} recorded. Remaining: UGX {new_balance:,.0f}", "success")

                trigger_score_recalculation(mysql, session["user_id"], 'repayment', {
                    'amount': payment_amount,
                    'loan_amount': selected_loan["amount"],
                    'was_on_time': was_on_time,
                    'days_early': days_early
                })

                blockchain.add_transaction(session["user_id"], "YoCoin System", payment_amount, f'Loan repayment for {form.loan_id.data[:8]}')
                new_block = blockchain.new_block(blockchain.proof_of_work(get_last_block_index()))
                cursor.execute("""
                    INSERT INTO blockchain_transactions (transaction_id, block_index, sender_address, recipient_address, amount, message, transaction_hash)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (generate_user_id(), new_block.index, session["user_id"], "YoCoin System", payment_amount, f'Repayment - Loan {form.loan_id.data[:8]}', hashlib.sha256(f'repay{form.loan_id.data}{datetime.now().isoformat()}'.encode()).hexdigest()))

                mysql.connection.commit()

                cursor.execute('SELECT email, name FROM users WHERE user_id = %s', (session["user_id"],))
                user_info = cursor.fetchone()
                notifications.notify_repayment_received(session["user_id"], user_info['email'], user_info['name'], payment_amount, form.loan_id.data)

                log_action(mysql, 'repayment_made', session["user_id"], 'repayment', repayment_id, f'Payment: {payment_amount} UGX {payment_method_label} for loan {form.loan_id.data[:8]}', request)

                return redirect(url_for("dashboard"))
            except Exception as e:
                mysql.connection.rollback()
                flash(f"Payment failed: {str(e)}", "danger")
    finally:
        cursor.close()
    return render_template("repayment.html", form=form, active_loans=active_loans)

@app.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('SELECT * FROM users WHERE user_id = %s', (session['user_id'],))
        user = cursor.fetchone()

        if request.method == 'POST':
            name = request.form.get('name')
            phone = request.form.get('phone')

            profile_image = user['image_file'] if user else None
            if 'picture' in request.files:
                file = request.files['picture']
                if file and file.filename != '':
                    if file and allowed_file(file.filename):
                        is_valid, _ = validate_file_magic(file.stream)
                        if is_valid:
                            filename = secure_filename(f"{session['user_id']}_{file.filename}")
                            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                            file.save(filepath)
                            profile_image = filename
                        else:
                            flash('Invalid file content. Please upload a valid image.', 'danger')
                            return redirect(url_for('profile'))

            cursor.execute('''UPDATE users SET name = %s, phone = %s, image_file = %s WHERE user_id = %s''',
                            (name, phone, profile_image, session['user_id']))
            mysql.connection.commit()
            session['name'] = name
            session['profile_image'] = profile_image
            flash('Profile updated successfully!', 'success')

            log_action(mysql, 'profile_updated', session['user_id'], 'user', session['user_id'], 'Profile updated', request)

            cursor.execute('SELECT * FROM users WHERE user_id = %s', (session['user_id'],))
            user = cursor.fetchone()
    finally:
        cursor.close()
    return render_template('profile.html', user=user)

@app.route('/password-reset', methods=['GET', 'POST'])
@limiter.limit("10 per hour")
def password_reset_request():
    form = PasswordResetRequestForm()
    if request.method == 'POST' and form.validate_on_submit():
        cursor = mysql.connection.cursor()
        try:
            cursor.execute('''
                SELECT u.user_id, u.name, ua.recovery_question
                FROM users u JOIN user_auth ua ON u.user_id = ua.user_id
                WHERE u.email = %s
            ''', (form.email.data,))
            user = cursor.fetchone()

            if user and user.get('recovery_question'):
                session['reset_user_id'] = user['user_id']
                session['reset_email'] = form.email.data
                flash('Security question found. Please answer to reset your password.', 'info')
                return redirect(url_for('password_reset_verify'))
            else:
                flash('If an account exists with that email, you will receive reset instructions.', 'info')
        finally:
            cursor.close()
    return render_template('password_reset_request.html', form=form)

@app.route('/password-reset/verify', methods=['GET', 'POST'])
@limiter.limit("20 per hour")
def password_reset_verify():
    if 'reset_user_id' not in session:
        return redirect(url_for('password_reset_request'))

    cursor = mysql.connection.cursor()
    try:
        cursor.execute('SELECT recovery_question FROM user_auth WHERE user_id = %s', (session['reset_user_id'],))
        auth_data = cursor.fetchone()
    finally:
        cursor.close()

    if not auth_data or not auth_data.get('recovery_question'):
        flash('No security question set for this account.', 'danger')
        return redirect(url_for('password_reset_request'))

    form = PasswordResetForm()
    if request.method == 'POST' and form.validate_on_submit():
        cursor = mysql.connection.cursor()
        try:
            cursor.execute('SELECT recovery_answer_hash FROM user_auth WHERE user_id = %s', (session['reset_user_id'],))
            auth_data = cursor.fetchone()

            if auth_data and verify_password(form.recovery_answer.data.lower().strip(), auth_data['recovery_answer_hash']):
                hashed_pw = hash_password(form.new_password.data)
                cursor.execute('''
                    UPDATE user_auth SET password_hash = %s, last_password_change = NOW()
                    WHERE user_id = %s
                ''', (hashed_pw, session['reset_user_id']))
                mysql.connection.commit()

                log_action(mysql, 'password_reset', session['reset_user_id'], 'user', session['reset_user_id'], 'Password reset completed', request)

                session.pop('reset_user_id', None)
                session.pop('reset_email', None)
                flash('Password reset successfully! Please log in.', 'success')
                return redirect(url_for('login'))
            else:
                flash('Incorrect security answer.', 'danger')
        finally:
            cursor.close()
    return render_template('password_reset_verify.html', form=form, question=auth_data['recovery_question'])

@app.route('/kyc/upload', methods=['GET', 'POST'])
@login_required
def kyc_upload():
    form = KYCUploadForm()
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('SELECT kyc_status FROM users WHERE user_id = %s', (session['user_id'],))
        user = cursor.fetchone()
        kyc_status = user['kyc_status'] if user else 'not_started'

        cursor.execute('''
            SELECT document_type, status, uploaded_at FROM kyc_documents
            WHERE user_id = %s ORDER BY uploaded_at DESC
        ''', (session['user_id'],))
        uploaded_docs = cursor.fetchall()
    finally:
        cursor.close()

    if request.method == 'POST' and form.validate_on_submit():
        if 'document' not in request.files:
            flash('No file selected', 'danger')
            return redirect(url_for('kyc_upload'))

        file = request.files['document']
        if not file or file.filename == '':
            flash('No file selected', 'danger')
            return redirect(url_for('kyc_upload'))

        if not allowed_file(file.filename, ALLOWED_KYC_EXTENSIONS):
            flash('Invalid file type. Allowed: PNG, JPG, JPEG, PDF', 'danger')
            return redirect(url_for('kyc_upload'))

        is_valid, file_type = validate_file_magic(file.stream)
        if not is_valid:
            flash('Invalid file content. Please upload a valid document.', 'danger')
            return redirect(url_for('kyc_upload'))

        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = secure_filename(f"{session['user_id']}_{form.document_type.data}_{datetime.now().strftime('%Y%m%d%H%M%S')}.{ext}")
        folder = os.path.join(app.config['KYC_UPLOAD_FOLDER'], str(session['user_id']))
        os.makedirs(folder, exist_ok=True)
        filepath = os.path.join(folder, filename)
        file.save(filepath)

        relative_path = f"kyc/{session['user_id']}/{filename}"

        cursor = mysql.connection.cursor()
        try:
            cursor.execute('''
                INSERT INTO kyc_documents (user_id, document_type, file_path, status)
                VALUES (%s, %s, %s, 'pending')
            ''', (session['user_id'], form.document_type.data, relative_path))

            cursor.execute('''
                UPDATE users SET kyc_status = 'in_progress'
                WHERE user_id = %s AND kyc_status = 'not_started'
            ''', (session['user_id'],))
            mysql.connection.commit()

            log_action(mysql, 'kyc_uploaded', session['user_id'], 'kyc', form.document_type.data, f'KYC document uploaded: {form.document_type.data}', request)

            flash('Document uploaded successfully!', 'success')
        except Exception:
            mysql.connection.rollback()
            flash('Upload failed. Try again.', 'danger')
        finally:
            cursor.close()

        return redirect(url_for('kyc_upload'))

    return render_template('kyc_upload.html', form=form, kyc_status=kyc_status, uploaded_docs=uploaded_docs)

@app.route('/kyc/status')
@login_required
def kyc_status_page():
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('SELECT kyc_status FROM users WHERE user_id = %s', (session['user_id'],))
        user = cursor.fetchone()
        kyc_status = user['kyc_status'] if user else 'not_started'

        cursor.execute('''
            SELECT document_type, status, uploaded_at, rejection_reason
            FROM kyc_documents WHERE user_id = %s ORDER BY uploaded_at DESC
        ''', (session['user_id'],))
        uploaded_docs = cursor.fetchall()

        required = ['national_id_front', 'national_id_back', 'selfie']
        uploaded_types = {doc['document_type'] for doc in uploaded_docs if doc['status'] != 'rejected'}
        completion = len(uploaded_types & set(required)) / len(required) * 100
    finally:
        cursor.close()

    return render_template('kyc_status.html', kyc_status=kyc_status, uploaded_docs=uploaded_docs, completion=int(completion), required=required)

@app.route('/logout')
def logout():
    if 'user_id' in session:
        cursor = mysql.connection.cursor()
        try:
            cursor.execute('UPDATE user_sessions SET is_active = FALSE WHERE user_id = %s AND is_active = TRUE', (session['user_id'],))
            mysql.connection.commit()
        finally:
            cursor.close()
    log_action(mysql, 'user_logout', session.get('user_id'), 'user', session.get('user_id'), 'User logged out', request)
    session.clear()
    flash('You have been logged out', 'info')
    return redirect(url_for('home'))

@app.route('/admin')
@login_required
@admin_required
def admin_dashboard():
    page = request.args.get('page', 1, type=int)
    per_page = 20
    offset = (page - 1) * per_page

    cursor = mysql.connection.cursor()
    try:
        cursor.execute("""
            SELECT l.*, u.name, u.email, u.phone, u.region, u.credit_score
            FROM loans l JOIN users u ON l.user_id = u.user_id
            WHERE l.status = 'pending' ORDER BY l.application_date DESC LIMIT %s OFFSET %s
        """, (per_page, offset))
        pending_loans = cursor.fetchall()

        cursor.execute("SELECT COUNT(*) as cnt FROM loans WHERE status = 'pending'")
        total_pending = cursor.fetchone()['cnt']

        cursor.execute("""
            SELECT COUNT(*) as total,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as total_approved
            FROM loans
        """)
        stats = cursor.fetchall()[0]

        cursor.execute("""
            SELECT l.*, u.name FROM loans l JOIN users u ON l.user_id = u.user_id
            WHERE l.status = 'approved' ORDER BY l.application_date DESC LIMIT 10
        """)
        recent_approved = cursor.fetchall()

        cursor.execute('SELECT COUNT(*) as cnt FROM users')
        system_users = cursor.fetchone()['cnt']

        cursor.execute('SELECT COUNT(*) as cnt FROM blockchain_blocks')
        system_blocks = cursor.fetchone()['cnt']

        cursor.execute("SELECT COUNT(*) as overdue FROM loans WHERE status IN ('approved', 'disbursed') AND due_date < NOW()")
        overdue_loans = cursor.fetchone()['overdue']

        cursor.execute("SELECT COUNT(*) as defaulted FROM loans WHERE status = 'defaulted'")
        defaulted_loans = cursor.fetchone()['defaulted']
    finally:
        cursor.close()

    try:
        chain_valid = blockchain.verify_chain()
    except Exception:
        chain_valid = False

    total_pages = (total_pending + per_page - 1) // per_page
    return render_template('admin_dashboard.html', pending_loans=pending_loans, stats=stats,
                          recent_approved=recent_approved, page=page, total_pages=total_pages,
                          system_users=system_users, system_blocks=system_blocks,
                          overdue_loans=overdue_loans, defaulted_loans=defaulted_loans,
                          chain_valid=chain_valid)

@app.route('/admin/loan/<loan_id>/approve', methods=['POST'])
@login_required
@admin_required
def approve_loan(loan_id):
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('SELECT * FROM loans WHERE loan_id = %s', (loan_id,))
        loan = cursor.fetchone()
        if not loan:
            flash('Loan not found', 'danger')
            return redirect(url_for('admin_dashboard'))

        if loan['user_id'] == session['user_id']:
            flash('You cannot approve your own loan request.', 'danger')
            return redirect(url_for('admin_dashboard'))

        due_date = calculate_due_date(loan['term_months'])
        cursor.execute('UPDATE loans SET status = "approved", approval_date = NOW(), due_date = %s WHERE loan_id = %s', (due_date, loan_id))

        blockchain.add_transaction('YoCoin System', loan['user_id'], float(loan['amount']), 'Loan approved')
        new_block = blockchain.new_block(blockchain.proof_of_work(get_last_block_index()))
        cursor.execute("""
            INSERT INTO blockchain_transactions (transaction_id, block_index, sender_address, recipient_address, amount, message, transaction_hash)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (generate_user_id(), new_block.index, 'YoCoin System', loan['user_id'], loan['amount'], 'Loan Approved', hashlib.sha256(f'approve{loan_id}{datetime.now().isoformat()}'.encode()).hexdigest()))
        mysql.connection.commit()

        cursor.execute('SELECT email, name FROM users WHERE user_id = %s', (loan['user_id'],))
        user_info = cursor.fetchone()
        notifications.notify_loan_approved(loan['user_id'], user_info['email'], user_info['name'], loan['amount'], loan_id)

        inner_cursor = mysql.connection.cursor()
        try:
            inner_cursor.execute('''
                INSERT INTO admin_notifications (admin_user_id, notification_type, title, message, related_id)
                SELECT user_id, 'loan_approved', 'Loan Approved', %s, %s FROM admins
            ''', (f'Loan {loan_id[:8]} for UGX {loan["amount"]:,.0f} has been approved', loan_id))
            notify_user(mysql, loan['user_id'], 'loan_approved', 'Loan Approved!', f'Your loan of UGX {loan["amount"]:,.0f} has been approved.', loan_id)
            mysql.connection.commit()
        finally:
            inner_cursor.close()

        cursor.execute('SELECT referred_by FROM users WHERE user_id = %s', (loan['user_id'],))
        borrower = cursor.fetchone()
        if borrower and borrower['referred_by']:
            cursor.execute('SELECT user_id FROM users WHERE referral_code = %s', (borrower['referred_by'],))
            referrer = cursor.fetchone()
            if referrer:
                cursor.execute('SELECT COUNT(*) as cnt FROM loans WHERE user_id = %s AND status IN ("approved", "disbursed", "repaid")', (loan['user_id'],))
                loan_count = cursor.fetchone()['cnt']
                if loan_count == 1:
                    cursor.execute('UPDATE referrals SET is_rewarded = TRUE WHERE referred_id = %s AND is_rewarded = FALSE', (loan['user_id'],))
                    cursor.execute('UPDATE token_balances SET balance = balance + 5000 WHERE address = %s', (referrer['user_id'],))
                    notify_admins(mysql, 'referral_rewarded', 'Referral Reward', f'Referrer {referrer["user_id"][:8]} earned 5,000 UGX for referring {user_info["name"]}')

        log_action(mysql, 'loan_approved', session['user_id'], 'loan', loan_id, f'Approved loan {loan_id} for {loan["amount"]} UGX', request)

        trigger_score_recalculation(mysql, loan['user_id'], 'loan_approved', {'loan_amount': float(loan['amount'])})
        query_cache.invalidate_user_cache(loan['user_id'])

        flash('Loan approved!', 'success')
    except Exception as e:
        mysql.connection.rollback()
        flash(f'Error: {str(e)}', 'danger')
    finally:
        cursor.close()
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/loan/<loan_id>/reject', methods=['POST'])
@login_required
@admin_required
def reject_loan(loan_id):
    reason = request.form.get('reason', 'Not specified')
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('SELECT user_id FROM loans WHERE loan_id = %s', (loan_id,))
        loan = cursor.fetchone()
        if not loan:
            flash('Loan not found', 'danger')
            return redirect(url_for('admin_dashboard'))
        if loan['user_id'] == session['user_id']:
            flash('You cannot reject your own loan request.', 'danger')
            return redirect(url_for('admin_dashboard'))
        cursor.execute('UPDATE loans SET status = "rejected", rejection_reason = %s, rejection_date = NOW() WHERE loan_id = %s', (reason, loan_id))
        mysql.connection.commit()

        cursor.execute('SELECT email, name FROM users WHERE user_id = %s', (loan['user_id'],))
        user_info = cursor.fetchone()
        notifications.notify_loan_rejected(loan['user_id'], user_info['email'], user_info['name'], reason)

        cursor2 = mysql.connection.cursor()
        try:
            cursor2.execute('''
                INSERT INTO admin_notifications (admin_user_id, notification_type, title, message, related_id)
                SELECT user_id, 'loan_rejected', 'Loan Rejected', %s, %s FROM admins
            ''', (f'Loan {loan_id[:8]} for {user_info["name"]} rejected: {reason}', loan_id))
            notify_user(mysql, loan['user_id'], 'loan_rejected', 'Loan Application Rejected', f'Your loan application was rejected. Reason: {reason}', loan_id)
            mysql.connection.commit()
        finally:
            cursor2.close()

        log_action(mysql, 'loan_rejected', session['user_id'], 'loan', loan_id, f'Rejected loan {loan_id}: {reason}', request)
        trigger_score_recalculation(mysql, loan['user_id'], 'loan_rejected')

        flash('Loan rejected', 'info')
    except Exception as e:
        mysql.connection.rollback()
        flash(f'Error: {str(e)}', 'danger')
    finally:
        cursor.close()
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/users')
@login_required
@admin_required
def admin_users():
    page = request.args.get('page', 1, type=int)
    per_page = 20
    offset = (page - 1) * per_page

    cursor = mysql.connection.cursor()
    try:
        cursor.execute('SELECT COUNT(*) as cnt FROM users')
        total_users = cursor.fetchone()['cnt']

        cursor.execute('''
            SELECT u.*,
                COALESCE((SELECT SUM(amount) FROM loans WHERE user_id = u.user_id AND status = 'disbursed'), 0) -
                COALESCE((SELECT SUM(amount) FROM loan_repayments WHERE user_id = u.user_id), 0) as yocoin_balance
            FROM users u
            ORDER BY u.registration_date DESC LIMIT %s OFFSET %s
        ''', (per_page, offset))
        users = cursor.fetchall()
    finally:
        cursor.close()

    total_pages = (total_users + per_page - 1) // per_page
    return render_template('admin_users.html', users=users, page=page, total_pages=total_pages)

@app.route('/admin/kyc')
@login_required
@admin_required
def admin_kyc():
    page = request.args.get('page', 1, type=int)
    per_page = 20
    offset = (page - 1) * per_page

    cursor = mysql.connection.cursor()
    try:
        cursor.execute('''
            SELECT k.*, u.name, u.email FROM kyc_documents k
            JOIN users u ON k.user_id = u.user_id
            WHERE k.status = 'pending' ORDER BY k.uploaded_at DESC LIMIT %s OFFSET %s
        ''', (per_page, offset))
        pending_docs = cursor.fetchall()

        cursor.execute("SELECT COUNT(*) as cnt FROM kyc_documents WHERE status = 'pending'")
        total_pending = cursor.fetchone()['cnt']
    finally:
        cursor.close()

    total_pages = (total_pending + per_page - 1) // per_page
    return render_template('admin_kyc.html', pending_docs=pending_docs, page=page, total_pages=total_pages)

@app.route('/admin/kyc/<doc_id>/approve', methods=['POST'])
@login_required
@admin_required
def approve_kyc(doc_id):
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('UPDATE kyc_documents SET status = "approved", verified_at = NOW() WHERE id = %s', (doc_id,))
        cursor.execute('SELECT user_id FROM kyc_documents WHERE id = %s', (doc_id,))
        doc = cursor.fetchone()
        if doc:
            cursor.execute('''
                UPDATE users SET kyc_status = 'verified'
                WHERE user_id = %s AND user_id NOT IN (
                    SELECT user_id FROM kyc_documents WHERE status = 'pending' OR status = 'rejected'
                )
            ''', (doc['user_id'],))
        mysql.connection.commit()
        if doc:
            trigger_score_recalculation(mysql, doc['user_id'], 'kyc_verified')
            query_cache.invalidate_user_cache(doc['user_id'])
        log_action(mysql, 'kyc_approved', session['user_id'], 'kyc', doc_id, f'KYC document {doc_id} approved', request)
        flash('KYC document approved', 'success')
    except Exception as e:
        mysql.connection.rollback()
        flash(f'Error: {str(e)}', 'danger')
    finally:
        cursor.close()
    return redirect(url_for('admin_kyc'))

@app.route('/admin/kyc/<doc_id>/reject', methods=['POST'])
@login_required
@admin_required
def reject_kyc(doc_id):
    reason = request.form.get('reason', 'Document unclear')
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('UPDATE kyc_documents SET status = "rejected", rejection_reason = %s WHERE id = %s', (reason, doc_id))
        mysql.connection.commit()
        log_action(mysql, 'kyc_rejected', session['user_id'], 'kyc', doc_id, f'KYC document {doc_id} rejected: {reason}', request)
        flash('KYC document rejected', 'info')
    except Exception as e:
        mysql.connection.rollback()
        flash(f'Error: {str(e)}', 'danger')
    finally:
        cursor.close()
    return redirect(url_for('admin_kyc'))

@app.route('/admin/audit')
@login_required
@admin_required
def admin_audit():
    page = request.args.get('page', 1, type=int)
    per_page = 50
    offset = (page - 1) * per_page

    cursor = mysql.connection.cursor()
    try:
        cursor.execute('SELECT COUNT(*) as cnt FROM audit_log')
        total = cursor.fetchone()['cnt']

        cursor.execute('SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT %s OFFSET %s', (per_page, offset))
        logs = cursor.fetchall()
    finally:
        cursor.close()

    total_pages = (total + per_page - 1) // per_page
    return render_template('admin_audit.html', logs=logs, page=page, total_pages=total_pages)

@app.route('/admin/monitoring')
@login_required
@admin_required
def admin_monitoring():
    alerts = detect_suspicious_activity(mysql)
    return render_template('admin_monitoring.html', alerts=alerts)

@app.route('/admin/cleanup', methods=['POST'])
@login_required
@admin_required
def admin_cleanup():
    """Clean up old audit logs and expired sessions"""
    cursor = mysql.connection.cursor()
    try:
        retention_days = int(request.form.get('retention_days', 90))
        cutoff = datetime.now() - timedelta(days=retention_days)

        cursor.execute('DELETE FROM audit_log WHERE timestamp < %s', (cutoff,))
        audit_deleted = cursor.rowcount

        cursor.execute('DELETE FROM notification_log WHERE created_at < %s', (cutoff,))
        notification_deleted = cursor.rowcount

        mysql.connection.commit()
        logger.info(f'Cleanup: deleted {audit_deleted} audit logs, {notification_deleted} notification logs older than {retention_days} days')
        flash(f'Cleaned up {audit_deleted} audit logs and {notification_deleted} notification logs', 'success')
    except Exception as e:
        mysql.connection.rollback()
        flash(f'Cleanup failed: {str(e)}', 'danger')
    finally:
        cursor.close()
    return redirect(url_for('admin_monitoring'))

@app.route('/api/notifications')
@login_required
@limiter.limit("200 per hour")
def get_notifications():
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('''
            SELECT id, notification_type, title, message, related_id, is_read, created_at
            FROM admin_notifications WHERE admin_user_id = %s
            ORDER BY created_at DESC LIMIT 20
        ''', (session['user_id'],))
        notifs = cursor.fetchall()
        cursor.execute('SELECT COUNT(*) as cnt FROM admin_notifications WHERE admin_user_id = %s AND is_read = FALSE', (session['user_id'],))
        unread = cursor.fetchone()['cnt']
    finally:
        cursor.close()
    return {'notifications': notifs, 'unread': unread}

@app.route('/api/notifications/<int:notif_id>/read', methods=['POST'])
@login_required
def mark_notification_read(notif_id):
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('UPDATE admin_notifications SET is_read = TRUE WHERE id = %s AND admin_user_id = %s', (notif_id, session['user_id']))
        mysql.connection.commit()
    finally:
        cursor.close()
    return {'status': 'ok'}

@app.route('/api/notifications/read-all', methods=['POST'])
@login_required
def mark_all_notifications_read():
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('UPDATE admin_notifications SET is_read = TRUE WHERE admin_user_id = %s', (session['user_id'],))
        mysql.connection.commit()
    finally:
        cursor.close()
    return {'status': 'ok'}

def notify_admins(mysql, notification_type, title, message, related_id=None):
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('SELECT user_id FROM admins')
        admins = cursor.fetchall()
        for admin in admins:
            cursor.execute('''
                INSERT INTO admin_notifications (admin_user_id, notification_type, title, message, related_id)
                VALUES (%s, %s, %s, %s, %s)
            ''', (admin['user_id'], notification_type, title, message, related_id))
        mysql.connection.commit()
    except Exception as e:
        mysql.connection.rollback()
        logger.error(f'notify_admins failed: {e}')
    finally:
        cursor.close()

def notify_user(mysql, user_id, notification_type, title, message, related_id=None):
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('''
            INSERT INTO admin_notifications (admin_user_id, notification_type, title, message, related_id)
            VALUES (%s, %s, %s, %s, %s)
        ''', (user_id, notification_type, title, message, related_id))
        mysql.connection.commit()
    except Exception as e:
        mysql.connection.rollback()
        logger.error(f'notify_user failed: {e}')
    finally:
        cursor.close()

@app.route('/admin/system')
@login_required
@admin_required
def admin_system():
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('SELECT COUNT(*) as cnt FROM users')
        total_users = cursor.fetchone()['cnt']

        cursor.execute('SELECT COUNT(*) as cnt FROM loans')
        total_loans = cursor.fetchone()['cnt']

        cursor.execute('SELECT COUNT(*) as cnt FROM blockchain_blocks')
        total_blocks = cursor.fetchone()['cnt']

        cursor.execute('SELECT COUNT(*) as cnt FROM audit_log')
        total_audit = cursor.fetchone()['cnt']

        cursor.execute('SELECT COUNT(*) as cnt FROM kyc_documents WHERE status = "pending"')
        pending_kyc = cursor.fetchone()['cnt']

        cursor.execute("SELECT COUNT(*) as overdue FROM loans WHERE status IN ('approved', 'disbursed') AND due_date < NOW()")
        overdue_loans = cursor.fetchone()['overdue']

        cursor.execute("SELECT COUNT(*) as defaulted FROM loans WHERE status = 'defaulted'")
        defaulted_loans = cursor.fetchone()['defaulted']

        cursor.execute("SELECT COUNT(*) as pending FROM loans WHERE status = 'pending'")
        pending_loans = cursor.fetchone()['pending']

        cursor.execute("SELECT COALESCE(SUM(amount), 0) as total_volume FROM loans WHERE status IN ('approved', 'disbursed', 'repaid')")
        total_volume = cursor.fetchone()['total_volume']

        cursor.execute("SELECT COALESCE(SUM(balance), 0) as total_balance FROM token_balances")
        total_balance = cursor.fetchone()['total_balance']

        cursor.execute("SELECT COUNT(*) as cnt FROM kyc_documents")
        total_kyc = cursor.fetchone()['cnt']

        try:
            cursor.execute("SELECT COUNT(*) as cnt FROM notification_log")
            total_notifs = cursor.fetchone()['cnt']
        except Exception:
            total_notifs = 0
    finally:
        cursor.close()

    try:
        chain_valid = blockchain.verify_chain()
    except Exception:
        chain_valid = False

    import platform
    import flask
    start_time = app.config.get('START_TIME', datetime.now())
    uptime_seconds = (datetime.now() - start_time).total_seconds()
    uptime_days = int(uptime_seconds // 86400)
    uptime_hours = int((uptime_seconds % 86400) // 3600)
    uptime_mins = int((uptime_seconds % 3600) // 60)
    uptime_str = f'{uptime_days}d {uptime_hours}h {uptime_mins}m'
    try:
        import psutil
        mem = psutil.virtual_memory()
        memory_usage = f'{mem.percent}% ({mem.used // (1024**2)}MB / {mem.total // (1024**2)}MB)'
        cpu_percent = psutil.cpu_percent(interval=0.1)
        disk = psutil.disk_usage('/')
        disk_usage = f'{disk.percent}% ({disk.used // (1024**3)}GB / {disk.total // (1024**3)}GB)'
    except ImportError:
        memory_usage = 'N/A (install psutil)'
        cpu_percent = 0
        disk_usage = 'N/A (install psutil)'
    except Exception:
        memory_usage = 'N/A'
        cpu_percent = 0
        disk_usage = 'N/A'
    if not app.config.get('START_TIME'):
        app.config['START_TIME'] = datetime.now()
    return render_template('admin_system.html',
                          total_users=total_users,
                          total_loans=total_loans,
                          total_blocks=total_blocks,
                          total_audit=total_audit,
                          chain_valid=chain_valid,
                          overdue_loans=overdue_loans,
                          defaulted_loans=defaulted_loans,
                          pending_loans=pending_loans,
                          pending_kyc=pending_kyc,
                          total_volume=total_volume,
                          total_balance=total_balance,
                          total_kyc=total_kyc,
                          total_notifs=total_notifs,
                          uptime=uptime_str,
                          memory_usage=memory_usage,
                          cpu_percent=cpu_percent,
                          disk_usage=disk_usage,
                          db_host=app.config.get('MYSQL_HOST', 'localhost'),
                          flask_version=flask.__version__,
                          python_version=platform.python_version(),
                          csrf_enabled=app.config.get('WTF_CSRF_ENABLED', True))

@app.route('/loan/<loan_id>')
@login_required
def loan_details(loan_id):
    cursor = mysql.connection.cursor()
    try:
        where = 'l.loan_id = %s' if session.get('role') == 'admin' else 'l.loan_id = %s AND l.user_id = %s'
        params = (loan_id, session['user_id']) if session.get('role') != 'admin' else (loan_id,)
        cursor.execute(f'''
            SELECT l.*, u.name, u.email, u.phone, u.credit_score
            FROM loans l JOIN users u ON l.user_id = u.user_id
            WHERE {where}
        ''', params)
        loan = cursor.fetchone()
        if not loan:
            flash('Loan not found', 'danger')
            return redirect(url_for('dashboard'))
        cursor.execute('''
            SELECT * FROM loan_repayments WHERE loan_id = %s ORDER BY due_date ASC
        ''', (loan_id,))
        repayments = cursor.fetchall()
        cursor.execute('''
            SELECT * FROM late_fees WHERE loan_id = %s ORDER BY applied_at DESC
        ''', (loan_id,))
        fees = cursor.fetchall()
        cursor.execute('''
            SELECT * FROM blockchain_transactions WHERE loan_id = %s ORDER BY timestamp DESC
        ''', (loan_id,))
        txns = cursor.fetchall()
    finally:
        cursor.close()
    total_amount = loan['amount'] * (1 + loan['interest_rate'] / 100)
    total_paid = sum(r['amount'] for r in repayments if r['status'] == 'paid')
    balance = total_amount - total_paid
    return render_template('loan_details.html', loan=loan, repayments=repayments, fees=fees, txns=txns,
                          total_amount=total_amount, total_paid=total_paid, balance=balance)

@app.route('/transactions')
@login_required
def transactions_page():
    page = request.args.get('page', 1, type=int)
    per_page = 20
    offset = (page - 1) * per_page
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('''
            SELECT lr.*, l.amount as loan_amount, l.purpose
            FROM loan_repayments lr JOIN loans l ON lr.loan_id = l.loan_id
            WHERE l.user_id = %s ORDER BY lr.due_date DESC LIMIT %s OFFSET %s
        ''', (session['user_id'], per_page, offset))
        repayments = cursor.fetchall()
        cursor.execute('''
            SELECT COUNT(*) as cnt FROM loan_repayments lr
            JOIN loans l ON lr.loan_id = l.loan_id WHERE l.user_id = %s
        ''', (session['user_id'],))
        total = cursor.fetchone()['cnt']
        cursor.execute('''
            SELECT lf.*, l.amount as loan_amount FROM late_fees lf
            JOIN loans l ON lf.loan_id = l.loan_id WHERE lf.user_id = %s ORDER BY applied_at DESC
        ''', (session['user_id'],))
        fees = cursor.fetchall()
    finally:
        cursor.close()
    total_pages = (total + per_page - 1) // per_page
    return render_template('transactions.html', repayments=repayments, fees=fees, page=page, total_pages=total_pages)

@app.route('/export/statement')
@login_required
def export_statement():
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('''
            SELECT l.*, u.name FROM loans l JOIN users u ON l.user_id = u.user_id
            WHERE l.user_id = %s ORDER BY l.application_date DESC
        ''', (session['user_id'],))
        loans = cursor.fetchall()
        cursor.execute('''
            SELECT lr.*, l.amount as loan_amount, l.purpose
            FROM loan_repayments lr JOIN loans l ON lr.loan_id = l.loan_id
            WHERE l.user_id = %s ORDER BY lr.due_date DESC
        ''', (session['user_id'],))
        repayments = cursor.fetchall()
    finally:
        cursor.close()
    lines = ['YoCoin - Account Statement', f'Generated: {datetime.now().strftime("%Y-%m-%d %H:%M")}', '', 'LOANS',
             'Loan ID,Amount,Purpose,Status,Application Date,Due Date']
    for l in loans:
        app_date = l['application_date'].strftime('%Y-%m-%d') if l['application_date'] else 'N/A'
        due_date = l['due_date'].strftime('%Y-%m-%d') if l['due_date'] else 'N/A'
        lines.append(f'{l["loan_id"]},{l["amount"]},{l["purpose"]},{l["status"]},{app_date},{due_date}')
    lines.extend(['', 'REPAYMENTS', 'Repayment ID,Loan ID,Amount,Due Date,Payment Date,Status'])
    for r in repayments:
        due = r['due_date'].strftime('%Y-%m-%d') if r['due_date'] else 'N/A'
        paid = r['payment_date'].strftime('%Y-%m-%d') if r['payment_date'] else 'N/A'
        lines.append(f'{r["repayment_id"]},{r["loan_id"]},{r["amount"]},{due},{paid},{r["status"]}')
    response = app.response_class(response='\n'.join(lines), mimetype='text/csv',
                                  headers={'Content-Disposition': f'attachment;filename=statement_{session["user_id"][:8]}.csv'})
    return response

@app.route('/loan-calculator', methods=['GET', 'POST'])
@login_required
def loan_calculator():
    result = None
    if request.method == 'POST':
        amount = float(request.form.get('amount', 0))
        term = int(request.form.get('term', 3))
        rate = float(request.form.get('rate', 5))
        total = amount * (1 + rate / 100)
        monthly = total / term
        result = {'amount': amount, 'term': term, 'rate': rate, 'total': total, 'monthly': monthly}
    return render_template('loan_calculator.html', result=result)

@app.route('/admin/disburse/<loan_id>', methods=['POST'])
@login_required
@admin_required
def disburse_loan(loan_id):
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('SELECT l.*, u.phone FROM loans l JOIN users u ON l.user_id = u.user_id WHERE l.loan_id = %s AND l.status = "approved"', (loan_id,))
        loan = cursor.fetchone()
        if not loan:
            flash('Loan not found or not approved', 'danger')
        elif loan['user_id'] == session['user_id']:
            flash('You cannot disburse your own loan.', 'danger')
            cursor.close()
            return redirect(url_for('admin_dashboard'))
        else:
            method = request.form.get('method', 'mobile_money')
            use_api = request.form.get('use_api', 'false').lower() == 'true'

            # Update user's token balance on disbursement
            cursor.execute('UPDATE token_balances SET balance = balance + %s WHERE address = %s',
                          (float(loan['amount']), loan['user_id']))

            if use_api and method in ('mobile_money', 'mtn', 'airtel'):
                provider = 'auto' if method == 'mobile_money' else method
                success, txn_id, message, prov = mobile_money.disburse(
                    float(loan['amount']), loan['phone'], provider, loan_id, loan['user_id']
                )
                if success:
                    cursor.execute('UPDATE loans SET status = "disbursed", disbursement_date = NOW(), disbursement_method = %s, disbursed_by = %s WHERE loan_id = %s',
                                  (f'{prov}_api', session['user_id'], loan_id))
                    blockchain.add_transaction('YoCoin System', loan['user_id'], float(loan['amount']), f'Loan disbursed via {prov}')
                    mysql.connection.commit()
                    flash(f'Loan disbursed via {prov.upper()}! TxRef: {txn_id[:12]}', 'success')
                else:
                    flash(f'Mobile Money API: {message}. Try manual disbursement.', 'warning')
                    return redirect(url_for('admin_dashboard'))
            else:
                cursor.execute('UPDATE loans SET status = "disbursed", disbursement_date = NOW(), disbursement_method = %s, disbursed_by = %s WHERE loan_id = %s',
                              (method, session['user_id'], loan_id))
                blockchain.add_transaction('YoCoin System', loan['user_id'], float(loan['amount']), 'Loan disbursed')
                mysql.connection.commit()
                flash('Loan disbursed successfully!', 'success')
            
            trigger_score_recalculation(mysql, loan['user_id'], 'loan_approved', {'loan_amount': float(loan['amount'])})
            notify_admins(mysql, 'loan_disbursed', 'Loan Disbursed', f'Loan {loan_id[:8]} of UGX {loan["amount"]:,.0f} disbursed', loan_id)
            log_action(mysql, 'loan_disbursed', session['user_id'], 'loan', loan_id, f'Disbursed loan {loan_id}', request)
    except Exception as e:
        mysql.connection.rollback()
        flash(f'Disbursement failed: {str(e)}', 'danger')
    finally:
        cursor.close()
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/users/<user_id>')
@login_required
@admin_required
def admin_user_detail(user_id):
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('SELECT * FROM users WHERE user_id = %s', (user_id,))
        user = cursor.fetchone()
        if not user:
            flash('User not found', 'danger')
            return redirect(url_for('admin_users'))
        cursor.execute('SELECT * FROM loans WHERE user_id = %s ORDER BY application_date DESC', (user_id,))
        loans = cursor.fetchall()
        cursor.execute('SELECT * FROM kyc_documents WHERE user_id = %s ORDER BY uploaded_at DESC', (user_id,))
        kyc_docs = cursor.fetchall()
        cursor.execute('SELECT lr.*, l.amount as loan_amount FROM loan_repayments lr JOIN loans l ON lr.loan_id = l.loan_id WHERE lr.user_id = %s ORDER BY lr.due_date DESC LIMIT 20', (user_id,))
        repayments = cursor.fetchall()
        cursor.execute('SELECT * FROM audit_log WHERE user_id = %s ORDER BY timestamp DESC LIMIT 20', (user_id,))
        audit = cursor.fetchall()
    finally:
        cursor.close()
    return render_template('admin_user_detail.html', user=user, loans=loans, kyc_docs=kyc_docs, repayments=repayments, audit=audit)

@app.route('/admin/users/<user_id>/score', methods=['POST'])
@login_required
@admin_required
def admin_adjust_score(user_id):
    new_score = int(request.form.get('new_score', 500))
    reason = request.form.get('reason', 'Manual adjustment')
    new_score = max(300, min(850, new_score))
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('UPDATE users SET credit_score = %s WHERE user_id = %s', (new_score, user_id))
        mysql.connection.commit()
        log_action(mysql, 'score_adjusted', session['user_id'], 'user', user_id, f'Credit score adjusted to {new_score}: {reason}', request)
        flash(f'Credit score updated to {new_score}', 'success')
    except Exception as e:
        mysql.connection.rollback()
        flash(f'Failed: {str(e)}', 'danger')
    finally:
        cursor.close()
    return redirect(url_for('admin_user_detail', user_id=user_id))

@app.route('/admin/settings', methods=['GET', 'POST'])
@login_required
@admin_required
def admin_settings():
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('SELECT setting_key, setting_value, description FROM system_settings')
        settings = {s['setting_key']: s['setting_value'] for s in cursor.fetchall()}
        cursor.execute('SELECT setting_key, setting_value, description FROM system_settings')
        settings_list = cursor.fetchall()
    finally:
        cursor.close()
    if request.method == 'POST':
        for key in request.form:
            if key.startswith('setting_'):
                setting_key = key.replace('setting_', '')
                value = request.form[key]
                cursor = mysql.connection.cursor()
                try:
                    cursor.execute('UPDATE system_settings SET setting_value = %s WHERE setting_key = %s', (value, setting_key))
                    mysql.connection.commit()
                finally:
                    cursor.close()
        flash('Settings updated!', 'success')
        return redirect(url_for('admin_settings'))
    return render_template('admin_settings.html', settings=settings, settings_list=settings_list)

@app.route('/admin/bulk-action', methods=['POST'])
@login_required
@admin_required
def admin_bulk_action():
    action = request.form.get('action')
    ids = request.form.getlist('ids')
    if not ids:
        flash('No items selected', 'warning')
        return redirect(request.referrer or url_for('admin_dashboard'))
    cursor = mysql.connection.cursor()
    try:
        if action == 'approve_loans':
            for lid in ids:
                cursor.execute('UPDATE loans SET status = "approved", approval_date = NOW() WHERE loan_id = %s AND status = "pending"', (lid,))
            flash(f'{len(ids)} loans approved', 'success')
        elif action == 'reject_loans':
            reason = request.form.get('reason', 'Bulk rejection')
            for lid in ids:
                cursor.execute('UPDATE loans SET status = "rejected", rejection_reason = %s WHERE loan_id = %s AND status = "pending"', (reason, lid))
            flash(f'{len(ids)} loans rejected', 'success')
        elif action == 'approve_kyc':
            for did in ids:
                cursor.execute('UPDATE kyc_documents SET status = "approved", verified_at = NOW() WHERE id = %s AND status = "pending"', (did,))
            flash(f'{len(ids)} KYC documents approved', 'success')
        elif action == 'reject_kyc':
            reason = request.form.get('reason', 'Bulk rejection')
            for did in ids:
                cursor.execute('UPDATE kyc_documents SET status = "rejected", rejection_reason = %s WHERE id = %s AND status = "pending"', (reason, did))
            flash(f'{len(ids)} KYC documents rejected', 'success')
        mysql.connection.commit()
    except Exception as e:
        mysql.connection.rollback()
        flash(f'Bulk action failed: {str(e)}', 'danger')
    finally:
        cursor.close()
    return redirect(request.referrer or url_for('admin_dashboard'))

@app.route('/admin/reports')
@login_required
@admin_required
def admin_reports():
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('''
            SELECT COUNT(*) as total, SUM(amount) as total_amount FROM loans
        ''')
        loan_stats = cursor.fetchone()
        cursor.execute('''
            SELECT status, COUNT(*) as cnt, SUM(amount) as total FROM loans GROUP BY status
        ''')
        loan_by_status = cursor.fetchall()
        cursor.execute('''
            SELECT DATE(application_date) as date, COUNT(*) as cnt, SUM(amount) as total
            FROM loans GROUP BY DATE(application_date) ORDER BY date DESC LIMIT 30
        ''')
        loan_trend = cursor.fetchall()
        cursor.execute('''
            SELECT kyc_status, COUNT(*) as cnt FROM users GROUP BY kyc_status
        ''')
        kyc_stats = cursor.fetchall()
        cursor.execute('''
            SELECT u.region, COUNT(*) as users, AVG(u.credit_score) as avg_score
            FROM users u GROUP BY u.region ORDER BY users DESC
        ''')
        region_stats = cursor.fetchall()
        cursor.execute('''
            SELECT COUNT(*) as total, SUM(CASE WHEN is_read = FALSE THEN 1 ELSE 0 END) as unread
            FROM admin_notifications
        ''')
        notif_stats = cursor.fetchone()
    finally:
        cursor.close()
    return render_template('admin_reports.html', loan_stats=loan_stats, loan_by_status=loan_by_status,
                          loan_trend=loan_trend, kyc_stats=kyc_stats, region_stats=region_stats, notif_stats=notif_stats)

@app.route('/support', methods=['GET', 'POST'])
@login_required
def support():
    if request.method == 'POST':
        subject = request.form.get('subject', '')
        message = request.form.get('message', '')
        if subject and message:
            ticket_id = generate_user_id()
            cursor = mysql.connection.cursor()
            try:
                cursor.execute('SELECT name FROM users WHERE user_id = %s', (session['user_id'],))
                user = cursor.fetchone()
                cursor.execute('''
                    INSERT INTO support_tickets (ticket_id, user_id, subject, message)
                    VALUES (%s, %s, %s, %s)
                ''', (ticket_id, session['user_id'], subject, message))
                mysql.connection.commit()
                notify_admins(mysql, 'support_ticket', f'New Support Ticket', f'{user["name"] if user else "User"}: {subject}', ticket_id)
                flash('Support ticket submitted!', 'success')
            except Exception:
                mysql.connection.rollback()
                flash('Failed to submit ticket', 'danger')
            finally:
                cursor.close()
            return redirect(url_for('support'))
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('SELECT * FROM support_tickets WHERE user_id = %s ORDER BY created_at DESC', (session['user_id'],))
        tickets = cursor.fetchall()
    finally:
        cursor.close()
    return render_template('support.html', tickets=tickets)

@app.route('/admin/support')
@login_required
@admin_required
def admin_support():
    page = request.args.get('page', 1, type=int)
    per_page = 20
    offset = (page - 1) * per_page
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('''
            SELECT st.*, u.name, u.email FROM support_tickets st
            JOIN users u ON st.user_id = u.user_id ORDER BY st.created_at DESC LIMIT %s OFFSET %s
        ''', (per_page, offset))
        tickets = cursor.fetchall()
        cursor.execute('SELECT COUNT(*) as cnt FROM support_tickets')
        total = cursor.fetchone()['cnt']
    finally:
        cursor.close()
    total_pages = (total + per_page - 1) // per_page
    return render_template('admin_support.html', tickets=tickets, page=page, total_pages=total_pages)

@app.route('/admin/support/<ticket_id>', methods=['POST'])
@login_required
@admin_required
def admin_respond_ticket(ticket_id):
    response_text = request.form.get('response', '')
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('''
            UPDATE support_tickets SET admin_response = %s, status = 'resolved', resolved_at = NOW()
            WHERE ticket_id = %s
        ''', (response_text, ticket_id))
        mysql.connection.commit()
        flash('Ticket responded to', 'success')
    except Exception:
        mysql.connection.rollback()
        flash('Failed to respond', 'danger')
    finally:
        cursor.close()
    return redirect(url_for('admin_support'))

@app.route('/sessions')
@login_required
def manage_sessions():
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('''
            SELECT id, ip_address, user_agent, created_at, last_active, is_active
            FROM user_sessions WHERE user_id = %s ORDER BY created_at DESC
        ''', (session['user_id'],))
        sessions = cursor.fetchall()
    finally:
        cursor.close()
    return render_template('sessions.html', sessions=sessions)

@app.route('/sessions/<int:sid>/revoke', methods=['POST'])
@login_required
def revoke_session(sid):
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('UPDATE user_sessions SET is_active = FALSE WHERE id = %s AND user_id = %s', (sid, session['user_id']))
        mysql.connection.commit()
        flash('Session revoked', 'success')
    except Exception:
        mysql.connection.rollback()
        flash('Failed to revoke session', 'danger')
    finally:
        cursor.close()
    return redirect(url_for('manage_sessions'))

@app.route('/referrals')
@login_required
def referrals_page():
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('SELECT referral_code FROM users WHERE user_id = %s', (session['user_id'],))
        user = cursor.fetchone()
        code = user['referral_code'] if user and user['referral_code'] else ''
        if not code:
            code = f'YC-{session["user_id"][:6].upper()}'
            cursor.execute('UPDATE users SET referral_code = %s WHERE user_id = %s', (code, session['user_id']))
            mysql.connection.commit()
        cursor.execute('''
            SELECT r.*, u.name, u.email FROM referrals r
            JOIN users u ON r.referred_id = u.user_id WHERE r.referrer_id = %s
        ''', (session['user_id'],))
        referred = cursor.fetchall()
        cursor.execute('SELECT COUNT(*) as cnt FROM referrals WHERE referrer_id = %s AND is_rewarded = TRUE', (session['user_id'],))
        rewards = cursor.fetchone()['cnt']
    finally:
        cursor.close()
    return render_template('referrals.html', code=code, referred=referred, rewards=rewards)

@app.route('/loan-topup/<loan_id>', methods=['GET', 'POST'])
@login_required
def loan_topup(loan_id):
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('SELECT * FROM loans WHERE loan_id = %s AND user_id = %s AND status IN ("approved", "disbursed")', (loan_id, session['user_id']))
        loan = cursor.fetchone()
        if not loan:
            flash('Loan not eligible for top-up', 'danger')
            return redirect(url_for('dashboard'))
    finally:
        cursor.close()
    if request.method == 'POST':
        topup_amount = float(request.form.get('topup_amount', 0))
        if topup_amount <= 0:
            flash('Invalid amount', 'danger')
            return redirect(url_for('loan_topup', loan_id=loan_id))
        new_loan_id = generate_user_id()
        cursor = mysql.connection.cursor()
        try:
            cursor.execute('''
                INSERT INTO loans (loan_id, user_id, amount, purpose, term_months, interest_rate, status)
                VALUES (%s, %s, %s, %s, %s, %s, "pending")
            ''', (new_loan_id, session['user_id'], topup_amount, f'Top-up for loan {loan_id[:8]}', loan['term_months'], loan['interest_rate']))
            mysql.connection.commit()
            flash('Top-up application submitted!', 'success')
        except Exception:
            mysql.connection.rollback()
            flash('Top-up failed', 'danger')
        finally:
            cursor.close()
        return redirect(url_for('dashboard'))
    return render_template('loan_topup.html', loan=loan)

@app.route('/verify-email/<token>')
def verify_email(token):
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('SELECT * FROM email_verification WHERE token = %s AND is_verified = FALSE AND expires_at > NOW()', (token,))
        record = cursor.fetchone()
        if record:
            cursor.execute('UPDATE users SET is_verified = TRUE WHERE user_id = %s', (record['user_id'],))
            cursor.execute('UPDATE email_verification SET is_verified = TRUE WHERE id = %s', (record['id'],))
            mysql.connection.commit()
            flash('Email verified successfully!', 'success')
        else:
            flash('Invalid or expired verification link', 'danger')
    except Exception:
        mysql.connection.rollback()
        flash('Verification failed', 'danger')
    finally:
        cursor.close()
    return redirect(url_for('login'))

@app.route('/resend-verification')
@login_required
def resend_verification():
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('SELECT is_verified FROM users WHERE user_id = %s', (session['user_id'],))
        user = cursor.fetchone()
        if user and user['is_verified']:
            flash('Email already verified', 'info')
            return redirect(url_for('dashboard'))
        token = secrets.token_urlsafe(32)
        expires = datetime.now() + timedelta(hours=24)
        cursor.execute('DELETE FROM email_verification WHERE user_id = %s', (session['user_id'],))
        cursor.execute('INSERT INTO email_verification (user_id, token, expires_at) VALUES (%s, %s, %s)',
                      (session['user_id'], token, expires))
        mysql.connection.commit()
        verify_url = request.url_root.rstrip('/') + url_for('verify_email', token=token)
        notifications.send_email(session['email'], 'Verify Your YoCoin Email',
                                f'<p>Click to verify: <a href="{verify_url}">{verify_url}</a></p>')
        flash('Verification email sent!', 'success')
    except Exception:
        mysql.connection.rollback()
        flash('Failed to send verification', 'danger')
    finally:
        cursor.close()
    return redirect(url_for('dashboard'))

@app.route('/terms')
def terms_page():
    return render_template('terms.html')

@app.route('/privacy')
def privacy_page():
    return render_template('privacy.html')

@app.route('/delete-account', methods=['GET', 'POST'])
@login_required
def delete_account():
    if request.method == 'POST':
        confirm = request.form.get('confirm', '')
        if confirm != session['email']:
            flash('Email does not match', 'danger')
            return render_template('delete_account.html')
        cursor = mysql.connection.cursor()
        try:
            cursor.execute('DELETE FROM user_auth WHERE user_id = %s', (session['user_id'],))
            cursor.execute('DELETE FROM users WHERE user_id = %s', (session['user_id'],))
            mysql.connection.commit()
            session.clear()
            flash('Account deleted successfully', 'success')
            return redirect(url_for('home'))
        except Exception as e:
            mysql.connection.rollback()
            flash(f'Deletion failed: {str(e)}', 'danger')
        finally:
            cursor.close()
    return render_template('delete_account.html')

@app.route('/help')
def help_page():
    return render_template('help.html')

@app.route('/api/cache/stats')
@login_required
@admin_required
def cache_stats():
    return {'cache': global_cache.get_stats()}

@app.route('/api/mobile-money/transactions')
@login_required
def mobile_money_history():
    loan_id = request.args.get('loan_id')
    txns = mobile_money.get_transaction_history(
        user_id=None if session.get('role') == 'admin' else session['user_id'],
        loan_id=loan_id
    )
    serialized = []
    for t in txns:
        d = dict(t)
        for k, v in d.items():
            if hasattr(v, 'isoformat'):
                d[k] = v.isoformat()
            elif hasattr(v, '__float__'):
                d[k] = float(v)
        serialized.append(d)
    return {'transactions': serialized}

@app.route('/admin/mobile-money')
@login_required
@admin_required
def admin_mobile_money():
    page = request.args.get('page', 1, type=int)
    per_page = 20
    offset = (page - 1) * per_page
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('SELECT COUNT(*) as cnt FROM mobile_money_transactions')
        total = cursor.fetchone()['cnt']
        cursor.execute('''
            SELECT m.*, u.name, u.email FROM mobile_money_transactions m
            LEFT JOIN users u ON m.user_id = u.user_id COLLATE utf8mb4_unicode_ci
            ORDER BY m.created_at DESC LIMIT %s OFFSET %s
        ''', (per_page, offset))
        txns = cursor.fetchall()
    finally:
        cursor.close()
    total_pages = (total + per_page - 1) // per_page
    mtn_api_status = bool(os.getenv('MTN_MOMO_API_USER', ''))
    airtel_api_status = bool(os.getenv('AIRTEL_API_KEY', ''))
    return render_template('admin_mobile_money.html', txns=txns, page=page, total_pages=total_pages, total=total,
                          mtn_api_status=mtn_api_status, airtel_api_status=airtel_api_status)

@app.route('/admin/credit-history/<user_id>')
@login_required
@admin_required
def admin_credit_history(user_id):
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('SELECT * FROM users WHERE user_id = %s', (user_id,))
        user = cursor.fetchone()
        cursor.execute('SELECT * FROM credit_score_history WHERE user_id = %s ORDER BY created_at DESC LIMIT 50', (user_id,))
        history = cursor.fetchall()
    finally:
        cursor.close()
    return render_template('admin_credit_history.html', user=user, history=history)

@app.route('/api/feature-status')
def feature_status():
    status = {'status': 'healthy', 'timestamp': datetime.now().isoformat()}
    try:
        cursor = mysql.connection.cursor()
        cursor.execute('SELECT 1')
        cursor.close()
        status['database'] = 'connected'
    except Exception:
        status['database'] = 'disconnected'
        status['status'] = 'degraded'
    try:
        cv = blockchain.verify_chain()
        status['blockchain'] = 'valid' if cv else 'invalid'
        if not cv:
            status['status'] = 'degraded'
    except Exception:
        status['blockchain'] = 'error'
        status['status'] = 'degraded'
    return status

@app.route('/api/system-health')
def api_system_health():
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('SELECT COUNT(*) as cnt FROM users')
        users = cursor.fetchone()['cnt']
        cursor.execute('SELECT COUNT(*) as cnt FROM loans')
        loans = cursor.fetchone()['cnt']
        cursor.execute('SELECT COUNT(*) as cnt FROM blockchain_blocks')
        blocks = cursor.fetchone()['cnt']
    finally:
        cursor.close()
    try:
        chain_valid = blockchain.verify_chain()
    except Exception:
        chain_valid = False
    return {
        'status': 'healthy',
        'users': users,
        'loans': loans,
        'blocks': blocks,
        'chain_valid': chain_valid,
        'timestamp': datetime.now().isoformat()
    }

def send_5day_reminders():
    """Send repayment reminders for loans disbursed 5+ days ago"""
    try:
        cursor = mysql.connection.cursor()
        cursor.execute('''
            SELECT l.loan_id, l.user_id, l.amount, l.due_date, u.email, u.name
            FROM loans l JOIN users u ON l.user_id = u.user_id
            WHERE l.status = 'disbursed'
            AND DATEDIFF(NOW(), l.disbursement_date) >= 5
            AND DATEDIFF(NOW(), l.disbursement_date) % 5 = 0
            AND NOT EXISTS (
                SELECT 1 FROM notification_log nl
                WHERE nl.notification_type = 'repayment_reminder'
                AND nl.user_id = l.user_id
                AND nl.created_at >= DATE_SUB(NOW(), INTERVAL 4 DAY)
            )
        ''')
        loans_due = cursor.fetchall()
        for loan in loans_due:
            notifications.notify_repayment_due(
                loan['user_id'], loan['email'], loan['name'],
                float(loan['amount']), loan['due_date'].strftime('%Y-%m-%d') if loan['due_date'] else 'N/A'
            )
            cursor.execute('''
                INSERT INTO notification_log (user_id, notification_type, channel, message, status)
                VALUES (%s, %s, %s, %s, %s)
            ''', (loan['user_id'], 'repayment_reminder', 'email',
                  f'Repayment reminder for loan {loan["loan_id"][:8]}', 'sent'))
            notify_user(mysql, loan['user_id'], 'repayment_reminder',
                       'Repayment Reminder',
                       f'Your loan repayment of UGX {float(loan["amount"]):,.0f} is due. Please pay on time.',
                       loan['loan_id'])
        mysql.connection.commit()
        cursor.close()
    except Exception as e:
        logger.error(f'send_5day_reminders failed: {e}')

if __name__ == '__main__':
    app.config['START_TIME'] = datetime.now()
    app.run(
        host='0.0.0.0',
        debug=os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    )
