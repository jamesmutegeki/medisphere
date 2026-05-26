# YoCoin - Microloan Platform for Uganda

Blockchain-powered microloan platform providing collateral-free loans to Ugandans. Users register with National ID, complete KYC verification, apply for loans, and build credit scores.

## Tech Stack

- **Backend**: Flask (Python), MySQL, bcrypt, WTForms, Flask-Limiter
- **Blockchain**: Custom Python blockchain with DB persistence
- **Frontend**: Bootstrap 5, Jinja2 templates
- **Database**: MySQL with 20+ tables
- **Notifications**: Email (SMTP) and SMS (Africa's Talking API)

## Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Setup database (run ALL three SQL files in order)
mysql -u root -p < YoCoin.sql
mysql -u root -p < migration_v2.sql
mysql -u root -p < fix_all.sql

# Seed admin user (creates admin@yocoin.ug / Admin@123)
python seed_admin.py

# Run development server
python YoCoin.py
```

## Features

- User registration with National ID / phone / email
- KYC document upload and admin verification
- Loan application, approval, and repayment tracking
- Credit scoring algorithm based on repayment history
- Blockchain transaction ledger with DB persistence
- Admin dashboard with user management, KYC queue, audit logs
- Mobile money integration (MTN / Airtel)
- Two-factor authentication
- Password reset via security questions
- Email and SMS notifications
- Rate limiting on sensitive endpoints
