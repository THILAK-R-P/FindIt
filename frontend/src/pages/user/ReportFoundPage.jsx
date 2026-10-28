import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Upload,
  Calendar,
  Clock,
  MapPin,
  Tag,
  AlertCircle,
  X,
} from 'lucide-react';
import { itemService } from '../../services/itemService';
import { compressImage } from '../../utils/imageCompressor';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';

const CATEGORIES = [
  'Electronics',
  'Documents',
  'Accessories',
  'Books',
  'Clothing',
  'Bags',
  'Keys',
  'ID Cards',
  'Other',
];

const LOCATIONS = [
  'Main Block',
  'Library',
  'Canteen',
  'Hostel',
  'Auditorium',
  'Computer Lab',
  'Parking Area',
  'Sports Ground',
  'Administrative Office',
  'Classroom Corridor',
  'Other Campus Location',
];

const ReportFoundPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    itemName: '',
    category: 'Electronics',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    location: 'Library',
    brand: '',
    color: '',
    distinctiveMarks: '',
    imageUrl: '',
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successData, setSuccessData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  // Handle client-side file upload and auto-compress to optimized JPEG
  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        image: 'Image size should be less than 25MB',
      }));
      e.target.value = '';
      return;
    }

    try {
      setErrors((prev) => ({ ...prev, image: '' }));
      const compressedDataUrl = await compressImage(file, 1200, 1200, 0.85);
      setImagePreview(compressedDataUrl);
      setFormData((prev) => ({ ...prev, imageUrl: compressedDataUrl }));
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        image: err.message || 'Failed to process image. Please try another image.',
      }));
    } finally {
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.itemName.trim()) errs.itemName = 'Item name is required';
    if (!formData.description.trim())
      errs.description = 'Please describe the found item';
    if (!formData.date) errs.date = 'Date found is required';
    if (!formData.location.trim()) errs.location = 'Location found is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validate()) return;

    setLoading(true);
    try {
      const res = await itemService.createFoundItem(formData);
      setSuccessData(res.item);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to submit report. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <div className="max-w-2xl mx-auto py-8 space-y-6 animate-in zoom-in-95 duration-200">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-200 dark:border-emerald-800/80 p-8 text-center shadow-soft space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Found Item Report Submitted!
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            Thank you for your honesty! The report for <span className="font-bold text-slate-900 dark:text-white">"{successData.itemName}"</span> is now published. If you deposited it at the central recovery desk, staff will cross-verify claims.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              to={`/items/${successData._id}`}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-all"
            >
              View Report Details
            </Link>
            <Link
              to="/items"
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all"
            >
              Browse All Items
            </Link>
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setSuccessData(null);
                setImagePreview(null);
                setFormData({
                  itemName: '',
                  category: 'Electronics',
                  description: '',
                  date: new Date().toISOString().split('T')[0],
                  time: '',
                  location: 'Library',
                  brand: '',
                  color: '',
                  distinctiveMarks: '',
                  imageUrl: '',
                });
              }}
            >
              Report Another Item
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-6 sm:p-8 text-white shadow-soft">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-white/10 backdrop-blur-sm rounded-xl">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Report a Found Item
            </h1>
            <p className="text-xs text-emerald-100">
              Help reunite lost property with its rightful student or staff owner on campus
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-soft">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              1. Found Item Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Item Name"
                id="itemName"
                placeholder="e.g. Casio Scientific Calculator"
                value={formData.itemName}
                error={errors.itemName}
                required
                onChange={(e) =>
                  setFormData({ ...formData, itemName: e.target.value })
                }
              />

              <Select
                label="Category"
                id="category"
                options={CATEGORIES}
                value={formData.category}
                required
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5"
              >
                Detailed Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="description"
                rows={3}
                placeholder="Describe condition, exact spot where you found it, custody status..."
                className={`w-full rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors ${
                  errors.description
                    ? 'border-rose-300 dark:border-rose-800'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
              {errors.description && (
                <p className="text-xs text-rose-500 mt-1">{errors.description}</p>
              )}
            </div>
          </div>

          {/* Location & Time */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              2. Where & When Found
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Campus Location Found"
                id="location"
                options={LOCATIONS}
                value={formData.location}
                required
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />

              <Input
                label="Date Found"
                id="date"
                type="date"
                value={formData.date}
                error={errors.date}
                required
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />

              <Input
                label="Approximate Time"
                id="time"
                placeholder="e.g. 11:15 AM"
                value={formData.time}
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
              />
            </div>
          </div>

          {/* Physical Attributes */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              3. Visual & Physical Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Brand / Logo"
                id="brand"
                placeholder="e.g. Casio, Fastrack, Wildcraft"
                value={formData.brand}
                onChange={(e) =>
                  setFormData({ ...formData, brand: e.target.value })
                }
              />

              <Input
                label="Color(s)"
                id="color"
                placeholder="e.g. Black & White, Silver"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
              />

              <Input
                label="Distinctive Marks / Stickers"
                id="distinctiveMarks"
                placeholder="e.g. Smiley sticker on back"
                value={formData.distinctiveMarks}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    distinctiveMarks: e.target.value,
                  })
                }
              />
            </div>
          </div>

          {/* Image Upload Preview */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              4. Photo of Found Item (Optional)
            </h3>

            {imagePreview ? (
              <div className="relative w-48 h-48 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 group shadow-sm">
                <img
                  src={imagePreview}
                  alt="Item Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1.5 rounded-xl bg-rose-600 text-white shadow-md hover:bg-rose-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <label
                  htmlFor="image-upload-found"
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="p-3 bg-emerald-50 dark:bg-slate-800 rounded-2xl text-emerald-600 dark:text-emerald-400 mb-2">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Click to select item photo
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    Supports PNG, JPG, JPEG up to 25MB (Auto-optimized for AI analysis)
                  </span>
                </label>
                <input
                  id="image-upload-found"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Link
              to="/dashboard"
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancel
            </Link>
            <Button
              type="submit"
              variant="success"
              size="lg"
              loading={loading}
              className="!bg-emerald-600 hover:!bg-emerald-700"
            >
              Report Found Item
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportFoundPage;
