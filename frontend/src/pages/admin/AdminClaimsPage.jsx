import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Phone,
  Mail,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { claimService } from '../../services/claimService';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

const AdminClaimsPage = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Decision Modal State
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [decisionType, setDecisionType] = useState('approved');
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await claimService.getClaims(params);
      setClaims(res.claims || []);
    } catch (err) {
      console.error('[Admin Claims Fetch Error]:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [statusFilter]);

  const openDecisionModal = (claim, type) => {
    setSelectedClaim(claim);
    setDecisionType(type);
    setAdminNotes(type === 'approved' ? 'Verified campus ID and proof matches item description.' : '');
    setDecisionModalOpen(true);
  };

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClaim) return;
    setSubmitting(true);
    try {
      await claimService.updateClaimStatus(selectedClaim._id, {
        status: decisionType,
        adminNotes,
      });
      setDecisionModalOpen(false);
      fetchClaims();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update claim decision');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <span>Ownership Claims Review</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review ownership claims submitted by students and staff before item collection
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['all', 'pending', 'approved', 'rejected'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                statusFilter === st
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Claims List */}
      {loading ? (
        <Loader message="Loading claims..." />
      ) : claims.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No claims matching filter"
          description="There are currently no ownership claims in this view."
        />
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <div
              key={claim._id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-soft space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Claim for:{' '}
                      <Link
                        to={`/items/${claim.item?._id}`}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        {claim.item?.itemName || 'Item details'}
                      </Link>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Location: {claim.item?.location} • Category: {claim.item?.category}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Badge variant={claim.status} size="md">
                    {claim.status}
                  </Badge>
                </div>
              </div>

              {/* Claimant & Proof Info */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
                {/* Claimant Details */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block">
                    Claimant Profile
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {claim.claimant?.name}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    ID: {claim.claimant?.studentId} • Role: {claim.claimant?.role}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{claim.claimant?.email}</span>
                  </p>
                  {claim.contactPhone && (
                    <p className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{claim.contactPhone}</span>
                    </p>
                  )}
                </div>

                {/* Reason & Proof */}
                <div className="lg:col-span-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block">
                    Submitted Proof / Reason
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                    "{claim.reason}"
                  </p>

                  {claim.proofDetails && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
                      <span className="font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                        Secret Marks / Serial info:
                      </span>
                      <p className="text-slate-600 dark:text-slate-300">
                        {claim.proofDetails}
                      </p>
                    </div>
                  )}

                  {claim.adminNotes && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 text-purple-700 dark:text-purple-300">
                      <span className="font-bold block mb-0.5">Admin Note:</span>
                      <p>{claim.adminNotes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Controls for Pending Claims */}
              {claim.status === 'pending' && (
                <div className="pt-2 flex items-center justify-end gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    icon={XCircle}
                    onClick={() => openDecisionModal(claim, 'rejected')}
                  >
                    Reject Claim
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    icon={CheckCircle2}
                    onClick={() => openDecisionModal(claim, 'approved')}
                  >
                    Approve & Authorize Handover
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Decision Modal */}
      <Modal
        isOpen={decisionModalOpen}
        onClose={() => setDecisionModalOpen(false)}
        title={decisionType === 'approved' ? 'Approve Ownership Claim' : 'Reject Ownership Claim'}
        subtitle={`Claim verification for ${selectedClaim?.item?.itemName}`}
      >
        <form onSubmit={handleDecisionSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-notes"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1"
            >
              Administrative Verification Notes
            </label>
            <textarea
              id="admin-notes"
              rows={3}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              placeholder="Provide context for approval or reason for rejection..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDecisionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={decisionType === 'approved' ? 'success' : 'danger'}
              size="sm"
              loading={submitting}
            >
              Confirm {decisionType === 'approved' ? 'Approval' : 'Rejection'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminClaimsPage;
