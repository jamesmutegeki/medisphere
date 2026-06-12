'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Pill } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const patients = [
  'Emily Johnson', 'Michael Brown', 'Sarah Wilson',
  'James Davis', 'Maria Garcia', 'Robert Kim', 'Linda Foster',
];

export default function NewPrescriptionPage() {
  const router = useRouter();
  const [patient, setPatient] = useState('');
  const [medication, setMedication] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [duration, setDuration] = useState('');
  const [instructions, setInstructions] = useState('');
  const [refills, setRefills] = useState('0');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Prescription created successfully!');
    router.push('/dashboard/prescriptions');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/prescriptions"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Prescription</h1>
          <p className="text-gray-500 mt-1">Create a new e-prescription</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-primary-600" />
            Prescription Details
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

            <Input
              label="Medication"
              placeholder="e.g. Lisinopril 10mg"
              value={medication}
              onChange={(e) => setMedication(e.target.value)}
              required
            />

            <Input
              label="Dosage"
              placeholder="e.g. 1 tablet daily"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              required
            />

            <Input
              label="Frequency"
              placeholder="e.g. Once daily, Twice daily"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              required
            />

            <Input
              label="Duration"
              placeholder="e.g. 7 days, 30 days"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Instructions</label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Additional instructions..."
              />
            </div>

            <Input
              label="Refills"
              type="number"
              min="0"
              value={refills}
              onChange={(e) => setRefills(e.target.value)}
              required
            />

            <div className="flex items-center gap-3 pt-4">
              <Button type="submit">
                Create Prescription
              </Button>
              <Link href="/dashboard/prescriptions">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
