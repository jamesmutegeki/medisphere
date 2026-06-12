'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, FileText, Calendar, User, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn, formatDate } from '@/lib/utils';

interface RecordDetail {
  id: string;
  patient: string;
  doctor: string;
  date: string;
  diagnosis: string;
  symptoms: string;
  treatment: string;
  notes: string;
}

const mockRecords: Record<string, RecordDetail> = {
  'MR-001': {
    id: 'MR-001',
    patient: 'Emily Johnson',
    doctor: 'Dr. Sarah Chen',
    date: '2026-06-10',
    diagnosis: 'Hypertension',
    symptoms: 'Frequent headaches, blurred vision, occasional shortness of breath',
    treatment: 'Prescribed Lisinopril 10mg daily. Recommended low-sodium diet and regular exercise.',
    notes: 'Patient has family history of hypertension. Follow up in 2 weeks to monitor BP.',
  },
  'MR-002': {
    id: 'MR-002',
    patient: 'Emily Johnson',
    doctor: 'Dr. Sarah Chen',
    date: '2026-06-03',
    diagnosis: 'Blood Pressure Follow-up',
    symptoms: 'Mild headache, no other significant symptoms',
    treatment: 'Continue current medication. Increased monitoring to twice daily.',
    notes: 'BP reading: 135/85. Improved from last visit.',
  },
  'MR-003': {
    id: 'MR-003',
    patient: 'Michael Brown',
    doctor: 'Dr. Sarah Chen',
    date: '2026-06-09',
    diagnosis: 'Annual Physical - Normal',
    symptoms: 'No specific complaints. Routine checkup.',
    treatment: 'All vitals within normal range. No medication changes needed.',
    notes: 'BMI: 24.5. Recommended maintaining current diet and exercise regimen.',
  },
  'MR-004': {
    id: 'MR-004',
    patient: 'Sarah Wilson',
    doctor: 'Dr. Sarah Chen',
    date: '2026-06-08',
    diagnosis: 'Hyperlipidemia',
    symptoms: 'Fatigue, occasional chest discomfort after meals',
    treatment: 'Prescribed Atorvastatin 20mg. Dietary consultation scheduled.',
    notes: 'Total cholesterol: 245. LDL: 160. Follow up in 3 months for lipid panel.',
  },
  'MR-005': {
    id: 'MR-005',
    patient: 'James Davis',
    doctor: 'Dr. Sarah Chen',
    date: '2026-06-07',
    diagnosis: 'Type 2 Diabetes',
    symptoms: 'Increased thirst, frequent urination, unexplained weight loss',
    treatment: 'Started Metformin 500mg twice daily. Diabetes education provided.',
    notes: 'HbA1c: 8.2%. Referred to endocrinologist for further evaluation.',
  },
  'MR-006': {
    id: 'MR-006',
    patient: 'Maria Garcia',
    doctor: 'Dr. Sarah Chen',
    date: '2026-06-06',
    diagnosis: 'Pediatric Asthma',
    symptoms: 'Wheezing, cough at night, difficulty breathing during play',
    treatment: 'Prescribed Albuterol inhaler as needed. Fluticasone maintenance dose daily.',
    notes: 'Peak flow: 75% of personal best. Parent education on trigger avoidance completed.',
  },
  'MR-007': {
    id: 'MR-007',
    patient: 'Robert Kim',
    doctor: 'Dr. Sarah Chen',
    date: '2026-06-05',
    diagnosis: 'ACL Rehabilitation',
    symptoms: 'Knee swelling, limited range of motion, mild pain during movement',
    treatment: 'Continued physical therapy. Prescribed anti-inflammatory medication.',
    notes: 'Range of motion improved to 110 degrees. Progressing well with rehab protocol.',
  },
};

export default function RecordDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const record = mockRecords[id];

  if (!record) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/records"
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Record Not Found</h1>
            <p className="text-gray-500 mt-1">The requested medical record could not be located</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg">
                No record found with ID <span className="font-mono font-medium text-gray-700">{id}</span>
              </p>
              <Link href="/dashboard/records">
                <Button className="mt-6" variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Records
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const infoRows = [
    { label: 'Record ID', value: record.id, icon: FileText },
    { label: 'Patient Name', value: record.patient, icon: User },
    { label: 'Doctor', value: record.doctor, icon: Stethoscope },
    { label: 'Date', value: formatDate(record.date), icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/records"
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{record.patient}</h1>
            <p className="text-gray-500 mt-1">{record.diagnosis} &middot; {record.id}</p>
          </div>
        </div>
        <Button onClick={() => alert('Downloading record...')} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Diagnosis & Treatment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Diagnosis</h4>
                <p className="text-gray-900">{record.diagnosis}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Symptoms</h4>
                <p className="text-gray-900">{record.symptoms}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Treatment</h4>
                <p className="text-gray-900">{record.treatment}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Notes</h4>
                <p className="text-gray-900">{record.notes}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Record Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {infoRows.map((row) => {
                const Icon = row.icon;
                return (
                  <div key={row.label} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">{row.label}</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{row.value}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
