'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Receipt } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const patients = [
  'Emily Johnson', 'Michael Brown', 'Sarah Wilson', 'James Davis',
];

export default function NewInvoicePage() {
  const router = useRouter();
  const [patient, setPatient] = useState('');
  const [consultationFee, setConsultationFee] = useState('0');
  const [labFees, setLabFees] = useState('0');
  const [medicationFees, setMedicationFees] = useState('0');
  const [wardCharges, setWardCharges] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [notes, setNotes] = useState('');

  const total = useMemo(() => {
    const fees =
      parseFloat(consultationFee || '0') +
      parseFloat(labFees || '0') +
      parseFloat(medicationFees || '0') +
      parseFloat(wardCharges || '0');
    const disc = parseFloat(discount || '0');
    return Math.max(0, fees - disc);
  }, [consultationFee, labFees, medicationFees, wardCharges, discount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Invoice created successfully!');
    router.push('/dashboard/billing');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/billing"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Invoice</h1>
          <p className="text-gray-500 mt-1">Create a new invoice for a patient</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary-600" />
            Invoice Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Patient</label>
              <select
                value={patient}
                onChange={(e) => setPatient(e.target.value)}
                required
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select patient</option>
                {patients.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Consultation Fee ($)"
                type="number"
                min="0"
                step="0.01"
                value={consultationFee}
                onChange={(e) => setConsultationFee(e.target.value)}
                required
              />
              <Input
                label="Lab Fees ($)"
                type="number"
                min="0"
                step="0.01"
                value={labFees}
                onChange={(e) => setLabFees(e.target.value)}
                required
              />
              <Input
                label="Medication Fees ($)"
                type="number"
                min="0"
                step="0.01"
                value={medicationFees}
                onChange={(e) => setMedicationFees(e.target.value)}
                required
              />
              <Input
                label="Ward Charges ($)"
                type="number"
                min="0"
                step="0.01"
                value={wardCharges}
                onChange={(e) => setWardCharges(e.target.value)}
                required
              />
              <Input
                label="Discount ($)"
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Invoice notes..."
              />
            </div>

            <div className="rounded-lg bg-primary-50 border border-primary-100 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-primary-800">Total Amount</span>
                <span className="text-2xl font-bold text-primary-700">
                  ${total.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-primary-600 mt-1">
                Calculated from fees minus discount
              </p>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button type="submit">
                Create Invoice
              </Button>
              <Link href="/dashboard/billing">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
