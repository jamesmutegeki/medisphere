'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Users, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api, getErrorMessage } from '@/lib/api-client';

const statusColors: Record<string, string> = {
  Pending: 'bg-amber-50 text-amber-700',
  Approved: 'bg-green-50 text-green-700',
  Declined: 'bg-red-50 text-red-700',
};

const tabs = ['Pending Requests', 'Approved', 'All'];

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function computeDuration(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = end.getTime() - start.getTime();
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)) + 1);
}

export default function LeaveManagementPage() {
  const [activeTab, setActiveTab] = useState('Pending Requests');
  const [leaveRequestsData, setLeaveRequestsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        setLoading(true);
        setError('');
        const res = await api.get<any>('/api/leave-requests');
        if (cancelled) return;
        const items = Array.isArray(res) ? res : res.leaveRequests ?? res.data ?? [];
        const mapped = items.map((r: any) => {
          const firstName = r.user?.firstName ?? '';
          const lastName = r.user?.lastName ?? '';
          return {
            id: r.id,
            staffName: `${firstName} ${lastName}`.trim() || r.staffName || 'Unknown',
            type: r.type ?? 'Annual',
            startDate: r.startDate ? r.startDate.split('T')[0] : '',
            endDate: r.endDate ? r.endDate.split('T')[0] : '',
            duration: r.duration ?? computeDuration(r.startDate, r.endDate),
            reason: r.reason ?? '',
            status: r.status ?? 'Pending',
          };
        });
        setLeaveRequestsData(mapped);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const filtered = activeTab === 'All'
    ? leaveRequestsData
    : activeTab === 'Approved'
      ? leaveRequestsData.filter(l => l.status === 'Approved')
      : leaveRequestsData.filter(l => l.status === 'Pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        <span className="ml-3 text-gray-500">Loading leave requests...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-500 mt-1">Staff vacation and absence requests</p>
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
        <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
        <p className="text-gray-500 mt-1">Staff vacation and absence requests</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              activeTab === tab
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary-600" />
            This Week - Leave Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">{day}</div>
            ))}
            {weekDays.map((day, i) => {
              const date = 8 + i;
              const onLeave = leaveRequestsData.filter((r: any) =>
                r.status === 'Approved' &&
                parseInt(r.startDate.split('-')[2]) <= date &&
                parseInt(r.endDate.split('-')[2]) >= date
              );
              return (
                <div key={day} className="border border-gray-100 rounded-lg p-2 min-h-[80px]">
                  <span className="text-xs font-medium text-gray-700">{date}</span>
                  {onLeave.map((l: any) => (
                    <p key={l.id} className="text-[10px] text-primary-600 bg-primary-50 rounded px-1 mt-1 truncate">
                      {l.staffName.split(' ').pop()}
                    </p>
                  ))}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Request Cards */}
      <div className="grid lg:grid-cols-2 gap-4">
        {filtered.map((req, index) => (
          <motion.div
            key={req.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 font-semibold text-sm">
                      {req.staffName.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{req.staffName}</p>
                      <p className="text-xs text-gray-500">{req.type} Leave</p>
                    </div>
                  </div>
                  <span className={cn('px-2 py-1 text-xs font-medium rounded-full', statusColors[req.status])}>
                    {req.status}
                  </span>
                </div>

                <div className="mt-4 space-y-1.5 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-gray-400" />
                    <span>{req.startDate} → {req.endDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>{req.duration} day{req.duration > 1 ? 's' : ''}</span>
                  </div>
                  <p className="text-gray-500 mt-1">{req.reason}</p>
                </div>

                {req.status === 'Pending' && (
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" className="border-red-600 text-red-600 hover:bg-red-50">
                      <XCircle className="w-4 h-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
