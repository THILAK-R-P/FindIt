import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Search,
  Sparkles,
  Package,
  Bell,
  ArrowRight,
  PlusCircle,
  Clock,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { itemService } from '../../services/itemService';
import { notificationService } from '../../services/notificationService';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import AIPlaceholderBanner from '../../components/items/AIPlaceholderBanner';

const UserDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myItems, setMyItems] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [stats, setStats] = useState({
    lostCount: 0,
    foundCount: 0,
    matchedCount: 0,
    recoveredCount: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch user's reports
        const itemsRes = await itemService.getMyReports();
        const items = itemsRes.items || [];
        setMyItems(items);

        // Compute user-specific stats
        const lost = items.filter((i) => i.type === 'lost').length;
        const found = items.filter((i) => i.type === 'found').length;
        const matched = items.filter((i) => i.status === 'matched').length;
        const recovered = items.filter((i) =>
          ['recovered', 'claimed'].includes(i.status)
        ).length;

        setStats({
          lostCount: lost,
          foundCount: found,
          matchedCount: matched,
          recoveredCount: recovered,
        });

        // Fetch notifications
        const notifRes = await notificationService.getNotifications();
        setRecentNotifications((notifRes.notifications || []).slice(0, 4));
      } catch (err) {
        console.error('[Dashboard Data Error]:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <Loader message="Loading your dashboard metrics..." fullPage />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Welcome & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-soft-lg">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-semibold text-indigo-100 mb-1">
            <span>Role: {user?.role?.toUpperCase()}</span>
            <span>•</span>
            <span>ID: {user?.studentId}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100 max-w-xl">
            Track your submitted campus items, monitor claim statuses, and explore recent lost & found activity.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/report-lost"
            className="px-4 py-2.5 rounded-xl bg-white text-rose-600 hover:bg-rose-50 font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
          >
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>+ Report Lost</span>
          </Link>
          <Link
            to="/report-found"
            className="px-4 py-2.5 rounded-xl bg-white text-emerald-600 hover:bg-emerald-50 font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>+ Report Found</span>
          </Link>
          <Link
            to="/items"
            className="px-4 py-2.5 rounded-xl bg-indigo-500/40 hover:bg-indigo-500/60 border border-white/20 text-white font-bold text-xs transition-all flex items-center gap-1.5"
          >
            <Search className="w-4 h-4" />
            <span>Browse Items</span>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="My Lost Reports"
          value={stats.lostCount}
          subtitle="Items you reported lost"
          icon={AlertCircle}
          color="rose"
        />

        <StatCard
          title="My Found Reports"
          value={stats.foundCount}
          subtitle="Items you found & reported"
          icon={CheckCircle2}
          color="emerald"
        />

        <StatCard
          title="Potential Matches"
          value={stats.matchedCount}
          subtitle="AI pipeline queue (Phase 2)"
          icon={Sparkles}
          color="indigo"
        />

        <StatCard
          title="Recovered Items"
          value={stats.recoveredCount}
          subtitle="Successfully handed over"
          icon={Package}
          color="blue"
        />
      </div>

      {/* AI Smart Matching Placeholder Banner */}
      <AIPlaceholderBanner />

      {/* Split Section: Recent Reports & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: My Recent Reports */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                My Recent Reports
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Recent lost & found items reported from your account
              </p>
            </div>
            <Link
              to="/my-reports"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {myItems.length === 0 ? (
            <EmptyState
              title="No reports submitted yet"
              description="You have not reported any lost or found items on campus so far."
              actionText="Report an Item"
              onAction={() => (window.location.href = '/report-lost')}
            />
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-soft overflow-hidden">
              {myItems.slice(0, 5).map((item) => (
                <div
                  key={item._id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-500 font-bold">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.itemName}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-indigo-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link
                        to={`/items/${item._id}`}
                        className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 truncate block"
                      >
                        {item.itemName}
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-500" />
                          {item.location}
                        </span>
                        <span>•</span>
                        <span>{item.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge variant={item.type} size="sm">
                      {item.type}
                    </Badge>
                    <Badge variant={item.status} size="sm">
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Recent Notifications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Recent Alerts
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Latest updates on your reports
              </p>
            </div>
            <Link
              to="/notifications"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentNotifications.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 text-center shadow-soft">
              <Bell className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No notifications right now.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-soft overflow-hidden">
              {recentNotifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`p-4 space-y-1 transition-colors ${
                    !notif.read
                      ? 'bg-indigo-50/40 dark:bg-indigo-950/20'
                      : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {notif.title}
                    </h5>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {notif.message}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 pt-1">
                    {new Date(notif.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
