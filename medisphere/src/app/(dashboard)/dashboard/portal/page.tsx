'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, FileText, Pill, Receipt, User, ArrowRight, Loader2, AlertCircle, Mail, Phone, Shield } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getStoredUser, getInitials } from '@/lib/auth-store';
import { api, getErrorMessage } from '@/lib/api-client';

const quickActions = [
  { label: 'Book Appointment', icon: Calendar, color: 'from-blue-500 to-cyan-500', href: '/dashboard/appointments' },
  { label: 'View Records', icon: FileText, color: 'from-emerald-500 to-teal-500', href: '/dashboard/records' },
  { label: 'My Prescriptions', icon: Pill, color: 'from-violet-500 to-purple-500', href: '/dashboard/prescriptions' },
  { label: 'Pay Bills', icon: Receipt, color: 'from-amber-500 to-orange-500', href: '/dashboard/billing' },
];

export default function PatientPortalPage() {
  const router = useRouter();
  const [user, setUser] = useState(getStoredUser());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        setLoading(true);
        setError('');
        const [apptData, rxData] = await Promise.all([
          api.get<{ appointments: any[] }>('/api/appointments').catch(() => ({ appointments: [] })),
          api.get<{ prescriptions: any[] }>('/api/prescriptions').catch(() => ({ prescriptions: [] })),
        ]);
        if (cancelled) return;
        setAppointments((apptData.appointments || []).slice(0, 3));
        setPrescriptions((rxData.prescriptions || []).filter((p: any) => p.isActive).slice(0, 3));
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        <span className="ml-3 text-gray-500">Loading portal...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = user ? `${user.firstName} ${user.lastName}` : '';
  const initials = user ? getInitials(user.firstName, user.lastName) : '';

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 px-6 py-8">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold overflow-hidden ring-4 ring-white/30">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="text-white">
              <h1 className="text-2xl font-bold">{displayName}</h1>
              <p className="text-white/80 text-sm mt-1">Patient Portal</p>
            </div>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Shield className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">NIN (National ID)</p>
                <p className="text-sm font-medium text-gray-900">{user?.nin || 'Not set'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Role</p>
                <p className="text-sm font-medium text-gray-900">Patient</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.a
              key={action.label}
              href={action.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group block"
            >
              <Card className="hover:shadow-md transition-all cursor-pointer overflow-hidden">
                <CardContent className="p-5">
                  <div className={cn(
                    'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 group-hover:scale-110 transition-transform',
                    action.color
                  )}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">{action.label}</p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 group-hover:text-primary-600 transition-colors">
                    Click to open <ArrowRight className="w-3 h-3" />
                  </p>
                </CardContent>
              </Card>
            </motion.a>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>Your scheduled visits</CardDescription>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No upcoming appointments</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => router.push('/dashboard/appointments/new')}>
                  Book Appointment
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((apt, index) => (
                  <motion.div
                    key={apt.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-primary-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[48px]">
                        <p className="text-lg font-bold text-primary-600">
                          {new Date(apt.date || apt.startTime).getDate()}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(apt.date || apt.startTime).toLocaleString('default', { month: 'short' })}
                        </p>
                      </div>
                      <div className="border-l border-gray-200 pl-3">
                        <p className="text-sm font-medium text-gray-900">{apt.type || 'Appointment'}</p>
                        <p className="text-xs text-gray-500">
                          {apt.doctor ? `Dr. ${apt.doctor.firstName} ${apt.doctor.lastName}` : 'Doctor'} &middot;{' '}
                          {new Date(apt.startTime || apt.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      'px-2 py-1 text-xs font-medium rounded-full',
                      apt.status === 'CONFIRMED' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'
                    )}>
                      {apt.status === 'CONFIRMED' ? 'Confirmed' : apt.status}
                    </span>
                  </motion.div>
                ))}
                <Button variant="outline" className="w-full mt-2" onClick={() => router.push('/dashboard/appointments')}>
                  View All Appointments
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Prescriptions */}
        <Card>
          <CardHeader>
            <CardTitle>Active Prescriptions</CardTitle>
            <CardDescription>Current medications and refills</CardDescription>
          </CardHeader>
          <CardContent>
            {prescriptions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Pill className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active prescriptions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {prescriptions.map((rx, index) => (
                  <motion.div
                    key={rx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-primary-100 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{rx.medication}</p>
                      <p className="text-xs text-gray-500">
                        {rx.doctor ? `Dr. ${rx.doctor.firstName} ${rx.doctor.lastName}` : 'Doctor'} &middot; {rx.dosage}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-50 text-green-700">
                        {rx.refills ?? 0} refills
                      </span>
                    </div>
                  </motion.div>
                ))}
                <Button variant="outline" className="w-full mt-2" onClick={() => router.push('/dashboard/prescriptions')}>
                  View All Prescriptions
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Full Name</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{displayName}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{user?.email}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">National ID (NIN)</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{user?.nin || 'Not set'}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Role</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">Patient</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
