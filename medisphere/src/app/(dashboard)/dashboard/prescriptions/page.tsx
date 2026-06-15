'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Pill, Plus, Search, Clock, AlertCircle, Loader2, Package } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api, getErrorMessage } from '@/lib/api-client';
import { getStoredUser } from '@/lib/auth-store';

export default function PrescriptionsPage() {
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [pharmacyItems, setPharmacyItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
        const [rxData, pharmData] = await Promise.all([
          api.get<{ prescriptions: any[] }>('/api/prescriptions').catch(() => ({ prescriptions: [] })),
          api.get<{ items: any[] }>('/api/pharmacy').catch(() => ({ items: [] })),
        ]);
        if (cancelled) return;
        const rxItems = rxData.prescriptions || [];
        setPrescriptions(rxItems.map((p: any) => ({
          id: p.id,
          patient: p.patient ? `${p.patient.firstName} ${p.patient.lastName}` : 'Unknown',
          medication: p.medication || p.medicationName || '',
          dosage: p.dosage || '',
          prescribed: p.prescribedAt || p.date || '',
          status: p.isActive ? 'Active' : 'Completed',
          refills: p.refills ?? 0,
          doctor: p.doctor ? `Dr. ${p.doctor.firstName} ${p.doctor.lastName}` : '',
        })));
        setPharmacyItems((pharmData.items || []).slice(0, 8));
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        <span className="ml-3 text-gray-500">Loading prescriptions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
          <p className="text-gray-500 mt-1">Create and manage e-prescriptions</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
          <p className="text-gray-500 mt-1">Create and manage e-prescriptions</p>
        </div>
        {!isPatient && (
          <Button onClick={() => router.push('/dashboard/prescriptions/new')}>
            <Plus className="w-4 h-4 mr-2" />
            New Prescription
          </Button>
        )}
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
                        {new Date(prescription.prescribed).toLocaleDateString()}
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
              {prescriptions.filter(p => p.status === 'Active').length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Pill className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No active prescriptions</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{isPatient ? 'Pharmacy Stock' : 'Recent Prescriptions'}</CardTitle>
          </CardHeader>
          <CardContent>
            {isPatient ? (
              <div className="space-y-3">
                {pharmacyItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Package className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.medicationName}</p>
                        <p className="text-xs text-gray-500">{item.genericName || item.category}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={cn(
                        'text-xs font-medium',
                        item.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {item.stockQuantity > 0 ? `${item.stockQuantity} in stock` : 'Out of stock'}
                      </p>
                      <p className="text-xs text-gray-400">${Number(item.unitPrice).toFixed(2)}</p>
                    </div>
                  </motion.div>
                ))}
                {pharmacyItems.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Pharmacy stock data unavailable</p>
                  </div>
                )}
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
