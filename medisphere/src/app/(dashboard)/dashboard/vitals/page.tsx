'use client';

import { motion } from 'framer-motion';
import { Activity, Heart, Thermometer, Wind, Droplets, Weight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const vitalsData = [
  { label: 'Blood Pressure', value: '120/80', unit: 'mmHg', icon: Activity, color: 'from-blue-500 to-cyan-500', status: 'Normal' },
  { label: 'Heart Rate', value: '72', unit: 'bpm', icon: Heart, color: 'from-red-500 to-rose-500', status: 'Normal' },
  { label: 'Temperature', value: '98.6', unit: '°F', icon: Thermometer, color: 'from-orange-500 to-amber-500', status: 'Normal' },
  { label: 'Respiratory Rate', value: '16', unit: 'breaths/min', icon: Wind, color: 'from-emerald-500 to-teal-500', status: 'Normal' },
  { label: 'O2 Saturation', value: '98', unit: '%', icon: Droplets, color: 'from-violet-500 to-purple-500', status: 'Normal' },
  { label: 'Weight', value: '154', unit: 'lbs', icon: Weight, color: 'from-gray-500 to-slate-500', status: '--' },
];

const vitalsHistory = [
  { date: 'Jun 10', bp: '118/78', hr: '70', temp: '98.4', rr: '16', spo2: '99' },
  { date: 'Jun 09', bp: '122/80', hr: '74', temp: '98.6', rr: '18', spo2: '98' },
  { date: 'Jun 08', bp: '120/82', hr: '72', temp: '98.6', rr: '16', spo2: '98' },
  { date: 'Jun 07', bp: '116/76', hr: '68', temp: '98.2', rr: '15', spo2: '99' },
  { date: 'Jun 06', bp: '124/84', hr: '76', temp: '98.8', rr: '18', spo2: '97' },
];

export default function VitalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vitals Tracking</h1>
        <p className="text-gray-500 mt-1">Monitor and record patient vital signs</p>
      </div>

      {/* Current Vitals */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {vitalsData.map((vital, index) => {
          const Icon = vital.icon;
          return (
            <motion.div
              key={vital.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="text-center">
                <CardContent className="p-4">
                  <div className={cn('w-10 h-10 rounded-full bg-gradient-to-br mx-auto mb-2 flex items-center justify-center', vital.color)}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{vital.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{vital.unit}</p>
                  <p className="text-xs text-gray-400 mt-1">{vital.label}</p>
                  {vital.status !== '--' && (
                    <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded-full bg-green-50 text-green-700">
                      {vital.status}
                    </span>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Vitals History */}
      <Card>
        <CardHeader>
          <CardTitle>Vitals History (Last 5 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">BP</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">HR</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Temp</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">RR</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">SpO2</th>
                </tr>
              </thead>
              <tbody>
                {vitalsHistory.map((v, index) => (
                  <motion.tr
                    key={v.date}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-gray-900">{v.date}</td>
                    <td className="py-3 px-4 text-gray-700">{v.bp}</td>
                    <td className="py-3 px-4 text-gray-700">{v.hr}</td>
                    <td className="py-3 px-4 text-gray-700">{v.temp}</td>
                    <td className="py-3 px-4 text-gray-700">{v.rr}</td>
                    <td className="py-3 px-4 text-gray-700">{v.spo2}%</td>
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
