'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Users,
  Activity,
  Clock,
  TrendingUp,
  AlertCircle,
  Pill,
  FileText,
  Stethoscope,
  User,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getStoredUser } from '@/lib/auth-store';
import type { AuthUser } from '@/lib/auth-store';
import { api, getErrorMessage } from '@/lib/api-client';

type Role = 'PATIENT' | 'DOCTOR' | 'NURSE' | 'ADMIN' | 'BILLING';

const statsConfig: Record<Role, { label: string; value: string; icon: any; change: string; color: string }[]> = {
  PATIENT: [
    { label: 'Upcoming Appointments', value: '-', icon: Calendar, change: 'Loading...', color: 'from-blue-500 to-cyan-500' },
    { label: 'Active Prescriptions', value: '-', icon: Pill, change: 'Loading...', color: 'from-emerald-500 to-teal-500' },
    { label: 'Medical Records', value: '-', icon: FileText, change: 'Loading...', color: 'from-violet-500 to-purple-500' },
    { label: 'Outstanding Bills', value: '-', icon: TrendingUp, change: 'Loading...', color: 'from-amber-500 to-orange-500' },
  ],
  DOCTOR: [
    { label: 'Today\'s Patients', value: '8', icon: Users, change: '3 more scheduled', color: 'from-blue-500 to-cyan-500' },
    { label: 'Pending Reviews', value: '4', icon: FileText, change: 'Lab results awaiting', color: 'from-emerald-500 to-teal-500' },
    { label: 'Avg Consultation', value: '22m', icon: Clock, change: 'On schedule', color: 'from-violet-500 to-purple-500' },
    { label: 'Prescriptions Today', value: '15', icon: Pill, change: '5 e-prescribed', color: 'from-amber-500 to-orange-500' },
  ],
  NURSE: [
    { label: 'Assigned Patients', value: '6', icon: Users, change: '2 in ICU', color: 'from-blue-500 to-cyan-500' },
    { label: 'Vitals Due', value: '4', icon: Activity, change: 'Within next hour', color: 'from-emerald-500 to-teal-500' },
    { label: 'Medications', value: '12', icon: Pill, change: '3 overdue', color: 'from-violet-500 to-purple-500' },
    { label: 'Bed Occupancy', value: '78%', icon: TrendingUp, change: '15 beds available', color: 'from-amber-500 to-orange-500' },
  ],
  ADMIN: [
    { label: 'Total Patients', value: '1,247', icon: Users, change: '+12% this month', color: 'from-blue-500 to-cyan-500' },
    { label: 'Bed Occupancy', value: '72%', icon: Activity, change: '42 beds available', color: 'from-emerald-500 to-teal-500' },
    { label: 'Staff on Duty', value: '48', icon: Clock, change: '6 departments', color: 'from-violet-500 to-purple-500' },
    { label: 'Revenue MTD', value: '$342K', icon: TrendingUp, change: '+8% vs last month', color: 'from-amber-500 to-orange-500' },
  ],
  BILLING: [
    { label: 'Pending Invoices', value: '23', icon: FileText, change: 'Total: $45,230', color: 'from-blue-500 to-cyan-500' },
    { label: 'Insurance Claims', value: '12', icon: TrendingUp, change: '5 pending review', color: 'from-emerald-500 to-teal-500' },
    { label: 'Payments Today', value: '$12,450', icon: TrendingUp, change: '15 transactions', color: 'from-violet-500 to-purple-500' },
    { label: 'Overdue Accounts', value: '8', icon: AlertCircle, change: 'Total: $8,200', color: 'from-amber-500 to-orange-500' },
  ],
};

const recentPatients = [
  { name: 'Emily Johnson', id: 'P-1024', condition: 'Cardiology Follow-up', time: '10:30 AM', status: 'In Progress' },
  { name: 'Michael Brown', id: 'P-1025', condition: 'Annual Physical', time: '11:00 AM', status: 'Waiting' },
  { name: 'Sarah Wilson', id: 'P-1026', condition: 'Lab Results Review', time: '11:30 AM', status: 'Scheduled' },
  { name: 'James Davis', id: 'P-1027', condition: 'Prescription Refill', time: '1:00 PM', status: 'Scheduled' },
];

