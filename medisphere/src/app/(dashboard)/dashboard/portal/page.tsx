'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, FileText, Pill, Receipt, User, Bell, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const quickActions = [
  { label: 'Book Appointment', icon: Calendar, color: 'from-blue-500 to-cyan-500', href: '/dashboard/appointments' },
  { label: 'View Records', icon: FileText, color: 'from-emerald-500 to-teal-500', href: '/dashboard/records' },
  { label: 'My Prescriptions', icon: Pill, color: 'from-violet-500 to-purple-500', href: '/dashboard/prescriptions' },
  { label: 'Pay Bills', icon: Receipt, color: 'from-amber-500 to-orange-500', href: '/dashboard/billing' },
];

const upcomingAppointments = [
  { date: 'Jun 15', time: '10:00 AM', doctor: 'Dr. Sarah Chen', type: 'Annual Checkup', status: 'Confirmed' },
  { date: 'Jun 22', time: '2:30 PM', doctor: 'Dr. Michael Lee', type: 'Cardiology Follow-up', status: 'Scheduled' },
];

const recentPrescriptions = [
  { medication: 'Lisinopril 10mg', prescribed: 'Jun 10', doctor: 'Dr. Sarah Chen', refills: 2 },
  { medication: 'Atorvastatin 20mg', prescribed: 'Jun 09', doctor: 'Dr. Sarah Chen', refills: 3 },
];

export default function PatientPortalPage() {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Patient Portal</h1>
        <p className="text-gray-500 mt-1">Welcome back, John! Manage your healthcare journey</p>
      </div>

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
            <div className="space-y-3">
              {upcomingAppointments.map((apt, index) => (
                <motion.div
                  key={`${apt.date}-${apt.time}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-primary-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-lg font-bold text-primary-600">{apt.date.split(' ')[1]}</p>
                      <p className="text-xs text-gray-400">{apt.date.split(' ')[0]}</p>
                    </div>
                    <div className="border-l border-gray-200 pl-3">
                      <p className="text-sm font-medium text-gray-900">{apt.type}</p>
                      <p className="text-xs text-gray-500">{apt.doctor} &middot; {apt.time}</p>
                    </div>
                  </div>
                  <span className={cn(
                    'px-2 py-1 text-xs font-medium rounded-full',
                    apt.status === 'Confirmed' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'
                  )}>
                    {apt.status}
                  </span>
                </motion.div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" onClick={() => router.push('/dashboard/appointments/new')}>
              <Calendar className="w-4 h-4 mr-2" />
              Book New Appointment
            </Button>
          </CardContent>
        </Card>

        {/* Recent Prescriptions */}
        <Card>
          <CardHeader>
            <CardTitle>Active Prescriptions</CardTitle>
            <CardDescription>Current medications and refills</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPrescriptions.map((rx, index) => (
                <motion.div
                  key={rx.medication}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-primary-100 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{rx.medication}</p>
                    <p className="text-xs text-gray-500">Dr. {rx.doctor} &middot; {rx.prescribed}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-50 text-green-700">
                      {rx.refills} refills
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" onClick={() => router.push('/dashboard/prescriptions/new')}>
              <Pill className="w-4 h-4 mr-2" />
              Request Refill
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Profile Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Blood Type', value: 'A+' },
              { label: 'Allergies', value: 'Penicillin, Peanuts' },
              { label: 'Emergency Contact', value: 'Jane Doe (555-0123)' },
              { label: 'Insurance', value: 'BlueCross PPO' },
            ].map((item) => (
              <div key={item.label} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
