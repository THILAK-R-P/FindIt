import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PackageSearch,
  Eye,
  Edit2,
  Trash2,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Calendar,
} from 'lucide-react';
import { itemService } from '../../services/itemService';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

const STATUS_OPTIONS = ['lost', 'found', 'matched', 'claimed', 'recovered'];

const AdminItemsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Status Change Modal State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = {
        limit: 100,
        search: searchQuery,
      };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.type = typeFilter;

      const res = await itemService.getItems(params);
      setItems(res.items || []);
    } catch (err) {
      console.error('[Admin Items Fetch Error]:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchItems();
  };

  const openStatusModal = (item) => {
    setActiveItem(item);
    setNewStatus(item.status);
    setStatusModalOpen(true);
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!activeItem) return;
    setUpdating(true);
    try {
      await itemService.updateItem(activeItem._id, { status: newStatus });
      setStatusModalOpen(false);
      fetchItems();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const openDeleteModal = (item) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await itemService.deleteItem(itemToDelete._id);
      setDeleteModalOpen(false);
      setItemToDelete(null);
      fetchItems();
    } catch (err) {
      alert(err.response?.data?.message || 'Deletion failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Item Management Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Audit, reclassify, and update all campus lost and found reports
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            {items.length} Reports Listed
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-soft flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <Input
            id="admin-search"
            placeholder="Search items, reporters, locations..."
            icon={Search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button type="submit" size="md">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-2">
          <Select
            id="type-filter"
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'lost', label: 'Lost' },
              { value: 'found', label: 'Found' },
            ]}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          />

          <Select
            id="status-filter"
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'lost', label: 'Lost' },
              { value: 'found', label: 'Found' },
              { value: 'matched', label: 'Matched' },
              { value: 'claimed', label: 'Claimed' },
              { value: 'recovered', label: 'Recovered' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Items Table */}
      {loading ? (
        <Loader message="Loading items database..." />
      ) : items.length === 0 ? (
        <EmptyState
          title="No items found"
          description="Try adjusting your filter options or search keyword."
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-4">Item</th>
                  <th className="py-3.5 px-4">Reporter</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100 max-w-[180px] truncate">
                      {item.itemName}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      <div>
                        <span className="font-semibold block">
                          {item.reportedBy?.name || 'Unknown'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {item.reportedBy?.studentId}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {item.category}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant={item.type} size="sm">
                        {item.type}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {item.location}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                      {new Date(item.date).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => openStatusModal(item)}
                        className="hover:opacity-80 transition-opacity"
                        title="Click to Change Status"
                      >
                        <Badge variant={item.status} size="sm">
                          {item.status}
                        </Badge>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/items/${item._id}`}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => openStatusModal(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Change Status"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openDeleteModal(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Delete Report"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Change Status Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Update Item Status"
        subtitle={`Modifying status for "${activeItem?.itemName}"`}
      >
        <form onSubmit={handleStatusUpdate} className="space-y-4">
          <Select
            label="Lifecycle Status"
            id="status-select"
            options={STATUS_OPTIONS}
            value={newStatus}
            required
            onChange={(e) => setNewStatus(e.target.value)}
          />

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Changing status will automatically trigger an alert notification to the original reporter.
          </p>

          <div className="pt-3 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={updating}
            >
              Update Status
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Item Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Admin Delete Confirmation"
        subtitle="Permanently remove item from database"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Are you sure you want to permanently delete the report for{' '}
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
              loading={deleting}
              onClick={handleDeleteConfirm}
            >
              Confirm Admin Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminItemsPage;
