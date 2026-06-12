'use client';

import { motion } from 'framer-motion';
import { Building2, Bed, Users, Activity, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const wards = [
  {
    name: 'Emergency Room',
    type: 'EMERGENCY',
    total: 20,
    available: 3,
    occupied: 17,
    beds: [
      { id: 'ER-01', status: 'OCCUPIED', patient: 'John D.' },
      { id: 'ER-02', status: 'OCCUPIED', patient: 'Lisa M.' },
      { id: 'ER-03', status: 'AVAILABLE' },
      { id: 'ER-04', status: 'OCCUPIED', patient: 'Tom R.' },
      { id: 'ER-05', status: 'OCCUPIED', patient: 'Anna K.' },
      { id: 'ER-06', status: 'AVAILABLE' },
      { id: 'ER-07', status: 'OCCUPIED', patient: 'Mike P.' },
      { id: 'ER-08', status: 'MAINTENANCE' },
    ],
  },
  {
    name: 'Intensive Care Unit',
    type: 'ICU',
    total: 15,
    available: 2,
    occupied: 13,
    beds: [
      { id: 'ICU-01', status: 'OCCUPIED', patient: 'Sarah W.' },
      { id: 'ICU-02', status: 'OCCUPIED', patient: 'David L.' },
      { id: 'ICU-03', status: 'OCCUPIED', patient: 'Mary J.' },
      { id: 'ICU-04', status: 'AVAILABLE' },
      { id: 'ICU-05', status: 'OCCUPIED', patient: 'Bob S.' },
      { id: 'ICU-06', status: 'RESERVED' },
    ],
  },
  {
    name: 'General Ward',
    type: 'GENERAL',
    total: 40,
    available: 12,
    occupied: 28,
    beds: [
      { id: 'GW-01', status: 'AVAILABLE' },
      { id: 'GW-02', status: 'OCCUPIED', patient: 'Emily J.' },
      { id: 'GW-03', status: 'OCCUPIED', patient: 'Michael B.' },
      { id: 'GW-04', status: 'AVAILABLE' },
      { id: 'GW-05', status: 'OCCUPIED', patient: 'James D.' },
      { id: 'GW-06', status: 'AVAILABLE' },
    ],
  },
  {
    name: 'Pediatrics',
    type: 'PEDIATRICS',
    total: 20,
    available: 8,
    occupied: 12,
    beds: [
      { id: 'PD-01', status: 'OCCUPIED', patient: 'Lily A.' },
      { id: 'PD-02', status: 'AVAILABLE' },
      { id: 'PD-03', status: 'OCCUPIED', patient: 'Noah C.' },
      { id: 'PD-04', status: 'AVAILABLE' },
      { id: 'PD-05', status: 'OCCUPIED', patient: 'Emma R.' },
    ],
  },
  {
    name: 'Maternity',
    type: 'MATERNITY',
    total: 15,
    available: 5,
    occupied: 10,
    beds: [
      { id: 'MT-01', status: 'OCCUPIED', patient: 'Rachel G.' },
      { id: 'MT-02', status: 'OCCUPIED', patient: 'Sophia T.' },
      { id: 'MT-03', status: 'AVAILABLE' },
      { id: 'MT-04', status: 'RESERVED' },
      { id: 'MT-05', status: 'OCCUPIED', patient: 'Jessica M.' },
    ],
  },
  {
    name: 'Surgery',
    type: 'SURGERY',
    total: 10,
    available: 3,
    occupied: 7,
    beds: [
      { id: 'SR-01', status: 'OCCUPIED', patient: 'Robert K.' },
      { id: 'SR-02', status: 'AVAILABLE' },
      { id: 'SR-03', status: 'OCCUPIED', patient: 'William H.' },
      { id: 'SR-04', status: 'OCCUPIED', patient: 'Linda F.' },
    ],
  },
];

const bedStatusColors: Record<string, string> = {
  AVAILABLE: 'bg-green-100 border-green-300 text-green-700',
  OCCUPIED: 'bg-red-100 border-red-300 text-red-700',
  RESERVED: 'bg-amber-100 border-amber-300 text-amber-700',
  MAINTENANCE: 'bg-gray-100 border-gray-300 text-gray-500',
};

export default function WardsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bed & Ward Management</h1>
          <p className="text-gray-500 mt-1">Live visual map of bed occupancy across all departments</p>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-400" /> Available</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-400" /> Occupied</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-400" /> Reserved</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-400" /> Maintenance</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {wards.map((ward, wardIndex) => {
          const occupancyPercent = Math.round((ward.occupied / ward.total) * 100);
          return (
            <motion.div
              key={ward.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: wardIndex * 0.1 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle>{ward.name}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {ward.available} available &middot; {ward.occupied} occupied &middot; {ward.total} total
                    </p>
                  </div>
                  <div className={cn(
                    'text-sm font-semibold px-3 py-1 rounded-full',
                    occupancyPercent > 85 ? 'bg-red-50 text-red-700' :
                    occupancyPercent > 60 ? 'bg-amber-50 text-amber-700' :
                    'bg-green-50 text-green-700'
                  )}>
                    {occupancyPercent}%
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Progress bar */}
                  <div className="w-full h-2 bg-gray-100 rounded-full mb-4 overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        occupancyPercent > 85 ? 'bg-red-500' :
                        occupancyPercent > 60 ? 'bg-amber-500' :
                        'bg-green-500'
                      )}
                      style={{ width: `${occupancyPercent}%` }}
                    />
                  </div>

                  {/* Bed grid */}
                  <div className="grid grid-cols-4 gap-2">
                    {ward.beds.map((bed) => (
                      <div
                        key={bed.id}
                        className={cn(
                          'aspect-square rounded-lg border-2 flex flex-col items-center justify-center text-xs font-medium transition-all',
                          bedStatusColors[bed.status]
                        )}
                        title={`${bed.id}${bed.patient ? ` - ${bed.patient}` : ''}`}
                      >
                        <Bed className="w-4 h-4 mb-0.5" />
                        <span className="truncate max-w-full px-1">
                          {bed.status === 'AVAILABLE' ? 'Open' :
                           bed.status === 'MAINTENANCE' ? 'Maint' :
                           bed.patient?.split(' ')[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
