'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Bed, Users, Activity, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { api, getErrorMessage } from '@/lib/api-client';

const bedStatusColors: Record<string, string> = {
  AVAILABLE: 'bg-green-100 border-green-300 text-green-700',
  OCCUPIED: 'bg-red-100 border-red-300 text-red-700',
  RESERVED: 'bg-amber-100 border-amber-300 text-amber-700',
  MAINTENANCE: 'bg-gray-100 border-gray-300 text-gray-500',
};

export default function WardsPage() {
  const [wardsData, setWardsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        setLoading(true);
        setError('');
        const [wardsRes, bedsRes] = await Promise.all([
          api.get<any>('/api/wards'),
          api.get<any>('/api/beds'),
        ]);
        if (cancelled) return;
        const wards = Array.isArray(wardsRes) ? wardsRes : wardsRes.wards ?? wardsRes.data ?? [];
        const beds = Array.isArray(bedsRes) ? bedsRes : bedsRes.beds ?? bedsRes.data ?? [];
        const mapped = wards.map((w: any) => {
          const wardBeds = beds.filter((b: any) => b.wardId === w.id || b.ward === w.name);
          return {
            name: w.name,
            type: w.type,
            total: w.totalBeds ?? w.total ?? 0,
            available: w.availableBeds ?? w.available ?? 0,
            occupied: w.occupiedBeds ?? w.occupied ?? 0,
            beds: wardBeds.map((b: any) => ({
              id: b.id ?? b.bedId,
              status: b.status,
              patient: b.patient
                ? typeof b.patient === 'string'
                  ? b.patient
                  : `${b.patient.firstName ?? ''} ${b.patient.lastName ?? ''}`.trim()
                : undefined,
            })),
          };
        });
        setWardsData(mapped);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        <span className="ml-3 text-gray-500">Loading bed & ward data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bed & Ward Management</h1>
            <p className="text-gray-500 mt-1">Live visual map of bed occupancy across all departments</p>
          </div>
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
        {wardsData.map((ward, wardIndex) => {
          const occupancyPercent = ward.total > 0 ? Math.round((ward.occupied / ward.total) * 100) : 0;
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
                    {ward.beds.map((bed: any) => (
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
