'use client';

import { motion } from 'framer-motion';
import { Receipt, Plus, Download, Search } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const invoices = [
  { id: 'INV-001', patient: 'Emily Johnson', date: '2026-06-10', amount: 350.00, paid: 350.00, status: 'Paid' },
  { id: 'INV-002', patient: 'Michael Brown', date: '2026-06-09', amount: 520.00, paid: 200.00, status: 'Partial' },
  { id: 'INV-003', patient: 'Sarah Wilson', date: '2026-06-08', amount: 180.00, paid: 0, status: 'Pending' },
  { id: 'INV-004', patient: 'James Davis', date: '2026-06-07', amount: 1240.00, paid: 1240.00, status: 'Paid' },
  { id: 'INV-005', patient: 'Maria Garcia', date: '2026-06-06', amount: 675.00, paid: 0, status: 'Insurance Pending' },
  { id: 'INV-006', patient: 'Robert Kim', date: '2026-06-05', amount: 290.00, paid: 290.00, status: 'Paid' },
  { id: 'INV-007', patient: 'Linda Foster', date: '2026-06-04', amount: 880.00, paid: 0, status: 'Overdue' },
];

const statusColors: Record<string, string> = {
  'Paid': 'bg-green-50 text-green-700',
  'Partial': 'bg-blue-50 text-blue-700',
  'Pending': 'bg-amber-50 text-amber-700',
  'Insurance Pending': 'bg-purple-50 text-purple-700',
  'Overdue': 'bg-red-50 text-red-700',
  'Cancelled': 'bg-gray-50 text-gray-500',
};

export default function BillingPage() {
  const totalPending = invoices
    .filter(i => i.status === 'Pending' || i.status === 'Overdue')
    .reduce((sum, i) => sum + (i.amount - i.paid), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Invoicing</h1>
          <p className="text-gray-500 mt-1">Manage invoices, payments, and billing operations</p>
        </div>
        <Button>
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
                      <button className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors">
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
