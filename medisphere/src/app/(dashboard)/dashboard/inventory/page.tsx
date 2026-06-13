'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Package, AlertTriangle, Warehouse, Tags, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { api, getErrorMessage } from '@/lib/api-client';
import { getStoredUser } from '@/lib/auth-store';

const categories = ['All', 'Consumables', 'Instruments', 'Medications', 'PPE'];

const statusColors: Record<string, string> = {
  'In Stock': 'bg-green-50 text-green-700',
  'Low Stock': 'bg-red-50 text-red-700',
  'Out of Stock': 'bg-gray-50 text-gray-600',
};

export default function InventoryPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        setLoading(true);
        setError('');
        const data = await api.get<{ inventory: any[] }>('/api/inventory');
        if (cancelled) return;
        setInventoryItems((data.inventory || []).map((item: any, idx: number) => ({
          id: item.id ?? idx,
          name: item.name || item.itemName || '',
          category: item.category || 'Consumables',
          quantity: item.quantity ?? 0,
          unit: item.unit || 'Units',
          reorderLevel: item.reorderLevel ?? 0,
          supplier: item.supplier || '',
          status: (item.quantity ?? 0) <= 0 ? 'Out of Stock' : (item.quantity ?? 0) <= (item.reorderLevel ?? 0) ? 'Low Stock' : 'In Stock',
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

  const filtered = activeCategory === 'All'
    ? inventoryItems
    : inventoryItems.filter(i => i.category === activeCategory);

  const totalItems = inventoryItems.length;
  const lowStock = inventoryItems.filter(i => i.status === 'Low Stock').length;
  const categoryCount = new Set(inventoryItems.map(i => i.category)).size;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        <span className="ml-3 text-gray-500">Loading inventory...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory & Supplies</h1>
          <p className="text-gray-500 mt-1">Track medical supplies and consumables</p>
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
        <h1 className="text-2xl font-bold text-gray-900">Inventory & Supplies</h1>
        <p className="text-gray-500 mt-1">Track medical supplies and consumables</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Total Items</p>
              <Package className="w-5 h-5 text-primary-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalItems}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Low Stock Items</p>
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-600 mt-1">{lowStock}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Categories</p>
              <Tags className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">{categoryCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              activeCategory === cat
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-primary-600" />
            Inventory Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Item Name</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Category</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">Quantity</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Unit</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">Reorder Level</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Supplier</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, index) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className={cn(
                      'border-b border-gray-50 transition-colors',
                      item.status === 'Low Stock' ? 'bg-red-50/30' : 'hover:bg-gray-50'
                    )}
                  >
                    <td className="py-3 px-4 font-medium text-gray-900">{item.name}</td>
                    <td className="py-3 px-4 text-gray-700">{item.category}</td>
                    <td className={cn(
                      'py-3 px-4 text-right font-medium',
                      item.status === 'Low Stock' ? 'text-red-600' : 'text-gray-700'
                    )}>
                      {item.quantity}
                    </td>
                    <td className="py-3 px-4 text-gray-500">{item.unit}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{item.reorderLevel}</td>
                    <td className="py-3 px-4 text-gray-600">{item.supplier}</td>
                    <td className="py-3 px-4">
                      <span className={cn('px-2 py-1 text-xs font-medium rounded-full', statusColors[item.status])}>
                        {item.status}
                      </span>
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
