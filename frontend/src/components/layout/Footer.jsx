import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Heart, Shield, HelpCircle, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md">
                <Search className="w-4 h-4" />
              </div>
              <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                FindIt
              </span>
            </Link>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              "Lost Something on Campus? Find It Faster."
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Campus Lost & Found Platform built with modern web architecture.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Explore Portal
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <Link to="/items" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Browse All Items
                </Link>
              </li>
              <li>
                <Link to="/report-lost" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Report a Lost Item
                </Link>
              </li>
              <li>
                <Link to="/report-found" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Report a Found Item
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  User Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Campus Info */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Campus Desks
            </h4>
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <p className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                <span>Central Admin Block, Ground Floor</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                <span>lostandfound@campus.edu</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Operating Hours: 09:00 AM – 05:00 PM (Mon-Fri)
              </p>
            </div>
          </div>

          {/* Team Credits */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Project Development Team
            </h4>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-1">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Sukesh R
              </p>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Thilak R P
              </p>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                Campus Lost & Found Platform
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} FindIt Campus Platform. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>AI-Powered Campus Match Engine</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
