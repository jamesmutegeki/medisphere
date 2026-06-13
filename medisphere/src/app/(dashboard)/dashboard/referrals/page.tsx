'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRightLeft, User, Building2, AlertTriangle, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api, getErrorMessage } from '@/lib/api-client';

const statusColors: Record<string, string> = {
  Pending: 'bg-amber-50 text-amber-700',
  Accepted: 'bg-green-50 text-green-700',
  Declined: 'bg-red-50 text-red-700',
};

const priorityColors: Record<string, string> = {
  Normal: 'bg-blue-50 text-blue-700',
  Urgent: 'bg-amber-50 text-amber-700',
  Emergency: 'bg-red-50 text-red-700',
};

const tabs = ['All', 'Pending', 'Accepted', 'Declined'];

export default function ReferralsPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [referralsData, setReferralsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        setLoading(true);
        setError('');
        const res = await api.get<any>('/api/referrals');
        if (cancelled) return;
        const items = Array.isArray(res) ? res : res.referrals ?? res.data ?? [];
        const mapped = items.map((r: any) => ({
          id: r.id ?? `REF-${Math.random().toString(36).slice(2, 6)}`,
          patient: r.patient
            ? `${r.patient.firstName ?? ''} ${r.patient.lastName ?? ''}`.trim()
            : r.patientName ?? 'Unknown',
          referringDoctor: r.referringDoctor
            ? `Dr. ${r.referringDoctor.firstName ?? ''} ${r.referringDoctor.lastName ?? ''}`.trim()
            : r.referringDoctorName ?? 'Dr. Unknown',
          referredTo: r.referredTo ?? r.department ?? '',
          priority: r.priority ?? 'Normal',
          reason: r.reason ?? '',
          status: r.status ?? 'Pending',
          date: r.date ? r.date.split('T')[0] : '',
        }));
        setReferralsData(mapped);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const filtered = activeTab === 'All' ? referralsData : referralsData.filter(r => r.status === activeTab);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        <span className="ml-3 text-gray-500">Loading referrals...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Referral Management</h1>
            <p className="text-gray-500 mt-1">Track patient referrals across departments</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Referral Management</h1>
          <p className="text-gray-500 mt-1">Track patient referrals across departments</p>
        </div>
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

      {/* Referral Cards */}
      <div className="grid lg:grid-cols-2 gap-4">
        {filtered.map((ref, index) => (
          <motion.div
            key={ref.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 font-semibold text-sm">
                      {ref.patient.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{ref.patient}</p>
                      <p className="text-xs text-gray-500">{ref.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('px-2 py-1 text-xs font-medium rounded-full', priorityColors[ref.priority])}>
                      {ref.priority}
                    </span>
                    <span className={cn('px-2 py-1 text-xs font-medium rounded-full', statusColors[ref.status])}>
                      {ref.status}
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">Referring:</span> {ref.referringDoctor}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">Referred To:</span> {ref.referredTo}
                  </div>
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <ArrowRightLeft className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span>{ref.reason}</span>
                  </div>
                </div>

                {ref.status === 'Pending' && (
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">Accept</Button>
                    <Button size="sm" variant="outline" className="border-red-600 text-red-600 hover:bg-red-50">Decline</Button>
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
