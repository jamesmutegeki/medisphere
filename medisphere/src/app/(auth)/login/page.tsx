'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { storeUser } from '@/lib/auth-store';
import { loginSchema } from '@/lib/validations';
import { api, getErrorMessage } from '@/lib/api-client';
import MedisphereLogo from '@/components/medisphere-logo';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        errors[err.path[0] as string] = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      const data = await api.post<{ user: { id: string; email: string; firstName: string; lastName: string; role: string } }>('/auth/login', formData);
      storeUser({
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        role: data.user.role as any,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.firstName}${data.user.lastName}`,
      });
      const redirect = searchParams.get('redirect') || '/dashboard';
      router.push(redirect);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <MedisphereLogo size={40} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
        <p className="text-gray-500 mt-1">Sign in to your MediSphere account</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <Input
              label="Email"
              type="email"
              placeholder="Enter your email"
              icon={<Mail className="w-4 h-4" />}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
          </div>

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              icon={<Lock className="w-4 h-4" />}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              <span className="text-gray-600">Remember me</span>
            </label>
            <span className="text-gray-400 cursor-default text-sm">
              Forgot password?
            </span>
          </div>

          <Button type="submit" isLoading={isLoading} className="w-full">
            Sign In
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500 text-center">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              Create one
            </Link>
          </p>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
            <p className="font-medium text-gray-700 mb-2">Demo Accounts (password123):</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              <p><span className="text-blue-600 font-medium">Admin</span> — admin@medisphere.com</p>
              <p><span className="text-emerald-600 font-medium">Doctor</span> — sarah.chen@medisphere.com</p>
              <p><span className="text-purple-600 font-medium">Nurse</span> — amy.chen@medisphere.com</p>
              <p><span className="text-amber-600 font-medium">Billing</span> — billing@medisphere.com</p>
              <p><span className="text-gray-600 font-medium">Patient</span> — john.smith@email.com</p>
              <p><span className="text-gray-600 font-medium">Patient</span> — emily.j@email.com</p>
              <p><span className="text-gray-600 font-medium">Patient</span> — michael.b@email.com</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
