'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api, buildQueryString, getErrorMessage } from '@/lib/api-client';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const hours = Array.from({ length: 9 }, (_, i) => `${i + 8}:00`);

const slotColors: Record<string, string> = {
  available: 'bg-green-100 hover:bg-green-200 text-green-700',
  booked: 'bg-red-100 text-red-500 cursor-not-allowed',
  unavailable: 'bg-gray-100 text-gray-400 cursor-not-allowed',
};

const slotLabels: Record<string, string> = {
  available: 'Available',
  booked: 'Booked',
  unavailable: 'Unavailable',
};

function getWeekDates(): string[] {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

export default function AvailabilityPage() {
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);
  const [slots, setSlots] = useState<Record<string, Record<string, 'available' | 'booked' | 'unavailable'>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function fetchDoctors() {
      try {
        setLoading(true);
        setError('');
        const res = await api.get<any>('/api/users?role=DOCTOR');
        if (cancelled) return;
        const users = Array.isArray(res) ? res : res.users ?? res.data ?? [];
        const mapped = users.map((u: any) => ({
          id: u.id,
          name: `Dr. ${u.firstName ?? ''} ${u.lastName ?? ''}`.trim(),
        }));
        setDoctors(mapped);
        if (mapped.length > 0 && !selectedDoctor) {
          setSelectedDoctor(mapped[0].id);
        }
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchDoctors();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedDoctor) return;
    let cancelled = false;
    async function fetchAvailability() {
      try {
        setLoading(true);
        const weekDates = getWeekDates();
        const allSlots: Record<string, Record<string, 'available' | 'booked' | 'unavailable'>> = {};
        for (const date of weekDates) {
          const qs = buildQueryString({ doctorId: selectedDoctor, date });
          const res = await api.get<any>(`/api/doctor-availability${qs}`);
          if (cancelled) return;
          const slotsArr = Array.isArray(res) ? res : res.slots ?? res.data ?? [];
          const daySlots: Record<string, 'available' | 'booked' | 'unavailable'> = {};
          for (const h of hours) {
            daySlots[h] = 'unavailable';
          }
          for (const s of slotsArr) {
            const hour = s.hour ?? s.time ?? '';
            const status = s.status === 'BOOKED' ? 'booked' : s.status === 'AVAILABLE' ? 'available' : 'unavailable';
            if (daySlots[hour] !== undefined) {
              daySlots[hour] = status;
            }
          }
          const dayName = days[weekDates.indexOf(date)];
          allSlots[dayName] = daySlots;
        }
        if (!cancelled) setSlots(allSlots);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchAvailability();
    return () => { cancelled = true; };
  }, [selectedDoctor]);

  useEffect(() => {
    if (doctors.length > 0 && !selectedDoctor) {
      setSelectedDoctor(doctors[0].id);
    }
  }, [doctors, selectedDoctor]);

  const toggleSlot = (day: string, hour: string) => {
    setSlots((prev) => {
      const current = prev[day]?.[hour];
      if (!current || current === 'booked') return prev;
      const next = current === 'available' ? 'unavailable' : 'available';
      return {
        ...prev,
        [day]: { ...prev[day], [hour]: next },
      };
    });
  };

  if (loading && doctors.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        <span className="ml-3 text-gray-500">Loading availability data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctor Availability</h1>
          <p className="text-gray-500 mt-1">Manage consultation schedules</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{error}. Please ensure the database is running.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Doctor Availability</h1>
        <p className="text-gray-500 mt-1">Manage consultation schedules</p>
      </div>

      <div className="flex items-center gap-4">
        <User className="w-5 h-5 text-gray-400" />
        <select
          value={selectedDoctor}
          onChange={(e) => setSelectedDoctor(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-500" />
            <CardTitle>Weekly Schedule</CardTitle>
          </div>
          <div className="flex items-center gap-4 mt-2">
            {(['available', 'booked', 'unavailable'] as const).map((type) => (
              <div key={type} className="flex items-center gap-2">
                <div className={cn('w-3 h-3 rounded', slotColors[type].split(' ')[0])} />
                <span className="text-xs text-gray-500">{slotLabels[type]}</span>
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="py-2 pr-4 text-left text-gray-500 font-medium w-16">Time</th>
                  {days.map((day) => (
                    <th key={day} className="py-2 px-2 text-center text-gray-500 font-medium min-w-[100px]">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hours.map((hour) => (
                  <tr key={hour} className="border-t border-gray-50">
                    <td className="py-2 pr-4 text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {hour}
                    </td>
                    {days.map((day) => {
                      const status = slots[day]?.[hour] ?? 'unavailable';
                      return (
                        <td key={day} className="py-1 px-2">
                          <button
                            onClick={() => toggleSlot(day, hour)}
                            disabled={status === 'booked'}
                            className={cn(
                              'w-full py-2 px-1 rounded-lg text-xs font-medium transition-all',
                              slotColors[status]
                            )}
                          >
                            {slotLabels[status]}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
