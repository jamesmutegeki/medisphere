'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Receipt, Plus, Download, Search, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api, getErrorMessage } from '@/lib/api-client';
import { getStoredUser } from '@/lib/auth-store';

const statusColors: Record<string, string> = {
  'Paid': 'bg-green-50 text-green-700',
  'Partial': 'bg-blue-50 text-blue-700',
  'Pending': 'bg-amber-50 text-amber-700',
  'Insurance Pending': 'bg-purple-50 text-purple-700',
  'Overdue': 'bg-red-50 text-red-700',
  'Cancelled': 'bg-gray-50 text-gray-500',
};

export default function BillingPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        setLoading(true);
        setError('');
        const data = await api.get<{ invoices: any[] }>('/api/invoices');
        if (cancelled) return;
        setInvoices((data.invoices || []).map((inv: any) => ({
          id: inv.id,
          patient: inv.patient ? `${inv.patient.firstName} ${inv.patient.lastName}` : 'Unknown',
          date: inv.date || '',
          amount: inv.amount ?? 0,
          paid: inv.paidAmount ?? inv.paid ?? 0,
          status: inv.status || 'Pending',
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

  const totalPending = invoices
    .filter(i => i.status === 'Pending' || i.status === 'Overdue')
    .reduce((sum, i) => sum + (i.amount - i.paid), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        <span className="ml-3 text-gray-500">Loading billing data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Billing & Invoicing</h1>
            <p className="text-gray-500 mt-1">Manage invoices, payments, and billing operations</p>
          </div>
          <Button onClick={() => router.push('/dashboard/billing/new')}>
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </Button>
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
          <h1 className="text-2xl font-bold text-gray-900">Billing & Invoicing</h1>
          <p className="text-gray-500 mt-1">Manage invoices, payments, and billing operations</p>
        </div>
        <Button onClick={() => router.push('/dashboard/billing/new')}>
          <Plus className="w-4 h-4 mr-2" />
          New Invoice
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Invoices</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{invoices.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Collected</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              ${invoices.reduce((s, i) => s + i.paid, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Pending Amount</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              ${totalPending.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Overdue</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              ${invoices.filter(i => i.status === 'Overdue').reduce((s, i) => s + i.amount, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Invoices</CardTitle>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search invoices..."
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
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Invoice</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Patient</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">Amount</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">Paid</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, index) => (
                  <motion.tr
                    key={inv.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-gray-900">{inv.id}</td>
                    <td className="py-3 px-4 text-gray-700">{inv.patient}</td>
                    <td className="py-3 px-4 text-gray-500">{inv.date}</td>
                    <td className="py-3 px-4 text-right text-gray-700">${inv.amount.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-gray-700">${inv.paid.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={cn('px-2 py-1 text-xs font-medium rounded-full', statusColors[inv.status])}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button onClick={() => alert('Invoice downloaded')} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
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
