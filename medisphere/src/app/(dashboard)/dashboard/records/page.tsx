'use client';

import { motion } from 'framer-motion';
import { FileText, Search, Plus, Download, Eye } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const records = [
  { id: 'MR-001', patient: 'Emily Johnson', date: '2026-06-10', diagnosis: 'Hypertension', doctor: 'Dr. Sarah Chen', type: 'Consultation' },
  { id: 'MR-002', patient: 'Michael Brown', date: '2026-06-09', diagnosis: 'Annual Physical - Normal', doctor: 'Dr. Sarah Chen', type: 'Checkup' },
  { id: 'MR-003', patient: 'Sarah Wilson', date: '2026-06-08', diagnosis: 'Hyperlipidemia', doctor: 'Dr. Sarah Chen', type: 'Follow-up' },
  { id: 'MR-004', patient: 'James Davis', date: '2026-06-07', diagnosis: 'Type 2 Diabetes', doctor: 'Dr. Sarah Chen', type: 'Consultation' },
  { id: 'MR-005', patient: 'Maria Garcia', date: '2026-06-06', diagnosis: 'Pediatric Asthma', doctor: 'Dr. Sarah Chen', type: 'Emergency' },
  { id: 'MR-006', patient: 'Robert Kim', date: '2026-06-05', diagnosis: 'ACL Rehabilitation', doctor: 'Dr. Sarah Chen', type: 'Follow-up' },
];

const typeColors: Record<string, string> = {
  'Consultation': 'bg-blue-50 text-blue-700',
  'Checkup': 'bg-green-50 text-green-700',
  'Follow-up': 'bg-purple-50 text-purple-700',
  'Emergency': 'bg-red-50 text-red-700',
};

export default function RecordsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medical Records</h1>
          <p className="text-gray-500 mt-1">Access and manage patient electronic health records</p>
        </div>
        <Button>
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
                {records.map((record, index) => (
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
                        <button className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors">
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
