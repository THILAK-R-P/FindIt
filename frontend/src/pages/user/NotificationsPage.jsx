import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

const typeIcons = {
  report_created: CheckCircle2,
  status_updated: Info,
  potential_match: Sparkles,
  claim_submitted: AlertCircle,
  claim_approved: CheckCircle2,
  claim_rejected: AlertCircle,
  admin_message: ShieldAlert,
  info: Info,
};

const typeColors = {
  report_created: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40',
  status_updated: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40',
  potential_match: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40',
  claim_submitted: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40',
  claim_approved: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40',
  claim_rejected: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40',
  admin_message: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40',
  info: 'text-slate-500 bg-slate-50 dark:bg-slate-800',
};

const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationService.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      console.error('[Notifications Fetch Error]:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user?._id]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredNotifications =
    filter === 'unread'
      ? notifications.filter((n) => !n.read)
      : notifications;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <span>My Notifications</span>
            {unreadCount > 0 && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-500 text-white">
                {unreadCount} new
              </span>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Personal updates and match alerts for your account {user?.email ? `(${user.email})` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              icon={CheckCheck}
              onClick={handleMarkAllRead}
            >
              Mark All as Read
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            filter === 'all'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          All ({notifications.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            filter === 'unread'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <Loader message="Loading notifications..." />
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications to show"
          description={
            filter === 'unread'
              ? 'You have caught up with all your notifications!'
              : 'You will receive notifications when you report items or claim statuses update.'
          }
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredNotifications.map((notif) => {
            const Icon = typeIcons[notif.type] || Info;
            const colorClass =
              typeColors[notif.type] ||
              'text-slate-500 bg-slate-50 dark:bg-slate-800';

            return (
              <div
                key={notif._id}
                className={`p-5 flex items-start justify-between gap-4 transition-colors ${
                  !notif.read
                    ? 'bg-indigo-50/40 dark:bg-indigo-950/20'
                    : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-2.5 rounded-2xl ${colorClass} flex-shrink-0`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600" />
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                      <span>
                        {new Date(notif.createdAt).toLocaleDateString()}{' '}
                        {new Date(notif.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

                      {notif.link && (
                        <Link
                          to={notif.link}
                          className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <span>View Item</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {!notif.read && (
                  <button
                    type="button"
                    onClick={() => handleMarkAsRead(notif._id)}
                    className="text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300 p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                    title="Mark read"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
