'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Filter, Plus, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api, getErrorMessage } from '@/lib/api-client';
import { getStoredUser } from '@/lib/auth-store';

const statusColors: Record<string, string> = {
  'Scheduled': 'bg-gray-50 text-gray-600',
  'Confirmed': 'bg-blue-50 text-blue-700',
  'In Progress': 'bg-amber-50 text-amber-700',
  'Completed': 'bg-green-50 text-green-700',
  'Cancelled': 'bg-red-50 text-red-700',
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<{
    id: string; patient: string; type: string; date: string; time: string; status: string; doctor: string;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        setLoading(true);
        setError('');
        const data = await api.get<{ appointments: any[] }>('/api/appointments');
        if (cancelled) return;
        setAppointments((data.appointments || []).map((a: any) => ({
          id: a.id,
          patient: a.patient ? `${a.patient.firstName} ${a.patient.lastName}` : 'Unknown',
          type: a.type || '',
          date: a.date || '',
          time: a.startTime || '',
          status: a.status || 'Scheduled',
          doctor: a.doctor ? `Dr. ${a.doctor.firstName} ${a.doctor.lastName}` : 'Unassigned',
        })));
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500 mt-1">Manage your schedule and patient appointments</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Appointment
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          <span className="ml-3 text-gray-500">Loading appointments...</span>
        </div>
      )}

      {error && !loading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{error}. Please ensure the database is running.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !error && (
      <>
      {/* Calendar Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-50 rounded-lg">
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h2 className="text-lg font-semibold text-gray-900">June 2026</h2>
              <button className="p-2 hover:bg-gray-50 rounded-lg">
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">Today</Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mt-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">{day}</div>
            ))}
            {Array.from({ length: 35 }, (_, i) => {
              const day = i - 4;
              const isToday = day === 12;
              const hasAppointments = [10, 11, 12, 13].includes(day);
              return (
                <button
                  key={i}
                  className={cn(
                    'relative p-2 text-sm rounded-lg hover:bg-gray-50 transition-colors',
                    isToday && 'bg-primary-50 text-primary-700 font-semibold',
                    day < 1 || day > 30 ? 'text-gray-300' : 'text-gray-700'
                  )}
                >
                  {day > 0 && day <= 30 ? day : ''}
                  {hasAppointments && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {appointments.map((apt, index) => (
              <motion.div
                key={apt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-primary-100 hover:bg-primary-50/30 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 font-semibold">
                    {apt.patient.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{apt.patient}</p>
                    <p className="text-xs text-gray-500">{apt.type}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {apt.date}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {apt.time}
                      </span>
                    </div>
                  </div>
                </div>
                <span className={cn('px-3 py-1 text-xs font-medium rounded-full', statusColors[apt.status])}>
                  {apt.status}
                </span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
      </>
      )}
    </div>
  );
}
