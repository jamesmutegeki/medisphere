'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Pill, AlertTriangle, Package, Clock, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api, getErrorMessage } from '@/lib/api-client';
import { getStoredUser } from '@/lib/auth-store';

export default function PharmacyPage() {
  const [pharmacyItems, setPharmacyItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        setLoading(true);
        setError('');
        const data = await api.get<{ medications: any[]; pharmacy?: any[] }>('/api/pharmacy');
        if (cancelled) return;
        const items = data.medications || data.pharmacy || [];
        setPharmacyItems(items.map((m: any) => ({
          id: m.id,
          medication: m.medicationName || m.name || '',
          category: m.category || '',
          stock: m.stockQuantity ?? m.stock ?? 0,
          unit: m.unit || 'units',
          reorder: m.reorderLevel ?? m.reorder ?? 0,
          expiry: m.expiryDate || m.expiry || '',
          lowStock: (m.stockQuantity ?? m.stock ?? 0) <= (m.reorderLevel ?? m.reorder ?? 0),
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

  const totalMeds = pharmacyItems.length;
  const lowStockCount = pharmacyItems.filter(i => i.lowStock).length;
  const dispensedToday = '--';
  const expiringSoon = pharmacyItems.filter(i => i.expiry).length;

  const summaryCards = [
    { label: 'Total Medications', value: totalMeds.toLocaleString(), icon: Pill, color: 'from-blue-500 to-cyan-500' },
    { label: 'Low Stock Items', value: String(lowStockCount), icon: AlertTriangle, color: 'from-amber-500 to-orange-500' },
    { label: 'Dispensed Today', value: dispensedToday, icon: Package, color: 'from-emerald-500 to-teal-500' },
    { label: 'Expiring Soon', value: String(expiringSoon), icon: Clock, color: 'from-red-500 to-rose-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        <span className="ml-3 text-gray-500">Loading pharmacy data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pharmacy & Dispensing</h1>
          <p className="text-gray-500 mt-1">Medication inventory and dispensing management</p>
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
        <h1 className="text-2xl font-bold text-gray-900">Pharmacy & Dispensing</h1>
        <p className="text-gray-500 mt-1">Medication inventory and dispensing management</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0', card.color)}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                    <p className="text-xs text-gray-500">{card.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Medication Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Medication</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Category</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Stock</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Unit</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Reorder Level</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Expiry</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pharmacyItems.map((item, index) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className={cn(
                      'border-b border-gray-50 transition-colors',
                      item.lowStock && 'bg-amber-50/50'
                    )}
                  >
                    <td className="py-3 px-4 font-medium text-gray-900">{item.medication}</td>
                    <td className="py-3 px-4 text-gray-500">{item.category}</td>
                    <td className={cn('py-3 px-4', item.lowStock ? 'text-amber-700 font-semibold' : 'text-gray-700')}>
                      {item.stock}
                    </td>
                    <td className="py-3 px-4 text-gray-500">{item.unit}</td>
                    <td className="py-3 px-4 text-gray-500">{item.reorder}</td>
                    <td className="py-3 px-4 text-gray-500">{item.expiry}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">Restock</Button>
                        <Button variant="ghost" size="sm">Edit</Button>
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
