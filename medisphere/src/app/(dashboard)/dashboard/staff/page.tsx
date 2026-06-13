'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, Calendar, Clock, Plus, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api, getErrorMessage } from '@/lib/api-client';

const statusColors: Record<string, string> = {
  'On Duty': 'bg-green-50 text-green-700',
  'Off Duty': 'bg-gray-50 text-gray-500',
  'On Leave': 'bg-amber-50 text-amber-700',
  'Sick': 'bg-red-50 text-red-700',
};

export default function StaffRotaPage() {
  const router = useRouter();
  const [departmentsData, setDepartmentsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        setLoading(true);
        setError('');
        const res = await api.get<any>('/api/staff-shifts');
        if (cancelled) return;
        const shifts = Array.isArray(res) ? res : res.shifts ?? res.data ?? [];
        const grouped: Record<string, any[]> = {};
        for (const s of shifts) {
          const dept = s.department ?? s.ward ?? 'General';
          if (!grouped[dept]) grouped[dept] = [];
          const firstName = s.user?.firstName ?? '';
          const lastName = s.user?.lastName ?? '';
          const role = s.user?.role ?? 'Staff';
          const name = role === 'DOCTOR' || role === 'Doctor'
            ? `Dr. ${firstName} ${lastName}`.trim()
            : `${role === 'NURSE' ? 'Nurse ' : ''}${firstName} ${lastName}`.trim();
          const startTime = s.startTime ?? '';
          const endTime = s.endTime ?? '';
          const shiftStr = startTime && endTime ? `${startTime} - ${endTime}` : 'N/A';
          const now = new Date();
          const shiftDate = s.date ? new Date(s.date) : new Date();
          const isToday = shiftDate.toDateString() === now.toDateString();
          const status = isToday ? 'On Duty' : 'Off Duty';
          grouped[dept].push({ name, role: role === 'DOCTOR' ? 'Doctor' : role === 'NURSE' ? 'Nurse' : role, shift: shiftStr, status });
        }
        const mapped = Object.entries(grouped).map(([name, staff]) => ({ name, staff }));
        setDepartmentsData(mapped);
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
        <span className="ml-3 text-gray-500">Loading staff rota data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Staff Rota Management</h1>
            <p className="text-gray-500 mt-1">Schedule and manage staff shifts across all departments</p>
          </div>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Rota Management</h1>
          <p className="text-gray-500 mt-1">Schedule and manage staff shifts across all departments</p>
        </div>
        <Button onClick={() => router.push('/dashboard/staff/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Shift
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {departmentsData.map((dept, index) => (
          <motion.div
            key={dept.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-600" />
                  {dept.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dept.staff.map((member: any) => (
                    <div
                      key={member.name}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-primary-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 font-semibold text-sm">
                          {member.name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.role}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-400">{member.shift}</span>
                          </div>
                        </div>
                      </div>
                      <span className={cn('px-2 py-1 text-xs font-medium rounded-full', statusColors[member.status])}>
                        {member.status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