const alerts = [
  { type: 'critical', message: 'Patient P-1024 shows abnormal heart rate', time: '5m ago' },
  { type: 'warning', message: 'Lab results pending for 3 patients', time: '15m ago' },
  { type: 'info', message: 'Dr. Wilson requested coverage for 2PM slot', time: '1h ago' },
];

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [prescriptionsCount, setPrescriptionsCount] = useState(0);
  const [recordsCount, setRecordsCount] = useState(0);
  const [billsTotal, setBillsTotal] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.push('/login');
      return;
    }
    setUser(stored);

    if (stored.role === 'PATIENT') {
      fetchPatientStats();
    } else {
      setStatsLoading(false);
    }
  }, [router]);

  const fetchPatientStats = async () => {
    try {
      const [apptData, rxData, recordsData, billsData] = await Promise.all([
        api.get<{ appointments: any[] }>('/api/appointments').catch(() => ({ appointments: [] })),
        api.get<{ prescriptions: any[] }>('/api/prescriptions').catch(() => ({ prescriptions: [] })),
        api.get<{ records: any[] }>('/api/medical-records').catch(() => ({ records: [] })),
        api.get<{ invoices: any[] }>('/api/invoices').catch(() => ({ invoices: [] })),
      ]);
      const today = new Date().toISOString().split('T')[0];
      const upcoming = (apptData.appointments || []).filter(
        (a: any) => new Date(a.date || a.startTime) >= new Date()
      );
      setAppointments(upcoming.slice(0, 5));
      const rx = rxData.prescriptions || [];
      setPrescriptionsCount(rx.filter((p: any) => p.isActive).length);
      setRecordsCount((recordsData.records || []).length);
      const invs = billsData.invoices || [];
      setBillsTotal(invs
        .filter((i: any) => i.status === 'PENDING' || i.status === 'Overdue')
        .reduce((s: number, i: any) => s + Number(i.totalAmount ?? i.amount ?? 0) - Number(i.paidAmount ?? i.paid ?? 0), 0)
      );
    } catch {
      // silently fail
    } finally {
      setStatsLoading(false);
    }
  };

  if (!user) return null;

  const role = user.role as Role;
  const isPatient = role === 'PATIENT';

  // Override patient stats with real data
  const stats = isPatient && !statsLoading
    ? [
        { label: 'Upcoming Appointments', value: String(appointments.length), icon: Calendar, change: appointments.length > 0 ? 'Next appointment scheduled' : 'No upcoming visits', color: 'from-blue-500 to-cyan-500' },
        { label: 'Active Prescriptions', value: String(prescriptionsCount), icon: Pill, change: prescriptionsCount > 0 ? `${prescriptionsCount} active medications` : 'No active prescriptions', color: 'from-emerald-500 to-teal-500' },
        { label: 'Medical Records', value: String(recordsCount), icon: FileText, change: `${recordsCount} records on file`, color: 'from-violet-500 to-purple-500' },
        { label: 'Outstanding Bills', value: `$${billsTotal}`, icon: TrendingUp, change: billsTotal > 0 ? 'Payment due' : 'All paid', color: 'from-amber-500 to-orange-500' },
      ]
    : statsConfig[role];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user.firstName}
        </h1>
        <p className="text-gray-500 mt-1">
          Here&apos;s your overview for today
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                      <p className="text-xs text-gray-400 mt-1">{stat.change}</p>
                    </div>
                    <div className={cn(
                      'w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center',
                      stat.color
                    )}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Schedule / Queue */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{isPatient ? 'My Queue & Appointments' : 'Today\'s Schedule'}</CardTitle>
              <Link href="/dashboard/appointments" className="text-sm text-primary-600 font-medium hover:underline">
                View All
              </Link>
            </CardHeader>
            <CardContent>
              {isPatient ? (
                <div className="space-y-3">
                  {appointments.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No upcoming appointments</p>
                      <Link href="/dashboard/appointments/new" className="text-sm text-primary-600 font-medium hover:underline mt-2 inline-block">
                        Book an appointment
                      </Link>
                    </div>
                  ) : (
                    appointments.map((apt, index) => {
                      const statusColors: Record<string, string> = {
                        SCHEDULED: 'bg-gray-50 text-gray-600',
                        CONFIRMED: 'bg-blue-50 text-blue-700',
                        IN_PROGRESS: 'bg-amber-50 text-amber-700',
                        COMPLETED: 'bg-green-50 text-green-700',
                        CANCELLED: 'bg-red-50 text-red-700',
                      };
                      const position = index + 1;
                      return (
                        <motion.div
                          key={apt.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 font-semibold text-sm">
                              {position}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {apt.type || 'Appointment'} {apt.status === 'IN_PROGRESS' && '(You\'re up!)'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {apt.doctor ? `Dr. ${apt.doctor.firstName} ${apt.doctor.lastName}` : 'Doctor'} &middot;{' '}
                                {new Date(apt.startTime || apt.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {apt.status === 'IN_PROGRESS' && (
                              <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                                <Clock className="w-3 h-3" />
                                Queue position: #{position}
                              </span>
                            )}
                            <span className={cn(
                              'px-2 py-1 text-xs font-medium rounded-full',
                              statusColors[apt.status] || 'bg-gray-50 text-gray-600'
                            )}>
                              {apt.status === 'IN_PROGRESS' ? 'In Progress' : apt.status}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {recentPatients.map((patient, index) => (
                    <motion.div
                      key={patient.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 font-semibold text-sm">
                          {patient.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{patient.name}</p>
                          <p className="text-xs text-gray-500">{patient.id} &middot; {patient.condition}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">{patient.time}</span>
                        <span className={cn(
                          'px-2 py-1 text-xs font-medium rounded-full',
                          patient.status === 'In Progress' && 'bg-blue-50 text-blue-700',
                          patient.status === 'Waiting' && 'bg-amber-50 text-amber-700',
                          patient.status === 'Scheduled' && 'bg-gray-50 text-gray-600',
                        )}>
                          {patient.status}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alerts & Updates */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Alerts & Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      'p-3 rounded-lg border text-sm',
                      alert.type === 'critical' && 'bg-red-50 border-red-100',
                      alert.type === 'warning' && 'bg-amber-50 border-amber-100',
                      alert.type === 'info' && 'bg-blue-50 border-blue-100',
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className={cn(
                        'w-4 h-4 mt-0.5 flex-shrink-0',
                        alert.type === 'critical' && 'text-red-600',
                        alert.type === 'warning' && 'text-amber-600',
                        alert.type === 'info' && 'text-blue-600',
                      )} />
                      <div>
                        <p className={cn(
                          'font-medium',
                          alert.type === 'critical' && 'text-red-800',
                          alert.type === 'warning' && 'text-amber-800',
                          alert.type === 'info' && 'text-blue-800',
                        )}>
                          {alert.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
