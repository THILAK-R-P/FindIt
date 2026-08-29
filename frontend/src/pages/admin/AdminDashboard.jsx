import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  MapPin,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';

const AdminDashboard = () => {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      setLoading(true);
      try {
        const res = await adminService.getStats();
        setStatsData(res.stats);
      } catch (err) {
        console.error('[Admin Stats Error]:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  if (loading) {
    return <Loader message="Loading administrative metrics..." fullPage />;
  }

  const { users, items, claims, categoryStats, recentItems, recentClaims } =
    statsData || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Executive Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-soft-lg border border-purple-800/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Campus Central Administration Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Administrative Control Center
            </h1>
            <p className="text-xs sm:text-sm text-purple-200 max-w-xl">
              Monitor campus lost item traffic, audit ownership claims, and oversee student/staff reports.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/items"
              className="px-4 py-2.5 rounded-xl bg-white text-purple-900 hover:bg-purple-50 font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
            >
              <Package className="w-4 h-4 text-purple-700" />
              <span>Manage All Items</span>
            </Link>
            <Link
              to="/admin/claims"
              className="px-4 py-2.5 rounded-xl bg-purple-600/60 hover:bg-purple-600 border border-purple-400/40 text-white font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Review Claims ({claims?.pending || 0})</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Users"
          value={users?.total || 0}
          subtitle={`${users?.students || 0} Students • ${users?.staff || 0} Staff`}
          icon={Users}
          color="purple"
        />

        <StatCard
          title="Lost Reports"
          value={items?.lost || 0}
          subtitle={`${items?.lostPending || 0} active missing`}
          icon={AlertCircle}
          color="rose"
        />

        <StatCard
          title="Found Reports"
          value={items?.found || 0}
          subtitle={`${items?.foundPending || 0} awaiting owner`}
          icon={CheckCircle2}
          color="emerald"
        />

        <StatCard
          title="Pending Claims"
          value={claims?.pending || 0}
          subtitle={`${claims?.approved || 0} verified`}
          icon={ShieldCheck}
          color="amber"
        />

        <StatCard
          title="Recovered Items"
          value={(items?.recovered || 0) + (items?.claimed || 0)}
          subtitle="Successful campus returns"
          icon={Package}
          color="blue"
        />
      </div>

      {/* Split Section: Recent Items & Recent Claims */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Recent Campus Reports */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Latest Reported Items
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Most recent campus submissions
              </p>
            </div>
            <Link
              to="/admin/items"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>View All Items</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {(recentItems || []).map((item) => (
              <div
                key={item._id}
                className="py-3.5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {item.itemName}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {item.location} • By {item.reportedBy?.name || 'User'} ({item.reportedBy?.studentId})
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
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
        </div>

        {/* Right: Recent Claims Awaiting Verification */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Recent Ownership Claims
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Awaiting administrative sign-off
              </p>
            </div>
            <Link
              to="/admin/claims"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Review Claims</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {(recentClaims || []).length === 0 ? (
              <p className="py-6 text-xs text-center text-slate-500">
                No claims submitted yet.
              </p>
            ) : (
              (recentClaims || []).map((claim) => (
                <div
                  key={claim._id}
                  className="py-3.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {claim.item?.itemName || 'Unknown Item'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      Claimant: {claim.claimant?.name} ({claim.claimant?.studentId})
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={claim.status} size="sm">
                      {claim.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
