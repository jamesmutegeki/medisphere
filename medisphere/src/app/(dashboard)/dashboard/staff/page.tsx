'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, Calendar, Clock, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const departments = [
  {
    name: 'Emergency',
    staff: [
      { name: 'Dr. James Wilson', role: 'Doctor', shift: '7:00 AM - 3:00 PM', status: 'On Duty' },
      { name: 'Dr. Lisa Park', role: 'Doctor', shift: '3:00 PM - 11:00 PM', status: 'On Duty' },
      { name: 'Nurse Amy Chen', role: 'Nurse', shift: '7:00 AM - 3:00 PM', status: 'On Duty' },
      { name: 'Nurse Robert Taylor', role: 'Nurse', shift: '11:00 PM - 7:00 AM', status: 'Off Duty' },
    ],
  },
  {
    name: 'Cardiology',
    staff: [
      { name: 'Dr. Sarah Chen', role: 'Doctor', shift: '8:00 AM - 4:00 PM', status: 'On Duty' },
      { name: 'Dr. Michael Lee', role: 'Doctor', shift: '8:00 AM - 4:00 PM', status: 'On Duty' },
      { name: 'Nurse Emily Davis', role: 'Nurse', shift: '7:00 AM - 3:00 PM', status: 'On Duty' },
      { name: 'Nurse John Smith', role: 'Nurse', shift: '3:00 PM - 11:00 PM', status: 'On Duty' },
    ],
  },
  {
    name: 'Pediatrics',
    staff: [
      { name: 'Dr. Maria Garcia', role: 'Doctor', shift: '9:00 AM - 5:00 PM', status: 'On Duty' },
      { name: 'Dr. David Kim', role: 'Doctor', shift: '9:00 AM - 5:00 PM', status: 'On Leave' },
      { name: 'Nurse Sarah Johnson', role: 'Nurse', shift: '7:00 AM - 3:00 PM', status: 'On Duty' },
      { name: 'Nurse Lisa Brown', role: 'Nurse', shift: '3:00 PM - 11:00 PM', status: 'On Duty' },
    ],
  },
  {
    name: 'Surgery',
    staff: [
      { name: 'Dr. Robert Martinez', role: 'Doctor', shift: '6:00 AM - 2:00 PM', status: 'On Duty' },
      { name: 'Dr. Jennifer Wang', role: 'Doctor', shift: '6:00 AM - 2:00 PM', status: 'On Duty' },
      { name: 'Nurse Patricia Moore', role: 'Nurse', shift: '6:00 AM - 2:00 PM', status: 'On Duty' },
      { name: 'Nurse Christopher Lee', role: 'Nurse', shift: '2:00 PM - 10:00 PM', status: 'On Duty' },
    ],
  },
];

const statusColors: Record<string, string> = {
  'On Duty': 'bg-green-50 text-green-700',
  'Off Duty': 'bg-gray-50 text-gray-500',
  'On Leave': 'bg-amber-50 text-amber-700',
  'Sick': 'bg-red-50 text-red-700',
};

export default function StaffRotaPage() {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Rota Management</h1>
          <p className="text-gray-500 mt-1">Schedule and manage staff shifts across all departments</p>
        </div>
        <Button onClick={() => router.push('/dashboard/staff/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Shift
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {departments.map((dept, index) => (
          <motion.div
            key={dept.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-600" />
                  {dept.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dept.staff.map((member) => (
                    <div
                      key={member.name}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-primary-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 font-semibold text-sm">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.role}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-400">{member.shift}</span>
                          </div>
                        </div>
                      </div>
                      <span className={cn('px-2 py-1 text-xs font-medium rounded-full', statusColors[member.status])}>
                        {member.status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
