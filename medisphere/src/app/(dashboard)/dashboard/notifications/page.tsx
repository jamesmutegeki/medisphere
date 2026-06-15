'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, ChevronRight } from 'lucide-react';
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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await api.get<{ notifications: Notification[] }>('/notifications');
      setNotifications(data.notifications);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications', { markAll: true });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // handled
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllAsRead}>
            <CheckCheck className="w-4 h-4 mr-1.5" />
            Mark all as read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No notifications</h3>
          <p className="text-sm text-gray-500 mt-1">You&apos;re all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Link
                href={`/dashboard/notifications/${notification.id}`}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 hover:shadow-sm ${
                  notification.isRead
                    ? 'bg-white border-gray-100'
                    : 'bg-primary-50/30 border-primary-100'
                }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0 ${
                  notification.isRead ? 'bg-gray-300' : 'bg-primary-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${notification.isRead ? 'text-gray-900' : 'text-gray-900 font-semibold'}`}>
                    {notification.title}
                  </p>
                  {notification.description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1.5">{formatDate(notification.createdAt)}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 mt-2 flex-shrink-0" />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
