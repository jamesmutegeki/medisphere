'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Plus, Search, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const claims = [
  { id: 'CL-001', patient: 'Emily Johnson', provider: 'BlueCross', amount: 1200.00, status: 'Approved', date: '2026-06-08' },
  { id: 'CL-002', patient: 'Michael Brown', provider: 'Aetna', amount: 2500.00, status: 'In Review', date: '2026-06-07' },
  { id: 'CL-003', patient: 'Sarah Wilson', provider: 'Cigna', amount: 800.00, status: 'Submitted', date: '2026-06-06' },
  { id: 'CL-004', patient: 'James Davis', provider: 'BlueCross', amount: 3400.00, status: 'Approved', date: '2026-06-05' },
  { id: 'CL-005', patient: 'Maria Garcia', provider: 'UnitedHealth', amount: 1500.00, status: 'Denied', date: '2026-06-04' },
  { id: 'CL-006', patient: 'Robert Kim', provider: 'Aetna', amount: 950.00, status: 'In Review', date: '2026-06-03' },
];

const statusColors: Record<string, string> = {
  'Approved': 'bg-green-50 text-green-700',
  'In Review': 'bg-blue-50 text-blue-700',
  'Submitted': 'bg-amber-50 text-amber-700',
  'Denied': 'bg-red-50 text-red-700',
  'Paid': 'bg-emerald-50 text-emerald-700',
};

export default function InsurancePage() {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Insurance Processing</h1>
          <p className="text-gray-500 mt-1">Manage insurance claims, verify coverage, and track submissions</p>
        </div>
        <Button onClick={() => router.push('/dashboard/insurance/new')}>
          <Plus className="w-4 h-4 mr-2" />
          New Claim
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Claims</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{claims.length}</p>
              </div>
              <Shield className="w-8 h-8 text-primary-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Approved</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {claims.filter(c => c.status === 'Approved').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">In Review</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {claims.filter(c => c.status === 'In Review').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              ${claims.reduce((s, c) => s + c.amount, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Claims Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Insurance Claims</CardTitle>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search claims..."
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Claim ID</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Patient</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Provider</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">Amount</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim, index) => (
                  <motion.tr
                    key={claim.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-gray-900">{claim.id}</td>
                    <td className="py-3 px-4 text-gray-700">{claim.patient}</td>
                    <td className="py-3 px-4 text-gray-700">{claim.provider}</td>
                    <td className="py-3 px-4 text-right text-gray-700">${claim.amount.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={cn('px-2 py-1 text-xs font-medium rounded-full', statusColors[claim.status])}>
                        {claim.status === 'Approved' && <CheckCircle className="w-3 h-3 inline mr-1" />}
                        {claim.status === 'Denied' && <XCircle className="w-3 h-3 inline mr-1" />}
                        {claim.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">{claim.date}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
