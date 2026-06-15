'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { UserCircle, Upload, Stethoscope, Save } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const initialDoctors = [
  { id: 1, firstName: 'Sarah', lastName: 'Chen', nin: 'NIN-123456', email: 'sarah.chen@medisphere.com', phone: '(555) 123-4567', specialization: 'Cardiology', department: 'Cardiology', licenseNumber: 'MED-CA-12345', consultationFee: 250, bio: 'Board-certified cardiologist with 15 years of experience.', status: 'Available', avatarUrl: '' },
  { id: 2, firstName: 'James', lastName: 'Wilson', nin: 'NIN-234567', email: 'james.wilson@medisphere.com', phone: '(555) 234-5678', specialization: 'Emergency Medicine', department: 'Emergency', licenseNumber: 'MED-CA-23456', consultationFee: 200, bio: 'Emergency physician specializing in trauma care.', status: 'Available', avatarUrl: '' },
  { id: 3, firstName: 'Lisa', lastName: 'Park', nin: 'NIN-345678', email: 'lisa.park@medisphere.com', phone: '(555) 345-6789', specialization: 'Neurology', department: 'Neurology', licenseNumber: 'MED-CA-34567', consultationFee: 300, bio: 'Neurologist focusing on stroke and neurodegenerative disorders.', status: 'Unavailable', avatarUrl: '' },
  { id: 4, firstName: 'Robert', lastName: 'Martinez', nin: 'NIN-456789', email: 'robert.martinez@medisphere.com', phone: '(555) 456-7890', specialization: 'Dermatology', department: 'Dermatology', licenseNumber: 'MED-CA-45678', consultationFee: 220, bio: 'Dermatologist with expertise in skin cancer screenings.', status: 'Available', avatarUrl: '' },
  { id: 5, firstName: 'Maria', lastName: 'Garcia', nin: 'NIN-567890', email: 'maria.garcia@medisphere.com', phone: '(555) 567-8901', specialization: 'Pediatrics', department: 'Pediatrics', licenseNumber: 'MED-CA-56789', consultationFee: 180, bio: 'Pediatrician dedicated to child and adolescent health.', status: 'Available', avatarUrl: '' },
  { id: 6, firstName: 'David', lastName: 'Kim', nin: 'NIN-678901', email: 'david.kim@medisphere.com', phone: '(555) 678-9012', specialization: 'Ophthalmology', department: 'Ophthalmology', licenseNumber: 'MED-CA-67890', consultationFee: 260, bio: 'Ophthalmologist specializing in cataract and refractive surgery.', status: 'Unavailable', avatarUrl: '' },
];

export default function DoctorProfilesPage() {
  const [doctors, setDoctors] = useState(initialDoctors);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>(null);

  const selected = doctors.find(d => d.id === selectedId);

  const handleSelect = (id: number) => {
    const doctor = doctors.find(d => d.id === id)!;
    setSelectedId(id);
    setEditForm({ ...doctor });
  };

  const handleChange = (field: string, value: string | number) => {
    setEditForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (id: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setDoctors(prev => prev.map(d => d.id === id ? { ...d, avatarUrl: dataUrl } : d));
        if (editForm?.id === id) setEditForm((prev: any) => ({ ...prev, avatarUrl: dataUrl }));
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleSave = () => {
    setDoctors(prev => prev.map(d => d.id === editForm.id ? editForm : d));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Doctor Profiles</h1>
        <p className="text-gray-500 mt-1">Manage physician profiles, credentials, and photos</p>
      </div>

      {/* Doctor Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {doctors.map((doctor, index) => (
          <motion.div
            key={doctor.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              className={cn(
                'cursor-pointer transition-all hover:border-primary-200',
                selectedId === doctor.id && 'ring-2 ring-primary-500 border-primary-500'
              )}
              onClick={() => handleSelect(doctor.id)}
            >
              <CardContent className="p-5">
                <div className="flex flex-col items-center text-center">
                  <div className="relative w-20 h-20 rounded-full mb-3">
                    {doctor.avatarUrl ? (
                      <img src={doctor.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 font-bold text-2xl">
                        {doctor.firstName[0]}{doctor.lastName[0]}
                      </div>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePhotoUpload(doctor.id); }}
                      className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-400 hover:text-primary-600 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">Dr. {doctor.firstName} {doctor.lastName}</p>
                  <p className="text-xs text-gray-500">{doctor.specialization}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                    <Stethoscope className="w-3 h-3" />
                    <span>Lic. {doctor.licenseNumber}</span>
                  </div>
                  {doctor.nin && <p className="text-xs text-gray-400 mt-0.5">NIN: {doctor.nin}</p>}
                  <span className={cn(
                    'mt-3 px-2 py-1 text-xs font-medium rounded-full',
                    doctor.status === 'Available' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  )}>
                    {doctor.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Detail/Edit Section */}
      {selected && editForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="w-5 h-5 text-primary-600" />
                Edit Profile - Dr. {selected.firstName} {selected.lastName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={e => handleChange('firstName', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={e => handleChange('lastName', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={e => handleChange('email', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={e => handleChange('phone', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                  <input
                    type="text"
                    value={editForm.specialization}
                    onChange={e => handleChange('specialization', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={e => handleChange('department', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NIN Number</label>
                  <input
                    type="text"
                    value={editForm.nin || ''}
                    onChange={e => handleChange('nin', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                  <input
                    type="text"
                    value={editForm.licenseNumber}
                    onChange={e => handleChange('licenseNumber', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee ($)</label>
                  <input
                    type="number"
                    value={editForm.consultationFee}
                    onChange={e => handleChange('consultationFee', Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    rows={3}
                    value={editForm.bio}
                    onChange={e => handleChange('bio', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
