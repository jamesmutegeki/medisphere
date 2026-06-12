'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Pill, Plus, Search, Clock, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const prescriptions = [
  { id: 'P-001', patient: 'Emily Johnson', medication: 'Lisinopril 10mg', dosage: '1 tablet daily', prescribed: '2026-06-10', status: 'Active', refills: 2 },
  { id: 'P-002', patient: 'Michael Brown', medication: 'Atorvastatin 20mg', dosage: '1 tablet at night', prescribed: '2026-06-09', status: 'Active', refills: 3 },
  { id: 'P-003', patient: 'Sarah Wilson', medication: 'Metformin 500mg', dosage: '2 tablets daily', prescribed: '2026-06-08', status: 'Active', refills: 1 },
  { id: 'P-004', patient: 'James Davis', medication: 'Amoxicillin 500mg', dosage: '1 tablet 3x daily', prescribed: '2026-06-07', status: 'Completed', refills: 0 },
  { id: 'P-005', patient: 'Maria Garcia', medication: 'Albuterol Inhaler', dosage: '2 puffs as needed', prescribed: '2026-06-06', status: 'Active', refills: 2 },
  { id: 'P-006', patient: 'Robert Kim', medication: 'Ibuprofen 400mg', dosage: '1 tablet as needed', prescribed: '2026-06-05', status: 'Active', refills: 4 },
];

export default function PrescriptionsPage() {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
          <p className="text-gray-500 mt-1">Create and manage e-prescriptions</p>
        </div>
        <Button onClick={() => router.push('/dashboard/prescriptions/new')}>
          <Plus className="w-4 h-4 mr-2" />
          New Prescription
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Prescriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {prescriptions.filter(p => p.status === 'Active').map((prescription, index) => (
                <motion.div
                  key={prescription.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-primary-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <Pill className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{prescription.medication}</p>
                    <p className="text-xs text-gray-500">{prescription.patient} &middot; {prescription.dosage}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {prescription.prescribed}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <AlertCircle className="w-3 h-3" />
                        {prescription.refills} refills left
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-50 text-green-700">
                    Active
                  </span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Prescriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {prescriptions.map((prescription, index) => (
                <motion.div
                  key={prescription.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{prescription.medication}</p>
                    <p className="text-xs text-gray-500">{prescription.patient}</p>
                  </div>
                  <span className={cn(
                    'px-2 py-1 text-xs font-medium rounded-full',
                    prescription.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'
                  )}>
                    {prescription.status}
                  </span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
