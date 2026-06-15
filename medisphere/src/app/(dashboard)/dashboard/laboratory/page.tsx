'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FlaskConical, Search, Activity, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api, getErrorMessage } from '@/lib/api-client';
import { getStoredUser } from '@/lib/auth-store';

const statusColors: Record<string, string> = {
  NORMAL: 'bg-green-50 text-green-700',
  ABNORMAL: 'bg-red-50 text-red-700',
  PENDING: 'bg-amber-50 text-amber-700',
};

export default function LaboratoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [labResults, setLabResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        setLoading(true);
        setError('');
        const data = await api.get<{ labResults: any[]; results?: any[] }>('/api/lab-results');
        if (cancelled) return;
        const items = data.labResults || data.results || [];
        setLabResults(items.map((r: any) => ({
          id: r.id,
          patient: r.patient ? `${r.patient.firstName} ${r.patient.lastName}` : 'Unknown',
          patientId: r.patient?.id || '',
          test: r.testName || r.test || '',
          category: r.category || '',
          result: r.result || '',
          range: r.normalRange || r.range || '',
          status: r.status || 'PENDING',
          date: r.date || '',
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

  const testCategories = (() => {
    const counts: Record<string, number> = {};
    const icons: Record<string, any> = { 'Blood Work': Activity, 'Urinalysis': FlaskConical, 'Microbiology': Activity, 'Chemistry': FlaskConical };
    const colors: Record<string, string> = { 'Blood Work': 'from-red-500 to-rose-500', 'Urinalysis': 'from-amber-500 to-yellow-500', 'Microbiology': 'from-emerald-500 to-teal-500', 'Chemistry': 'from-blue-500 to-cyan-500' };
    labResults.forEach(r => { counts[r.category] = (counts[r.category] || 0) + 1; });
    return Object.entries(counts).map(([name, count]) => ({
      name, count, icon: icons[name] || Activity, color: colors[name] || 'from-gray-500 to-slate-500',
    }));
  })();

  const filteredResults = labResults.filter((r) =>
    r.patient.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        <span className="ml-3 text-gray-500">Loading lab results...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lab Results</h1>
          <p className="text-gray-500 mt-1">View and manage patient laboratory tests</p>
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
        <h1 className="text-2xl font-bold text-gray-900">Lab Results</h1>
        <p className="text-gray-500 mt-1">View and manage patient laboratory tests</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {testCategories.map((cat, index) => {
          const Icon = cat.icon;
          return (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="text-center">
                <CardContent className="p-4">
                  <div className={cn('w-10 h-10 rounded-full bg-gradient-to-br mx-auto mb-2 flex items-center justify-center', cat.color)}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{cat.count}</p>
                  <p className="text-xs text-gray-500 mt-1">{cat.name}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Lab Results</CardTitle>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by patient name..."
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
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Patient</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Test Name</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Category</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Result</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Normal Range</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((result, index) => (
                  <motion.tr
                    key={result.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      {result.patientId ? (
                        <Link href={`/dashboard/patients/${result.patientId}`} className="font-medium text-gray-900 hover:text-primary-600 hover:underline">
                          {result.patient}
                        </Link>
                      ) : (
                        <span className="font-medium text-gray-900">{result.patient}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-700">{result.test}</td>
                    <td className="py-3 px-4 text-gray-500">{result.category}</td>
                    <td className="py-3 px-4 text-gray-700">{result.result}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{result.range}</td>
                    <td className="py-3 px-4">
                      <span className={cn('px-2 py-1 text-xs font-medium rounded-full', statusColors[result.status])}>
                        {result.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">{result.date}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredResults.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No lab results found for &quot;{searchQuery}&quot;</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
