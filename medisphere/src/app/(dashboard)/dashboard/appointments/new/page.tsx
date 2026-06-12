'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const patients = [
  'Emily Johnson',
  'Michael Brown',
  'Sarah Wilson',
  'James Davis',
  'Maria Garcia',
  'Robert Kim',
];

const doctors = [
  { name: 'Dr. Sarah Chen', specialty: 'Cardiology' },
  { name: 'Dr. Michael Lee', specialty: 'Cardiology' },
  { name: 'Dr. Emily Davis', specialty: 'Pediatrics' },
  { name: 'Dr. James Wilson', specialty: 'Emergency' },
];

const appointmentTypes = [
  'Checkup',
  'Follow-up',
  'Consultation',
  'Lab Results',
  'Emergency',
  'Surgery Prep',
];

export default function NewAppointmentPage() {
  const router = useRouter();
  const [patient, setPatient] = useState('');
  const [doctor, setDoctor] = useState('');
  const [type, setType] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/appointments');
      }, 1500);
    }, 1500);
  };

  const inputStyles =
    'block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50';

  const labelStyles = 'block text-sm font-medium text-gray-700';

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-4"
      >
        <Link
          href="/dashboard/appointments"
          className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Appointment</h1>
          <p className="text-gray-500 mt-1">Schedule a new patient appointment</p>
        </div>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>Appointment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700 font-medium"
              >
                Appointment created successfully!
              </motion.div>
            )}

            <div className="space-y-1.5">
              <label className={labelStyles}>Patient Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <select
                  value={patient}
                  onChange={(e) => setPatient(e.target.value)}
                  required
                  className={cn(inputStyles, 'pl-10 appearance-none')}
                >
                  <option value="" disabled>
                    Select a patient...
                  </option>
                  {patients.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelStyles}>Doctor</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <select
                  value={doctor}
                  onChange={(e) => setDoctor(e.target.value)}
                  required
                  className={cn(inputStyles, 'pl-10 appearance-none')}
                >
                  <option value="" disabled>
                    Select a doctor...
                  </option>
                  {doctors.map((d) => (
                    <option key={d.name} value={`${d.name} - ${d.specialty}`}>
                      {d.name} — {d.specialty}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelStyles}>Appointment Type</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  required
                  className={cn(inputStyles, 'pl-10 appearance-none')}
                >
                  <option value="" disabled>
                    Select type...
                  </option>
                  {appointmentTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                icon={<Calendar className="w-4 h-4" />}
              />
              <Input
                label="Time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                icon={<Clock className="w-4 h-4" />}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="notes" className={labelStyles}>
                Notes
              </label>
              <div className="relative">
                <div className="absolute top-3 left-0 flex items-start pl-3 pointer-events-none text-gray-400">
                  <FileText className="w-4 h-4" />
                </div>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Any additional notes or instructions..."
                  className={cn(inputStyles, 'pl-10 resize-none')}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Appointment'}
              </Button>
              <Link href="/dashboard/appointments">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
