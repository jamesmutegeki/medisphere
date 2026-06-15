'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Pill,
  Activity,
  Building2,
  Users,
  Receipt,
  Shield,
  UserCircle,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  Bell,
  Search,
  FlaskConical,
  Package,
  Stethoscope,
  Syringe,
  Clock,
  ClipboardList,
  ArrowRightLeft,
  TrendingUp,
  Upload,
  CalendarDays,
  Warehouse,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import MedisphereLogo from '@/components/medisphere-logo';
import { getStoredUser, clearStoredUser, getDisplayName, getInitials, AuthUser } from '@/lib/auth-store';

interface NavItem {
  label: string;
  href: string;
  icon: any;
  roles: string[];
}

const navigation: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['PATIENT', 'DOCTOR', 'NURSE', 'ADMIN', 'BILLING'] },
  { label: 'Appointments', href: '/dashboard/appointments', icon: Calendar, roles: ['PATIENT', 'DOCTOR', 'NURSE', 'ADMIN'] },
  { label: 'Medical Records', href: '/dashboard/records', icon: FileText, roles: ['DOCTOR', 'NURSE', 'PATIENT'] },
  { label: 'Prescriptions', href: '/dashboard/prescriptions', icon: Pill, roles: ['DOCTOR', 'NURSE', 'PATIENT'] },
  { label: 'Vitals', href: '/dashboard/vitals', icon: Activity, roles: ['DOCTOR', 'NURSE'] },
  { label: 'Ward Management', href: '/dashboard/wards', icon: Building2, roles: ['ADMIN', 'NURSE'] },
  { label: 'Staff Rota', href: '/dashboard/staff', icon: Users, roles: ['ADMIN'] },
  { label: 'Billing', href: '/dashboard/billing', icon: Receipt, roles: ['BILLING', 'PATIENT'] },
  { label: 'Insurance', href: '/dashboard/insurance', icon: Shield, roles: ['BILLING', 'PATIENT'] },
  { label: 'Patient Portal', href: '/dashboard/portal', icon: UserCircle, roles: ['PATIENT'] },
  // Clinical
  { label: 'Lab Results', href: '/dashboard/laboratory', icon: FlaskConical, roles: ['DOCTOR', 'NURSE', 'PATIENT'] },
  { label: 'Pharmacy', href: '/dashboard/pharmacy', icon: Package, roles: ['DOCTOR', 'NURSE', 'ADMIN'] },
  { label: 'Symptom Checker', href: '/dashboard/symptom-checker', icon: Stethoscope, roles: ['PATIENT'] },
  { label: 'Immunizations', href: '/dashboard/immunizations', icon: Syringe, roles: ['DOCTOR', 'NURSE', 'PATIENT'] },
  { label: 'Availability', href: '/dashboard/availability', icon: Clock, roles: ['DOCTOR', 'ADMIN'] },
  { label: 'Intake Forms', href: '/dashboard/intake', icon: ClipboardList, roles: ['NURSE', 'ADMIN'] },
  { label: 'Waitlist', href: '/dashboard/waitlist', icon: Users, roles: ['NURSE', 'ADMIN', 'DOCTOR'] },
  // Administrative
  { label: 'Referrals', href: '/dashboard/referrals', icon: ArrowRightLeft, roles: ['DOCTOR', 'ADMIN'] },
  { label: 'Revenue', href: '/dashboard/revenue', icon: TrendingUp, roles: ['ADMIN', 'BILLING'] },
  { label: 'Doctor Profiles', href: '/dashboard/doctor-profiles', icon: Upload, roles: ['ADMIN'] },
  { label: 'Audit Log', href: '/dashboard/audit-log', icon: Shield, roles: ['ADMIN', 'SUPER_ADMIN'] },
  { label: 'Leave Mgmt', href: '/dashboard/leave-management', icon: CalendarDays, roles: ['ADMIN', 'NURSE'] },
  { label: 'Inventory', href: '/dashboard/inventory', icon: Warehouse, roles: ['ADMIN', 'NURSE'] },
  { label: 'Notifications', href: '/dashboard/notifications', icon: Bell, roles: ['PATIENT', 'DOCTOR', 'NURSE', 'ADMIN', 'BILLING'] },
];

interface DropdownNotification {
  id: string;
  title: string;
  description: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dropdownNotifications, setDropdownNotifications] = useState<DropdownNotification[]>([]);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.push('/login');
      return;
    }
    setUser(stored);
    setLoading(false);
    fetchNotifications();
  }, [router]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setDropdownNotifications(data.notifications.slice(0, 5));
      }
    } catch {
      // silently fail
    }
  };

  const formatTime = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const unreadCount = dropdownNotifications.filter((n) => !n.isRead).length;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Proceed with local logout even if API call fails
    }
    clearStoredUser();
    router.push('/login');
  };

  if (loading || !user) return null;

  const filteredNav = navigation.filter((item) => item.roles.includes(user.role));
  const initials = getInitials(user.firstName, user.lastName);
  const displayName = getDisplayName(user);

  return (
    <div className="min-h-screen bg-gray-50">
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full bg-white border-r border-gray-200 transition-all duration-300 flex flex-col',
          sidebarOpen ? 'w-64' : 'w-16',
          'hidden lg:flex'
        )}
      >
        <div className={cn(
          'h-16 flex items-center border-b border-gray-100 px-4',
          sidebarOpen ? 'justify-between' : 'justify-center'
        )}>
          {sidebarOpen ? (
            <>
              <Link href="/" className="flex items-center gap-2">
                <MedisphereLogo size={28} />
                <span className="font-bold text-gray-900">MediSphere</span>
              </Link>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600">
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-gray-600">
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-hide">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  !sidebarOpen && 'justify-center px-2'
                )}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={cn(
          'border-t border-gray-100 p-3',
          sidebarOpen ? 'space-y-2' : 'space-y-3'
        )}>
          <div className={cn(
            'flex items-center gap-3 p-2 rounded-lg bg-gray-50',
            !sidebarOpen && 'justify-center'
          )}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                <p className="text-xs text-gray-500 truncate">{user.role}</p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-xl lg:hidden"
          >
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
              <Link href="/" className="flex items-center gap-2">
                <MedisphereLogo size={28} />
                <span className="font-bold text-gray-900">MediSphere</span>
              </Link>
              <button onClick={() => setMobileSidebarOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="overflow-y-auto p-3 space-y-1">
              {filteredNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                      isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-gray-100 p-3">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className={cn(
        'transition-all duration-300',
        sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
      )}>
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden text-gray-600 hover:text-gray-900"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative hidden sm:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients, records..."
                className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                    <div className="p-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">Notifications</p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {dropdownNotifications.length === 0 ? (
                        <div className="p-6 text-center text-sm text-gray-400">
                          No notifications yet
                        </div>
                      ) : (
                        dropdownNotifications.map((n) => (
                          <Link
                            key={n.id}
                            href={`/dashboard/notifications/${n.id}`}
                            onClick={() => setNotificationsOpen(false)}
                            className={`flex items-start gap-3 p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                          >
                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.isRead ? 'bg-blue-500' : 'bg-gray-300'}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
                              {n.description && <p className="text-xs text-gray-500 truncate">{n.description}</p>}
                              <p className="text-xs text-gray-400 mt-0.5">{formatTime(n.createdAt)}</p>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                    <div className="p-2 border-t border-gray-100">
                      <Link
                        href="/dashboard/notifications"
                        onClick={() => setNotificationsOpen(false)}
                        className="block w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium py-1.5"
                      >
                        View All Notifications
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{displayName}</p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
