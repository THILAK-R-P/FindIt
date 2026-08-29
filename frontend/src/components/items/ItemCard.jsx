import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Tag,
  ArrowRight,
  Laptop,
  FileText,
  Watch,
  Book,
  Shirt,
  Briefcase,
  Key,
  CreditCard,
  Package,
} from 'lucide-react';
import Badge from '../common/Badge';

const categoryIcons = {
  Electronics: Laptop,
  Documents: FileText,
  Accessories: Watch,
  Books: Book,
  Clothing: Shirt,
  Bags: Briefcase,
  Keys: Key,
  'ID Cards': CreditCard,
  Other: Package,
};

const ItemCard = ({ item }) => {
  const Icon = categoryIcons[item.category] || Package;

  // Format date
  const formattedDate = item.date
    ? new Date(item.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Unknown date';

  return (
    <div className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-soft hover:shadow-soft-lg hover:border-indigo-300 dark:hover:border-indigo-800 transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Card Header & Media */}
        <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-800/60 overflow-hidden flex items-center justify-center">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.itemName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-2">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
                <Icon className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
              </div>
              <span className="text-xs font-medium uppercase tracking-wider">
                {item.category}
              </span>
            </div>
          )}

          {/* Type Badge */}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge variant={item.type} dot>
              {item.type}
            </Badge>
          </div>

          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <Badge variant={item.status}>{item.status}</Badge>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-500" />
              {item.category}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {formattedDate}
            </span>
          </div>

          <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {item.itemName}
          </h4>

          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
            {item.description}
          </p>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5 truncate max-w-[65%]">
              <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
              <span className="truncate font-medium">{item.location}</span>
            </div>

            {item.brand && (
              <span className="text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-medium text-slate-600 dark:text-slate-300">
                {item.brand}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer Action */}
      <div className="px-5 pb-5 pt-1">
        <Link
          to={`/items/${item._id}`}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 dark:bg-slate-800/80 dark:hover:bg-indigo-950/40 dark:text-slate-300 dark:hover:text-indigo-400 transition-all border border-slate-200/80 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800"
        >
          <span>View Full Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default ItemCard;
