'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, AlertTriangle, ArrowUpDown, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api, getErrorMessage } from '@/lib/api-client';

const priorityColors: Record<string, string> = {
  Critical: 'bg-red-50 text-red-700',
  High: 'bg-orange-50 text-orange-700',
  Normal: 'bg-blue-50 text-blue-700',
  Low: 'bg-gray-50 text-gray-600',
};

export default function WaitlistPage() {
  const [activeDept, setActiveDept] = useState('Emergency');
  const [queueData, setQueueData] = useState<Record<string, any[]>>({});
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        setLoading(true);
        setError('');
        const res = await api.get<any>('/api/waitlist');
        if (cancelled) return;
        const items = Array.isArray(res) ? res : res.waitlist ?? res.data ?? [];
        const grouped: Record<string, any[]> = {};
        for (const w of items) {
          const dept = w.department ?? 'General';
          if (!grouped[dept]) grouped[dept] = [];
          const firstName = w.patient?.firstName ?? '';
          const lastName = w.patient?.lastName ?? '';
          grouped[dept].push({
            id: w.id ?? `W-${Math.random().toString(36).slice(2, 6)}`,
            name: `${firstName} ${lastName}`.trim() || w.patientName || 'Unknown',
            checkIn: w.checkInTime
              ? w.checkInTime.includes('T')
                ? new Date(w.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                : w.checkInTime
              : '',
            estimatedWait: w.estimatedWait ?? '',
            priority: w.priority ?? 'Normal',
          });
        }
        setQueueData(grouped);
        setDepartments(Object.keys(grouped));
        if (!grouped[activeDept] && Object.keys(grouped).length > 0) {
          setActiveDept(Object.keys(grouped)[0]);
        }
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [activeDept]);

  const queue = queueData[activeDept] || [];
  const totalWaiting = queue.length;
  const avgWait = queue.length > 0
    ? Math.round(queue.reduce((sum, q) => {
        const mins = parseInt(q.estimatedWait);
        return sum + (isNaN(mins) ? 0 : mins);
      }, 0) / queue.length)
    : 0;
  const longestWait = queue.length > 0
    ? Math.max(...queue.map((q: any) => {
        const mins = parseInt(q.estimatedWait);
        return isNaN(mins) ? 0 : mins;
      }))
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        <span className="ml-3 text-gray-500">Loading waitlist...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Waitlist & Queue Management</h1>
          <p className="text-gray-500 mt-1">Live queue board for ER and walk-in clinics</p>
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
        <h1 className="text-2xl font-bold text-gray-900">Waitlist & Queue Management</h1>
        <p className="text-gray-500 mt-1">Live queue board for ER and walk-in clinics</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[{ label: 'Total Waiting', value: totalWaiting, icon: Users },
          { label: 'Avg Wait Time', value: avgWait + ' min', icon: Clock },
          { label: 'Longest Wait', value: longestWait + ' min', icon: ArrowUpDown },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setActiveDept(dept)}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-all',
                  activeDept === dept
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {dept}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Patient</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Check-in Time</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Estimated Wait</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Priority</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((item: any, index: number) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-gray-900">{item.name}</td>
                    <td className="py-3 px-4 text-gray-500">{item.checkIn}</td>
                    <td className="py-3 px-4 text-gray-700">{item.estimatedWait}</td>
                    <td className="py-3 px-4">
                      <span className={cn('px-2 py-1 text-xs font-medium rounded-full', priorityColors[item.priority])}>
                        {item.priority}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {queue.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No patients in queue</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
