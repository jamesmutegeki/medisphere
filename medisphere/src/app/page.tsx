'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Stethoscope,
  Calendar,
  Shield,
  Activity,
  Building2,
  Users,
  ArrowRight,
  CheckCircle2,
  Menu,
  X,
  Hospital,
  Ambulance,
  Award,
  HeartPulse,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import MedisphereLogo from '@/components/medisphere-logo';

const features = [
  {
    icon: Stethoscope,
    title: 'Clinical Dashboard',
    description: 'Comprehensive EHR access with timeline views, vitals tracking, and e-prescribing for healthcare professionals.',
  },
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description: 'Real-time appointment booking with automated reminders via SMS and email.',
  },
  {
    icon: Shield,
    title: 'Security First',
    description: 'End-to-end encryption, RBAC, and immutable audit logs for full compliance.',
  },
  {
    icon: Activity,
    title: 'Vitals Tracking',
    description: 'Flowsheets for nurses with visual trend graphs and real-time monitoring.',
  },
  {
    icon: Building2,
    title: 'Ward Management',
    description: 'Live visual map of bed occupancy across all departments and units.',
  },
  {
    icon: Users,
    title: 'Staff Management',
    description: 'Comprehensive rota scheduling and resource allocation tools.',
  },
];

const stats = [
  { value: '10K+', label: 'Patients Served', icon: Hospital, color: 'from-blue-500 to-cyan-500' },
  { value: '500+', label: 'Healthcare Staff', icon: Users, color: 'from-emerald-500 to-teal-500' },
  { value: '50K+', label: 'Appointments', icon: Calendar, color: 'from-violet-500 to-purple-500' },
  { value: '99.9%', label: 'Uptime SLA', icon: Award, color: 'from-amber-500 to-orange-500' },
];

const roles = [
  {
    title: 'Patients',
    description: 'Book appointments, view history, pay bills',
    color: 'from-blue-500 to-cyan-500',
    features: ['Self-registration', 'Online booking', 'Medical history', 'Secure payments'],
  },
  {
    title: 'Doctors & Nurses',
    description: 'Access charts, log notes, write prescriptions',
    color: 'from-emerald-500 to-teal-500',
    features: ['Clinical dashboards', 'EHR timeline view', 'Digital prescriptions', 'Vitals flowsheets'],
  },
  {
    title: 'Administrators',
    description: 'Manage schedules, assign resources',
    color: 'from-violet-500 to-purple-500',
    features: ['Bed/ward management', 'Staff rota', 'Real-time analytics', 'Resource allocation'],
  },
  {
    title: 'Billing Officers',
    description: 'Process claims, generate invoices',
    color: 'from-amber-500 to-orange-500',
    features: ['Auto-invoicing', 'Insurance processing', 'Claim tracking', 'Payment reconciliation'],
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <MedisphereLogo size={28} />
            <span className="font-bold text-xl text-gray-900">MediSphere</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Features</Link>
            <Link href="#roles" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">For Teams</Link>
            <Link href="#security" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Security</Link>
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3"
          >
            <Link href="#features" className="block text-sm text-gray-600 py-2">Features</Link>
            <Link href="#roles" className="block text-sm text-gray-600 py-2">For Teams</Link>
            <Link href="#security" className="block text-sm text-gray-600 py-2">Security</Link>
            <div className="flex gap-3 pt-2">
              <Link href="/login" className="flex-1"><Button variant="outline" size="sm" className="w-full">Sign In</Button></Link>
              <Link href="/register" className="flex-1"><Button size="sm" className="w-full">Get Started</Button></Link>
            </div>
          </motion.div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-medical-50" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-medical-200/30 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-sm font-medium mb-6">
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                HIPAA Compliant &bull; HL7/FHIR Ready
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight text-balance leading-tight">
                Connected Healthcare
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-medical-500">
                  Ecosystem
                </span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto text-balance">
                A secure, cloud-based Hospital Management System that streamlines clinical operations,
                improves administrative efficiency, and enhances the patient experience.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto text-base px-8">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-8">
                    Explore Features
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto"
          >
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="relative group p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300"
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-300 -z-10" />
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 shadow-sm`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{stat.label}</div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Everything you need in one platform
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              From patient registration to billing, MediSphere connects every aspect of hospital operations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group p-6 rounded-xl border border-gray-100 bg-white hover:shadow-lg hover:border-primary-100 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Role-Based Modules */}
      <section id="roles" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Designed for every role
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              The system morphs based on who logs in. Each role gets a tailored experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {roles.map((role, index) => {
              const GradientIcon = () => (
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center text-white font-bold text-lg`}>
                  {role.title.charAt(0)}
                </div>
              );

              return (
                <motion.div
                  key={role.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="p-6 rounded-xl bg-white border border-gray-100 hover:shadow-lg transition-all duration-300"
                >
                  <GradientIcon />
                  <h3 className="text-lg font-semibold text-gray-900 mt-4">{role.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                  <ul className="mt-4 space-y-2">
                    {role.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="w-4 h-4 text-medical-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emergency/10 border border-emergency/20 text-emergency text-sm font-medium mb-4">
                <Shield className="w-4 h-4" />
                Security by Design
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Enterprise-grade security for sensitive medical data
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                End-to-end encryption, strict RBAC, and comprehensive audit logs are non-negotiable foundations built into every layer.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  { title: 'AES-256 Encryption', desc: 'All data encrypted at rest and in transit with TLS 1.3' },
                  { title: 'Role-Based Access Control', desc: 'Granular permissions preventing unauthorized access to sensitive files' },
                  { title: 'Immutable Audit Trails', desc: 'Every read, write, and delete action is logged for compliance' },
                  { title: 'HL7/FHIR Ready', desc: 'Standards-compliant APIs for seamless interoperability' },
                ].map((item) => (
                  <li key={item.title} className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-medical-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">{item.title}</div>
                      <div className="text-sm text-gray-500">{item.desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary-50 to-medical-50 border border-primary-100 p-8 flex items-center justify-center">
                <Shield className="w-32 h-32 text-primary-600/40" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-600 to-primary-800">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Ready to transform your healthcare operations?
            </h2>
            <p className="mt-4 text-lg text-primary-100">
              Join leading healthcare institutions already using MediSphere.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto bg-white text-primary-700 hover:bg-primary-50 text-base px-8">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 text-base px-8">
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MedisphereLogo size={28} />
                <span className="font-bold text-xl text-white">MediSphere</span>
              </div>
              <p className="text-sm">Connected Healthcare Ecosystem</p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-3">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#security" className="hover:text-white transition-colors">Security</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Terms</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Compliance</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-sm text-center">
            &copy; {new Date().getFullYear()} MediSphere. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
