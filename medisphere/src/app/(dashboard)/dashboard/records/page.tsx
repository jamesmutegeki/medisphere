'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Search, Plus, Download, Eye, ArrowLeft, User, Calendar, Activity, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getStoredUser, getInitials } from '@/lib/auth-store';
import { api, getErrorMessage } from '@/lib/api-client';

interface Patient {
  id: string;
  name: string;
  lastVisit: string;
  condition: string;
  records: number;
}

interface MedicalRecord {
  id: string;
  patientId: string;
  patient: string;
  date: string;
  diagnosis: string;
  doctor: string;
  type: string;
}

const typeColors: Record<string, string> = {
  'Consultation': 'bg-blue-50 text-blue-700',
  'Checkup': 'bg-green-50 text-green-700',
  'Follow-up': 'bg-purple-50 text-purple-700',
  'Emergency': 'bg-red-50 text-red-700',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function RecordsPage() {
  const router = useRouter();
  const [user, setUser] = useState(getStoredUser());
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [mockRecords, setMockRecords] = useState<MedicalRecord[]>([]);
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
        const data = await api.get<{ records: any[] }>('/api/medical-records');
        if (cancelled) return;
        const items = data.records || [];
        const records: MedicalRecord[] = items.map((r: any, idx: number) => ({
          id: r.id || `MR-${idx}`,
          patientId: r.patientId || r.patient?.id || '',
          patient: r.patient ? `${r.patient.firstName} ${r.patient.lastName}` : 'Unknown',
          date: r.date || '',
          diagnosis: r.diagnosis || '',
          doctor: r.doctor ? `Dr. ${r.doctor.firstName} ${r.doctor.lastName}` : 'Unassigned',
          type: r.type || 'Consultation',
        }));
        setMockRecords(records);

        const patientMap = new Map<string, Patient>();
        items.forEach((r: any) => {
          const pid = r.patientId || r.patient?.id || '';
          if (pid && !patientMap.has(pid)) {
            patientMap.set(pid, {
              id: pid,
              name: r.patient ? `${r.patient.firstName} ${r.patient.lastName}` : 'Unknown',
              lastVisit: r.date || '',
              condition: r.diagnosis || '',
              records: 0,
            });
          }
          if (pid) {
            const p = patientMap.get(pid);
            if (p) p.records = (p.records || 0) + 1;
          }
        });
        setPatients(Array.from(patientMap.values()));
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const isDoctor = user?.role === 'DOCTOR';
  const isPatient = user?.role === 'PATIENT';

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRecordsForPatient = (patientId: string) =>
    mockRecords.filter((r) => r.patientId === patientId);

  const getPatientRecords = () => {
    if (!user) return [];
    return mockRecords.filter((r) =>
      r.patient.toLowerCase().includes(user.firstName.toLowerCase()) &&
      r.patient.toLowerCase().includes(user.lastName.toLowerCase())
    );
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        <span className="ml-3 text-gray-500">Loading records...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Medical Records</h1>
            <p className="text-gray-500 mt-1">Access and manage patient electronic health records</p>
          </div>
          <Button onClick={() => router.push('/dashboard/records/new')}>
            <Plus className="w-4 h-4 mr-2" />
            New Record
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

  if (isDoctor && !selectedPatient) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Patients</h1>
            <p className="text-gray-500 mt-1">View and manage your assigned patients</p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredPatients.map((patient) => {
            const initials = getInitials(patient.name.split(' ')[0], patient.name.split(' ')[1] || '');
            const records = getRecordsForPatient(patient.id);
            return (
              <motion.div
                key={patient.id}
                variants={cardVariants}
                layout
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedPatient(patient)}
                className="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:border-primary-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 truncate">{patient.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      <Activity className="w-3 h-3 inline mr-1" />
                      {patient.condition}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {formatDate(patient.lastVisit)}
                      </span>
                      <span>
                        <FileText className="w-3 h-3 inline mr-1" />
                        {records.length} record{records.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {filteredPatients.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No patients found matching your search</p>
          </div>
        )}
      </div>
    );
  }

  if (isDoctor && selectedPatient) {
    const patientRecords = getRecordsForPatient(selectedPatient.id);
    const initials = getInitials(selectedPatient.name.split(' ')[0], selectedPatient.name.split(' ')[1] || '');

    return (
      <div className="space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedPatient.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setSelectedPatient(null)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
                {initials}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedPatient.name}</h1>
                <p className="text-gray-500 text-sm">{selectedPatient.condition} &middot; {patientRecords.length} record{patientRecords.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Medical Records</CardTitle>
                  <Button onClick={() => setSelectedPatient(null)} variant="outline" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Patients
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-4 text-gray-500 font-medium">Record ID</th>
                        <th className="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
                        <th className="text-left py-3 px-4 text-gray-500 font-medium">Diagnosis</th>
                        <th className="text-left py-3 px-4 text-gray-500 font-medium">Type</th>
                        <th className="text-left py-3 px-4 text-gray-500 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientRecords.map((record, index) => (
                        <motion.tr
                          key={record.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 px-4 font-medium text-gray-900">{record.id}</td>
                          <td className="py-3 px-4 text-gray-500">{record.date}</td>
                          <td className="py-3 px-4 text-gray-700 max-w-xs truncate">{record.diagnosis}</td>
                          <td className="py-3 px-4">
                            <span className={cn('px-2 py-1 text-xs font-medium rounded-full', typeColors[record.type])}>
                              {record.type}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button onClick={() => router.push(`/dashboard/records/${record.id}`)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button onClick={() => alert('Record downloaded')} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors">
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {patientRecords.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No records found for this patient</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  const displayRecords = isPatient ? getPatientRecords() : mockRecords;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medical Records</h1>
          <p className="text-gray-500 mt-1">Access and manage patient electronic health records</p>
        </div>
        <Button onClick={() => router.push('/dashboard/records/new')}>
          <Plus className="w-4 h-4 mr-2" />
          New Record
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Patient Records</CardTitle>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Record ID</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Patient</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Diagnosis</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Type</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayRecords.map((record, index) => (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-gray-900">{record.id}</td>
                    <td className="py-3 px-4 text-gray-700">{record.patient}</td>
                    <td className="py-3 px-4 text-gray-500">{record.date}</td>
                    <td className="py-3 px-4 text-gray-700 max-w-xs truncate">{record.diagnosis}</td>
                    <td className="py-3 px-4">
                      <span className={cn('px-2 py-1 text-xs font-medium rounded-full', typeColors[record.type])}>
                        {record.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => router.push(`/dashboard/records/${record.id}`)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => alert('Record downloaded')} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
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
