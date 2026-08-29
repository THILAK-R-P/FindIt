import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PackageSearch, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { itemService } from '../../services/itemService';
import ItemCard from '../../components/items/ItemCard';
import ItemFilter from '../../components/items/ItemFilter';
import AIPlaceholderBanner from '../../components/items/AIPlaceholderBanner';
import { CardSkeleton } from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';

const BrowseItemsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filter state
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    type: searchParams.get('type') || 'all',
    category: searchParams.get('category') || 'all',
    location: searchParams.get('location') || 'all',
    status: searchParams.get('status') || 'all',
    sortBy: searchParams.get('sortBy') || 'newest',
    page: parseInt(searchParams.get('page') || '1', 10),
  });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const queryParams = {
        page: filters.page,
        limit: 12,
        sortBy: filters.sortBy,
      };

      if (filters.search) queryParams.search = filters.search;
      if (filters.type !== 'all') queryParams.type = filters.type;
      if (filters.category !== 'all') queryParams.category = filters.category;
      if (filters.location !== 'all') queryParams.location = filters.location;
      if (filters.status !== 'all') queryParams.status = filters.status;

      const res = await itemService.getItems(queryParams);
      setItems(res.items || []);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.total || 0);
    } catch (err) {
      console.error('[BrowseItems Error]:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1, // reset page if filter criteria changes
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      type: 'all',
      category: 'all',
      location: 'all',
      status: 'all',
      sortBy: 'newest',
      page: 1,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Campus Lost & Found Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Search, filter, and inspect reported belongings across all campus blocks
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800">
            {totalCount} Active Reports Found
          </span>
        </div>
      </div>

      {/* Filter Component */}
      <ItemFilter
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Mini AI Banner */}
      <AIPlaceholderBanner compact />

      {/* Items Grid / Empty State / Loader */}
      {loading ? (
        <CardSkeleton count={8} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="No items found"
          description="Try modifying your search term or resetting active filters."
          actionText="Reset All Filters"
          onAction={handleResetFilters}
        />
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <ItemCard key={item._id} item={item} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-slate-200/80 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Showing page <span className="font-bold">{filters.page}</span> of{' '}
                <span className="font-bold">{totalPages}</span> ({totalCount} total items)
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page <= 1}
                  icon={ChevronLeft}
                  onClick={() => handleFilterChange('page', filters.page - 1)}
                >
                  Previous
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page >= totalPages}
                  onClick={() => handleFilterChange('page', filters.page + 1)}
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BrowseItemsPage;
