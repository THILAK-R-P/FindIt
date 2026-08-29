import React from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'Electronics', label: 'Electronics' },
  { value: 'Documents', label: 'Documents' },
  { value: 'Accessories', label: 'Accessories' },
  { value: 'Books', label: 'Books' },
  { value: 'Clothing', label: 'Clothing' },
  { value: 'Bags', label: 'Bags' },
  { value: 'Keys', label: 'Keys' },
  { value: 'ID Cards', label: 'ID Cards' },
  { value: 'Other', label: 'Other' },
];

const LOCATIONS = [
  { value: 'all', label: 'All Campus Locations' },
  { value: 'Main Block', label: 'Main Block' },
  { value: 'Library', label: 'Library' },
  { value: 'Canteen', label: 'Canteen' },
  { value: 'Hostel', label: 'Hostel' },
  { value: 'Auditorium', label: 'Auditorium' },
  { value: 'Computer Lab', label: 'Computer Lab' },
  { value: 'Parking Area', label: 'Parking Area' },
  { value: 'Sports Ground', label: 'Sports Ground' },
];

const STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'lost', label: 'Lost' },
  { value: 'found', label: 'Found' },
  { value: 'matched', label: 'Matched' },
  { value: 'claimed', label: 'Claimed' },
  { value: 'recovered', label: 'Recovered' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'date_desc', label: 'Incident Date (Recent)' },
  { value: 'name_asc', label: 'Name (A to Z)' },
  { value: 'name_desc', label: 'Name (Z to A)' },
];

const ItemFilter = ({
  filters,
  onChange,
  onReset,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-soft space-y-4">
      {/* Top row: Search Bar & Type Tabs */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex-1">
          <Input
            id="search"
            placeholder="Search by keyword, item name, brand, or color..."
            icon={Search}
            value={filters.search}
            onChange={(e) => onChange('search', e.target.value)}
          />
        </div>

        {/* Type Filter Buttons */}
        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 self-start md:self-auto">
          {['all', 'lost', 'found'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onChange('type', type)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg capitalize transition-all ${
                filters.type === type
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {type === 'all' ? 'All Items' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Filter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 items-center">
        <Select
          id="category"
          options={CATEGORIES}
          value={filters.category}
          onChange={(e) => onChange('category', e.target.value)}
        />

        <Select
          id="location"
          options={LOCATIONS}
          value={filters.location}
          onChange={(e) => onChange('location', e.target.value)}
        />

        <Select
          id="status"
          options={STATUSES}
          value={filters.status}
          onChange={(e) => onChange('status', e.target.value)}
        />

        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Select
              id="sortBy"
              options={SORT_OPTIONS}
              value={filters.sortBy}
              onChange={(e) => onChange('sortBy', e.target.value)}
            />
          </div>

          <Button
            variant="secondary"
            size="md"
            icon={RotateCcw}
            onClick={onReset}
            title="Reset Filters"
            className="!px-3"
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ItemFilter;
