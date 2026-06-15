'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Bell, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';

interface Notification {
  id: string;
  title: string;
  description: string | null;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

export default function NotificationDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadNotification();
  }, [params.id]);

  const loadNotification = async () => {
    try {
      const data = await api.get<{ notification: Notification }>(`/notifications/${params.id}`);
      setNotification(data.notification);
    } catch {
      setError('Notification not found');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !notification) {
    return (
      <div className="text-center py-16">
        <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Notification not found</h3>
        <p className="text-sm text-gray-500 mt-1 mb-6">{error || 'This notification does not exist.'}</p>
        <Link href="/dashboard/notifications">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to notifications
          </Button>
        </Link>
      </div>
    );
  }

  const typeColors: Record<string, string> = {
    INFO: 'bg-blue-100 text-blue-700',
    WARNING: 'bg-amber-100 text-amber-700',
    ERROR: 'bg-red-100 text-red-700',
    SUCCESS: 'bg-green-100 text-green-700',
  };

  return (
    <div className="max-w-2xl">
      <Link
        href="/dashboard/notifications"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to notifications
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
            typeColors[notification.type] || 'bg-gray-100 text-gray-700'
          }`}>
            {notification.type}
          </div>
          {!notification.isRead && (
            <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5" />
          )}
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-2">{notification.title}</h1>

        <div className="flex items-center gap-4 text-xs text-gray-400 mb-6">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(notification.createdAt)}
          </span>
        </div>

        {notification.description && (
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
            {notification.description}
          </div>
        )}

        {notification.link && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <Link href={notification.link}>
              <Button variant="outline" size="sm">
                View related
              </Button>
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
