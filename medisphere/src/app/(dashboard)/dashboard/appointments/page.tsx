'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Filter, Plus, ChevronLeft, ChevronRight, Loader2, AlertCircle, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api, getErrorMessage } from '@/lib/api-client';
import { getStoredUser } from '@/lib/auth-store';

const statusColors: Record<string, string> = {
  'SCHEDULED': 'bg-gray-50 text-gray-600',
  'CONFIRMED': 'bg-blue-50 text-blue-700',
  'IN_PROGRESS': 'bg-amber-50 text-amber-700',
  'COMPLETED': 'bg-green-50 text-green-700',
  'CANCELLED': 'bg-red-50 text-red-700',
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<{
    id: string; patient: string; patientId: string; type: string; date: string; time: string; status: string; doctor: string;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.get<{ appointments: any[] }>('/api/appointments');
      setAppointments((data.appointments || []).map((a: any) => ({
        id: a.id,
        patient: a.patient ? `${a.patient.firstName} ${a.patient.lastName}` : 'Unknown',
        patientId: a.patient?.id || '',
        type: a.type || '',
        date: a.date || '',
        time: a.startTime || '',
        status: a.status || 'SCHEDULED',
        doctor: a.doctor ? `Dr. ${a.doctor.firstName} ${a.doctor.lastName}` : 'Unassigned',
      })));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await api.patch(`/appointments/${id}`, { status: 'CANCELLED', cancellationReason: 'Cancelled by doctor' });
      fetchData();
    } catch (err) {
      alert('Failed to cancel appointment');
    }
  };

  const handleReschedule = async (id: string) => {
    const newDate = prompt('Enter new date (YYYY-MM-DD):');
    const newTime = prompt('Enter new time (HH:MM):');
    if (newDate && newTime) {
      try {
        await api.patch(`/appointments/${id}`, { date: newDate, startTime: `${newDate}T${newTime}:00` });
        fetchData();
      } catch (err) {
        alert('Failed to reschedule');
      }
    }
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else { setCurrentMonth(currentMonth - 1); }
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else { setCurrentMonth(currentMonth + 1); }
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const getAppointmentsForDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return appointments.filter(a => a.date && a.date.startsWith(dateStr));
  };

  const filteredAppointments = selectedDate
    ? getAppointmentsForDay(selectedDate)
    : appointments;

  const canManage = user && ['DOCTOR', 'NURSE', 'ADMIN'].includes(user.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500 mt-1">Manage your schedule and patient appointments</p>
        </div>
        {canManage && (
          <Link href="/dashboard/appointments/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Appointment
            </Button>
          </Link>
        )}
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
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={prevMonth} className="p-2 hover:bg-gray-50 rounded-lg">
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h2 className="text-lg font-semibold text-gray-900">{monthNames[currentMonth]} {currentYear}</h2>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-50 rounded-lg">
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setSelectedDate(null); setCurrentMonth(new Date().getMonth()); setCurrentYear(new Date().getFullYear()); }}>
              Today
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 mt-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">{day}</div>
            ))}
            {Array.from({ length: firstDayOfMonth }, (_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const isToday = day === new Date().getDate() && currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear();
              const dayApps = getAppointmentsForDay(day);
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(selectedDate === day ? null : day)}
                  className={cn(
                    'relative p-2 text-sm rounded-lg hover:bg-gray-50 transition-colors',
                    isToday && 'bg-primary-50 text-primary-700 font-semibold',
                    selectedDate === day && 'ring-2 ring-primary-500',
                    'text-gray-700'
                  )}
                >
                  {day}
                  {dayApps.length > 0 && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate
              ? `Appointments for ${monthNames[currentMonth]} ${selectedDate}, ${currentYear}`
              : 'All Upcoming Appointments'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No appointments found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAppointments.map((apt, index) => (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-primary-100 hover:bg-primary-50/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 font-semibold">
                      {apt.patient.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      {apt.patientId ? (
                        <Link href={`/dashboard/patients/${apt.patientId}`} className="text-sm font-medium text-gray-900 hover:text-primary-600 hover:underline">
                          {apt.patient}
                        </Link>
                      ) : (
                        <p className="text-sm font-medium text-gray-900">{apt.patient}</p>
                      )}
                      <p className="text-xs text-gray-500">{apt.type}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          {apt.date ? new Date(apt.date).toLocaleDateString() : ''}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {apt.time ? new Date(apt.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('px-3 py-1 text-xs font-medium rounded-full', statusColors[apt.status] || statusColors['SCHEDULED'])}>
                      {apt.status}
                    </span>
                    {canManage && apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED' && (
                      <>
                        <button
                          onClick={() => handleReschedule(apt.id)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Reschedule"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { if (confirm('Cancel this appointment?')) handleCancel(apt.id); }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </>
      )}
    </div>
  );
}
