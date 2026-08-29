import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Clock,
  Tag,
  Sparkles,
  ShieldCheck,
  User,
  Phone,
  Mail,
  ArrowLeft,
  Share2,
  CheckCircle2,
  AlertCircle,
  Package,
  FileCheck,
} from 'lucide-react';
import { itemService } from '../../services/itemService';
import { claimService } from '../../services/claimService';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Loader from '../../components/common/Loader';
import AIPlaceholderBanner from '../../components/items/AIPlaceholderBanner';

const ItemDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Claim Modal State
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimForm, setClaimForm] = useState({
    reason: '',
    proofDetails: '',
    contactPhone: user?.phone || '',
  });
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState('');
  const [claimError, setClaimError] = useState('');

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      try {
        const res = await itemService.getItemById(id);
        setItem(res.item);
      } catch (err) {
        setError(err.response?.data?.message || 'Item not found');
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    setClaimError('');
    setClaimSuccess('');

    if (!claimForm.reason.trim()) {
      setClaimError('Please provide a reason or proof of ownership');
      return;
    }

    setClaimLoading(true);
    try {
      await claimService.createClaim({
        itemId: item._id,
        reason: claimForm.reason,
        proofDetails: claimForm.proofDetails,
        contactPhone: claimForm.contactPhone,
      });

      setClaimSuccess(
        'Your claim has been submitted to campus administrators for verification.'
      );
      setTimeout(() => {
        setClaimModalOpen(false);
      }, 2000);
    } catch (err) {
      setClaimError(
        err.response?.data?.message || 'Failed to submit claim. Please try again.'
      );
    } finally {
      setClaimLoading(false);
    }
  };

  if (loading) {
    return <Loader message="Loading item details..." fullPage />;
  }

  if (error || !item) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-3xl w-fit mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Item Not Found
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {error || 'This report may have been deleted or does not exist.'}
        </p>
        <Link
          to="/items"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Browse Items</span>
        </Link>
      </div>
    );
  }

  const isOwner = user && item.reportedBy?._id === user._id;
  const formattedDate = item.date
    ? new Date(item.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown Date';

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/items"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Directory</span>
        </Link>

        <div className="flex items-center gap-2">
          <Badge variant={item.type} size="lg" dot>
            {item.type}
          </Badge>
          <Badge variant={item.status} size="lg">
            {item.status}
          </Badge>
        </div>
      </div>

      {/* Main Grid: Media Left / Details Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col: Media & Quick Actions (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-soft overflow-hidden">
            <div className="relative h-80 sm:h-96 w-full rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center overflow-hidden">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.itemName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-6 text-slate-400 dark:text-slate-500 space-y-2">
                  <Package className="w-16 h-16 mx-auto text-indigo-400" />
                  <p className="text-xs font-semibold uppercase tracking-wider">
                    No Photo Attached
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Category: {item.category}
                  </p>
                </div>
              )}
            </div>

            {/* Action Bar Below Media */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
              {!isOwner && isAuthenticated && (
                <Button
                  variant="primary"
                  size="lg"
                  icon={ShieldCheck}
                  onClick={() => setClaimModalOpen(true)}
                  className="w-full"
                >
                  {item.type === 'found' ? 'Claim This Item' : 'I Found This Item'}
                </Button>
              )}

              {!isAuthenticated && (
                <Link
                  to="/login"
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-center bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
                >
                  Log In to Claim or Contact
                </Link>
              )}

              {isAdmin && (
                <Link
                  to="/admin/items"
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-center bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 hover:bg-purple-100 transition-colors border border-purple-200 dark:border-purple-800"
                >
                  Manage in Admin Console
                </Link>
              )}
            </div>
          </div>

          {/* Reporter Contact Info Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-soft space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Reported By</span>
            </h4>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm uppercase flex-shrink-0">
                {item.reportedBy?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {item.reportedBy?.name || 'Anonymous User'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                  {item.reportedBy?.role} • {item.reportedBy?.studentId}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{item.reportedBy?.email || 'N/A'}</span>
              </p>
              {item.reportedBy?.phone && (
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{item.reportedBy?.phone}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Full Item Attributes (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Header Title & Category */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-soft space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <Tag className="w-4 h-4" />
                <span>{item.category}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                {item.itemName}
              </h1>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Item Description
              </h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                {item.description}
              </p>
            </div>

            {/* Key-Value Attributes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  Campus Location
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {item.location}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  Incident Date
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {formattedDate}
                </p>
              </div>

              {item.time && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    Approximate Time
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {item.time}
                  </p>
                </div>
              )}

              {item.brand && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Brand / Manufacturer
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {item.brand}
                  </p>
                </div>
              )}

              {item.color && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Color
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {item.color}
                  </p>
                </div>
              )}

              {item.distinctiveMarks && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Distinctive Marks
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {item.distinctiveMarks}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* AI Matching Architecture Banner */}
          <AIPlaceholderBanner />
        </div>
      </div>

      {/* Claim Submission Modal */}
      <Modal
        isOpen={claimModalOpen}
        onClose={() => setClaimModalOpen(false)}
        title="Submit Ownership Claim"
        subtitle={`Claim verification for "${item.itemName}"`}
      >
        {claimSuccess ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {claimSuccess}
            </p>
          </div>
        ) : (
          <form onSubmit={handleClaimSubmit} className="space-y-4">
            {claimError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{claimError}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="claim-reason"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1"
              >
                Proof of Ownership / Explanation <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="claim-reason"
                rows={3}
                required
                placeholder="Explain why this item belongs to you, where you lost it, contents inside..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-3 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={claimForm.reason}
                onChange={(e) =>
                  setClaimForm({ ...claimForm, reason: e.target.value })
                }
              />
            </div>

            <Input
              label="Distinctive Marks or Serial/Secret Details"
              id="proofDetails"
              placeholder="e.g. Stickers, engravings, internal files, wallpaper"
              value={claimForm.proofDetails}
              onChange={(e) =>
                setClaimForm({ ...claimForm, proofDetails: e.target.value })
              }
            />

            <Input
              label="Contact Phone Number"
              id="contactPhone"
              placeholder="Your contact number for pickup"
              value={claimForm.contactPhone}
              onChange={(e) =>
                setClaimForm({ ...claimForm, contactPhone: e.target.value })
              }
            />

            <div className="pt-3 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setClaimModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={claimLoading}
              >
                Submit Claim Request
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default ItemDetailsPage;
