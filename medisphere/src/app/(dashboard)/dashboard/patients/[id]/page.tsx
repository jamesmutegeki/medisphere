'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Activity, FlaskConical, Pill, FileText, User, Mail, Phone, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api, getErrorMessage } from '@/lib/api-client';

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [vitals, setVitals] = useState<any[]>([]);
  const [labResults, setLabResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [userData, aptData, vitalsData, labData] = await Promise.all([
        api.get<{ user: any }>(`/users/${params.id}`),
        api.get<{ appointments: any[] }>(`/appointments`).catch(() => ({ appointments: [] })),
        api.get<any>(`/vitals`).catch(() => []),
        api.get<{ results?: any[] }>(`/lab-results`).catch(() => ({ results: [] })),
      ]);

      setUser(userData.user);
      const allApts = aptData.appointments || [];
      setAppointments(allApts.filter((a: any) => a.patient?.id === params.id));

      const allVitals = Array.isArray(vitalsData) ? vitalsData : [];
      setVitals(allVitals.filter((v: any) => v.patient?.id === params.id));

      const allLabs = labData.results || [];
      setLabResults(allLabs.filter((l: any) => l.patient?.id === params.id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Patient not found</h3>
        <p className="text-sm text-gray-500 mt-1">{error}</p>
      </div>
    );
  }

  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <div className="space-y-6">
      <Link href="/dashboard/appointments" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <div className="flex items-center gap-4">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 font-bold text-xl">
            {user.firstName?.[0]}{user.lastName?.[0]}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {user.email}</span>
            {user.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {user.phone}</span>}
            {user.nin && <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> NIN: {user.nin}</span>}
          </div>
          {user.patientProfile?.bloodType && (
            <span className="inline-flex items-center gap-1 mt-1 text-xs text-gray-400">
              Blood Type: {user.patientProfile.bloodType}
              {user.patientProfile.allergies && ` · Allergies: ${user.patientProfile.allergies}`}
            </span>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Appointment History</CardTitle>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No appointments</p>
            ) : (
              <div className="space-y-2">
                {appointments.slice(0, 5).map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{apt.type || 'Appointment'}</p>
                      <p className="text-xs text-gray-500">{new Date(apt.date).toLocaleDateString()} · {new Date(apt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', apt.status === 'COMPLETED' ? 'bg-green-50 text-green-700' : apt.status === 'CANCELLED' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700')}>{apt.status}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="w-4 h-4" /> Recent Vitals</CardTitle>
          </CardHeader>
          <CardContent>
            {vitals.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No vitals recorded</p>
            ) : (
              <div className="space-y-2">
                {vitals.slice(0, 5).map((v: any) => (
                  <div key={v.id} className="p-3 rounded-lg border border-gray-100 text-sm">
                    <p className="text-xs text-gray-400 mb-1">{new Date(v.recordedAt).toLocaleDateString()}</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <span>BP: {v.bloodPressureSystolic}/{v.bloodPressureDiastolic}</span>
                      <span>HR: {v.heartRate}</span>
                      <span>Temp: {v.temperature}°F</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FlaskConical className="w-4 h-4" /> Lab Results</CardTitle>
          </CardHeader>
          <CardContent>
            {labResults.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No lab results</p>
            ) : (
              <div className="space-y-2">
                {labResults.slice(0, 5).map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{r.testName}</p>
                      <p className="text-xs text-gray-500">{r.result} {r.unit && `(${r.unit})`}</p>
                    </div>
                    <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', r.status === 'NORMAL' ? 'bg-green-50 text-green-700' : r.status === 'ABNORMAL' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700')}>{r.status}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {user.patientProfile?.medicalHistory && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="w-4 h-4" /> Medical History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{user.patientProfile.medicalHistory}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
