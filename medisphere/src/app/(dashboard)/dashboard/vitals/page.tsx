'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Activity, Heart, Thermometer, Wind, Droplets, Weight, Loader2, AlertCircle, Search } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { api, getErrorMessage } from '@/lib/api-client';
import { getStoredUser } from '@/lib/auth-store';

export default function VitalsPage() {
  const [patientsData, setPatientsData] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError('');
      const data = await api.get<any>('/api/vitals');
      const items = Array.isArray(data) ? data : data.vitals || [];

      const grouped: Record<string, { patient: any; records: any[] }> = {};
      items.forEach((v: any) => {
        const pid = v.patient?.id || v.patientId;
        if (!pid) return;
        if (!grouped[pid]) grouped[pid] = { patient: v.patient || { id: pid, firstName: 'Unknown', lastName: '' }, records: [] };
        grouped[pid].records.push(v);
      });

      setPatientsData(Object.values(grouped));
      if (Object.keys(grouped).length > 0) setSelectedPatient(Object.keys(grouped)[0]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const filteredPatients = patientsData.filter((p: any) =>
    `${p.patient.firstName} ${p.patient.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedData = patientsData.find((p: any) => p.patient.id === selectedPatient);
  const latest = selectedData?.records?.[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        <span className="ml-3 text-gray-500">Loading vitals data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vitals Tracking</h1>
          <p className="text-gray-500 mt-1">Monitor and record patient vital signs</p>
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
        <h1 className="text-2xl font-bold text-gray-900">Vitals Tracking</h1>
        <p className="text-gray-500 mt-1">Monitor and record patient vital signs</p>
      </div>

      {/* Patient Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {filteredPatients.map((p: any) => {
              const name = `${p.patient.firstName} ${p.patient.lastName}`;
              return (
                <button
                  key={p.patient.id}
                  onClick={() => setSelectedPatient(p.patient.id)}
                  className={cn(
                    'flex-shrink-0 px-4 py-2 text-sm rounded-lg border transition-colors',
                    selectedPatient === p.patient.id
                      ? 'bg-primary-50 border-primary-300 text-primary-700 font-medium'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  )}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedData && latest && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Blood Pressure', value: latest.bloodPressureSystolic ? `${latest.bloodPressureSystolic}/${latest.bloodPressureDiastolic}` : '--', unit: 'mmHg', icon: Activity, color: 'from-blue-500 to-cyan-500' },
              { label: 'Heart Rate', value: latest.heartRate ?? '--', unit: 'bpm', icon: Heart, color: 'from-red-500 to-rose-500' },
              { label: 'Temperature', value: latest.temperature ?? '--', unit: '°F', icon: Thermometer, color: 'from-orange-500 to-amber-500' },
              { label: 'Respiratory Rate', value: latest.respiratoryRate ?? '--', unit: 'breaths/min', icon: Wind, color: 'from-emerald-500 to-teal-500' },
              { label: 'O2 Saturation', value: latest.oxygenSaturation ?? '--', unit: '%', icon: Droplets, color: 'from-violet-500 to-purple-500' },
              { label: 'Weight', value: latest.weight ?? '--', unit: 'lbs', icon: Weight, color: 'from-gray-500 to-slate-500' },
            ].map((vital, index) => {
              const Icon = vital.icon;
              return (
                <motion.div key={vital.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                  <Card className="text-center">
                    <CardContent className="p-4">
                      <div className={cn('w-10 h-10 rounded-full bg-gradient-to-br mx-auto mb-2 flex items-center justify-center', vital.color)}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{String(vital.value)}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{vital.unit}</p>
                      <p className="text-xs text-gray-400 mt-1">{vital.label}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Vitals History — {selectedData.patient.firstName} {selectedData.patient.lastName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">BP</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">HR</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Temp</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">RR</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">SpO2</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedData.records.map((v: any, index: number) => (
                      <motion.tr key={v.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.03 }} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-medium text-gray-900">{new Date(v.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                        <td className="py-3 px-4 text-gray-700">{v.bloodPressureSystolic ? `${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}` : '--'}</td>
                        <td className="py-3 px-4 text-gray-700">{v.heartRate ?? '--'}</td>
                        <td className="py-3 px-4 text-gray-700">{v.temperature ?? '--'}</td>
                        <td className="py-3 px-4 text-gray-700">{v.respiratoryRate ?? '--'}</td>
                        <td className="py-3 px-4 text-gray-700">{v.oxygenSaturation ?? '--'}%</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {patientsData.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No vitals data available</p>
        </div>
      )}
    </div>
  );
}
