import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  PlusCircle,
  Eye,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Calendar,
  Tag,
} from 'lucide-react';
import { itemService } from '../../services/itemService';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

const TABS = ['all', 'lost', 'found', 'matched', 'recovered'];

const MyReportsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editForm, setEditForm] = useState({
    itemName: '',
    category: '',
    location: '',
    description: '',
    status: '',
  });
  const [editLoading, setEditLoading] = useState(false);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const queryParams = {};
      if (activeTab === 'lost' || activeTab === 'found') {
        queryParams.type = activeTab;
      } else if (activeTab === 'matched' || activeTab === 'recovered') {
        queryParams.status = activeTab;
      }
      const res = await itemService.getMyReports(queryParams);
      setReports(res.items || []);
    } catch (err) {
      console.error('[Fetch My Reports Error]:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeTab, user?._id]);

  const openEditModal = (item) => {
    setSelectedItem(item);
    setEditForm({
      itemName: item.itemName,
      category: item.category,
      location: item.location,
      description: item.description,
      status: item.status,
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    setEditLoading(true);
    try {
      await itemService.updateItem(selectedItem._id, editForm);
      setEditModalOpen(false);
      fetchReports();
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    } finally {
      setEditLoading(false);
    }
  };

  const openDeleteModal = (item) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setDeleteLoading(true);
    try {
      await itemService.deleteItem(itemToDelete._id);
      setDeleteModalOpen(false);
      setItemToDelete(null);
      fetchReports();
    } catch (err) {
      alert(err.response?.data?.message || 'Deletion failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            My Campus Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Viewing reports submitted exclusively by your account {user?.email ? `(${user.email})` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/report-lost"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all"
          >
            + Report Lost
          </Link>
          <Link
            to="/report-found"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
          >
            + Report Found
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-semibold rounded-xl capitalize transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab === 'all' ? 'All Reports' : tab}
          </button>
        ))}
      </div>

      {/* Reports List */}
      {loading ? (
        <Loader message="Loading your reports..." />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No reports in this tab"
          description="You don't have any items registered under the selected status."
          actionText="Create New Report"
          onAction={() => (window.location.href = '/report-lost')}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {reports.map((item) => (
            <div
              key={item._id}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 overflow-hidden text-slate-400">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.itemName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-6 h-6 text-indigo-500" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {item.itemName}
                    </h3>
                    <Badge variant={item.type} size="sm">
                      {item.type}
                    </Badge>
                    <Badge variant={item.status} size="sm">
                      {item.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                    {item.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      {item.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      {new Date(item.date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      {item.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <Link
                  to={`/items/${item._id}`}
                  className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-slate-800 transition-colors"
                  title="View Item"
                >
                  <Eye className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={() => openEditModal(item)}
                  className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-slate-800 transition-colors"
                  title="Edit Report"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => openDeleteModal(item)}
                  className="p-2 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-slate-800 transition-colors"
                  title="Delete Report"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Report Details"
        subtitle={`Updating "${selectedItem?.itemName}"`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Item Name"
            id="edit-name"
            value={editForm.itemName}
            required
            onChange={(e) =>
              setEditForm({ ...editForm, itemName: e.target.value })
            }
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Campus Location"
              id="edit-location"
              options={[
                'Main Block',
                'Library',
                'Canteen',
                'Hostel',
                'Auditorium',
                'Computer Lab',
                'Parking Area',
                'Sports Ground',
              ]}
              value={editForm.location}
              onChange={(e) =>
                setEditForm({ ...editForm, location: e.target.value })
              }
            />

            <Select
              label="Status"
              id="edit-status"
              options={['lost', 'found', 'matched', 'claimed', 'recovered']}
              value={editForm.status}
              onChange={(e) =>
                setEditForm({ ...editForm, status: e.target.value })
              }
            />
          </div>

          <div>
            <label
              htmlFor="edit-desc"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1"
            >
              Description
            </label>
            <textarea
              id="edit-desc"
              rows={3}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={editForm.description}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={editLoading}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Deletion"
        subtitle="This action cannot be undone"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Are you sure you want to remove the report for{' '}
            <span className="font-bold text-slate-900 dark:text-white">
              "{itemToDelete?.itemName}"
            </span>
            ?
          </p>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={deleteLoading}
              onClick={handleDeleteConfirm}
            >
              Yes, Delete Report
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MyReportsPage;
