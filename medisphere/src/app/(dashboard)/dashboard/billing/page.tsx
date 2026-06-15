'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, Plus, Download, Search, Loader2, AlertCircle, X, FileText, Calendar, CreditCard, Building2, DollarSign } from 'lucide-react';
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
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [user, setUser] = useState(getStoredUser());

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

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
          invoiceNumber: inv.invoiceNumber,
          patient: inv.patient ? `${inv.patient.firstName} ${inv.patient.lastName}` : 'Unknown',
          date: inv.date || inv.createdAt || '',
          amount: Number(inv.totalAmount ?? inv.amount ?? 0),
          paid: Number(inv.paidAmount ?? inv.paid ?? 0),
          status: inv.status || 'Pending',
          consultationFee: Number(inv.consultationFee ?? 0),
          labFees: Number(inv.labFees ?? 0),
          medicationFees: Number(inv.medicationFees ?? 0),
          wardCharges: Number(inv.wardCharges ?? 0),
          otherCharges: Number(inv.otherCharges ?? 0),
          discount: Number(inv.discount ?? 0),
          tax: Number(inv.tax ?? 0),
          notes: inv.notes || '',
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

  const isPatient = user?.role === 'PATIENT';

  const totalPending = invoices
    .filter(i => i.status === 'Pending' || i.status === 'Overdue')
    .reduce((sum, i) => sum + (i.amount - i.paid), 0);

  const formatCurrency = (val: number) => `$${val.toFixed(2)}`;

  const chargeRows = selectedInvoice ? [
    { label: 'Consultation Fee', amount: selectedInvoice.consultationFee },
    { label: 'Lab Fees', amount: selectedInvoice.labFees },
    { label: 'Medication Fees', amount: selectedInvoice.medicationFees },
    { label: 'Ward Charges', amount: selectedInvoice.wardCharges },
    { label: 'Other Charges', amount: selectedInvoice.otherCharges },
  ].filter(r => r.amount > 0) : [];

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
          {!isPatient && (
            <Button onClick={() => router.push('/dashboard/billing/new')}>
              <Plus className="w-4 h-4 mr-2" />
              New Invoice
            </Button>
          )}
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
        {!isPatient && (
          <Button onClick={() => router.push('/dashboard/billing/new')}>
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </Button>
        )}
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
                  {!isPatient && <th className="text-left py-3 px-4 text-gray-500 font-medium">Patient</th>}
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
                    onClick={() => setSelectedInvoice(inv)}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-medium text-gray-900">{inv.invoiceNumber || inv.id}</td>
                    {!isPatient && <td className="py-3 px-4 text-gray-700">{inv.patient}</td>}
                    <td className="py-3 px-4 text-gray-500">{new Date(inv.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(inv.amount)}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(inv.paid)}</td>
                    <td className="py-3 px-4">
                      <span className={cn('px-2 py-1 text-xs font-medium rounded-full', statusColors[inv.status])}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedInvoice(inv); }}
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                      >
                        <Receipt className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {invoices.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No invoices found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Detail Modal */}
      <AnimatePresence>
        {selectedInvoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedInvoice(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Invoice Details</h2>
                  <p className="text-sm text-gray-500">{selectedInvoice.invoiceNumber || selectedInvoice.id}</p>
                </div>
                <button onClick={() => setSelectedInvoice(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Patient</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{selectedInvoice.patient}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{new Date(selectedInvoice.date).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Charge Breakdown</h3>
                  <div className="space-y-2">
                    {chargeRows.map((row) => (
                      <div key={row.label} className="flex justify-between text-sm">
                        <span className="text-gray-600">{row.label}</span>
                        <span className="text-gray-900 font-medium">{formatCurrency(row.amount)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 mt-3 pt-3 space-y-1">
                    {selectedInvoice.discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Discount</span>
                        <span className="text-green-600 font-medium">-{formatCurrency(selectedInvoice.discount)}</span>
                      </div>
                    )}
                    {selectedInvoice.tax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax</span>
                        <span className="text-gray-900 font-medium">{formatCurrency(selectedInvoice.tax)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">{formatCurrency(selectedInvoice.amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Paid</span>
                      <span className="text-green-600 font-medium">{formatCurrency(selectedInvoice.paid)}</span>
                    </div>
                    {selectedInvoice.amount - selectedInvoice.paid > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-red-600">Balance Due</span>
                        <span className="text-red-600 font-medium">{formatCurrency(selectedInvoice.amount - selectedInvoice.paid)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={cn('px-2 py-1 text-xs font-medium rounded-full', statusColors[selectedInvoice.status])}>
                      {selectedInvoice.status}
                    </span>
                  </div>
                </div>

                {selectedInvoice.notes && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Notes</p>
                    <p className="text-sm text-gray-700 mt-1">{selectedInvoice.notes}</p>
                  </div>
                )}

                <Button className="w-full" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download Invoice
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
