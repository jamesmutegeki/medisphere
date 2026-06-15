'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Syringe, Calendar, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api, getErrorMessage } from '@/lib/api-client';
import { getStoredUser } from '@/lib/auth-store';

export default function ImmunizationsPage() {
  const [user, setUser] = useState(getStoredUser());
  const [patients, setPatients] = useState<{ id: string; name: string }[]>([]);
  const [immunizationRecords, setImmunizationRecords] = useState<Record<string, any[]>>({});
  const [selectedPatient, setSelectedPatient] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        setLoading(true);
        setError('');
        const data = await api.get<{ immunizations: any[] }>('/api/immunizations');
        if (cancelled) return;
        const items = data.immunizations || [];
        const recordsMap: Record<string, any[]> = {};
        const patientSet: Record<string, string> = {};
        items.forEach((r: any) => {
          const pid = r.patientId || r.patient?.id || 'unknown';
          const pname = r.patient ? `${r.patient.firstName} ${r.patient.lastName}` : 'Unknown';
          patientSet[pid] = pname;
          if (!recordsMap[pid]) recordsMap[pid] = [];
          recordsMap[pid].push({
            id: r.id,
            vaccine: r.vaccineName || r.vaccine || '',
            dose: r.doseNumber ? `Dose ${r.doseNumber}` : r.dose || '',
            date: r.administrationDate || r.date || '',
            nextDose: r.nextDoseDate || r.nextDose || 'Completed',
            administeredBy: r.provider
              ? `${r.provider.firstName} ${r.provider.lastName}`
              : r.administeredBy || '',
          });
        });
        if (!cancelled) {
          setPatients(Object.entries(patientSet).map(([id, name]) => ({ id, name })));
          setImmunizationRecords(recordsMap);
          const firstId = Object.keys(patientSet)[0] || '';
          setSelectedPatient(firstId);
        }
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
  const records = isPatient
    ? (immunizationRecords[user?.id || ''] || [])
    : (immunizationRecords[selectedPatient] || []);
  const completedCount = records.filter((r: any) => r.nextDose === 'Completed').length;
  const upcomingCount = records.filter((r: any) => r.nextDose !== 'Completed').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        <span className="ml-3 text-gray-500">Loading immunization records...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Immunization Records</h1>
          <p className="text-gray-500 mt-1">Vaccination history and scheduled doses</p>
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
        <h1 className="text-2xl font-bold text-gray-900">Immunization Records</h1>
        <p className="text-gray-500 mt-1">Vaccination history and scheduled doses</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Immunization History</CardTitle>
                {!isPatient && (
                  <select
                    value={selectedPatient}
                    onChange={(e) => setSelectedPatient(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Vaccine</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Dose</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Date Administered</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Next Dose</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Administered By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record, index) => (
                      <motion.tr
                        key={record.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-gray-900">{record.vaccine}</td>
                        <td className="py-3 px-4 text-gray-700">{record.dose}</td>
                        <td className="py-3 px-4 text-gray-500">{new Date(record.date).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <span className={cn(
                            'text-xs font-medium',
                            record.nextDose === 'Completed' ? 'text-green-600' : 'text-amber-600'
                          )}>
                            {record.nextDose === 'Completed' ? 'Completed' : new Date(record.nextDose).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500">{record.administeredBy}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {records.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Syringe className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No immunization records found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-semibold text-green-700">{completedCount} Completed</p>
                    <p className="text-xs text-green-600">Vaccines fully administered</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50">
                  <Calendar className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="text-sm font-semibold text-amber-700">{upcomingCount} Upcoming</p>
                    <p className="text-xs text-amber-600">Doses due or scheduled</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
