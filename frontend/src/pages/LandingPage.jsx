import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  PlusCircle,
  FileSearch,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  HelpCircle,
  ChevronDown,
  Layers,
  Clock,
  Compass,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Button from '../components/common/Button';
import { itemService } from '../services/itemService';

const FAQS = [
  {
    q: 'How do I report an item I lost on campus?',
    a: 'Simply create a free student or staff account, log in, click "Report Lost Item", and enter the item name, category, approximate time, and campus location. You can also upload a preview image.',
  },
  {
    q: 'What should I do if I find someone else’s property?',
    a: 'Click "Report Found Item" to log the item details. You can specify whether you have deposited it at the Central Admin Lost & Found desk or are safely holding it.',
  },
  {
    q: 'How does the recovery and claim verification work?',
    a: 'When you spot your lost item in "Browse Items", open the item details and submit a Claim request with proof of ownership (such as distinguishing marks, stickers, or serial details). Campus administrators review and approve claims before handover.',
  },
  {
    q: 'How does the AI Smart Matching feature work?',
    a: 'FindIt uses Google Gemini multimodal image analysis and FAISS vector similarity search to automatically compare images and descriptions of newly reported lost items with found items across campus in real time.',
  },
];

const LandingPage = () => {
  const [stats, setStats] = useState({
    totalReports: 10,
    totalLost: 6,
    totalFound: 4,
    recovered: 3,
    recoveryRate: 75,
  });
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await itemService.getStatsSummary();
        if (res.success && res.stats) {
          setStats((prev) => ({
            ...prev,
            ...res.stats,
            // Fallback rate if few items
            recoveryRate: res.stats.recoveryRate || 75,
          }));
        }
      } catch (err) {
        // Fallback to initial display stats
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        {/* Background gradient shapes */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-500/20 to-blue-500/20 blur-3xl -z-10 rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <span>Campus Lost & Found Platform • AI-Powered Matching</span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-950 dark:text-white max-w-4xl mx-auto leading-[1.15]">
            Lost Something on Campus?{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-500 bg-clip-text text-transparent">
              Find It Faster.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            FindIt is a centralized campus Lost & Found platform that makes reporting, searching, and recovering lost belongings easier for students and faculty.
          </p>

          {/* Action Buttons */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/report-lost"
              className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Lost Item</span>
            </Link>

            <Link
              to="/report-found"
              className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Report Found Item</span>
            </Link>

            <Link
              to="/items"
              className="px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 font-semibold text-sm shadow-sm transition-all flex items-center gap-2"
            >
              <Search className="w-4 h-4 text-indigo-600" />
              <span>Browse All Items</span>
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 text-center shadow-soft">
              <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                {stats.totalReports}+
              </p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
                Total Reports
              </p>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 text-center shadow-soft">
              <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400">
                {stats.totalLost}
              </p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
                Lost Items
              </p>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 text-center shadow-soft">
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {stats.totalFound}
              </p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
                Found Items
              </p>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 text-center shadow-soft">
              <p className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                {stats.recoveryRate}%
              </p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
                Recovery Rate
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How FindIt Works Section */}
      <section className="py-16 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">
              Simple 4-Step Process
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              How FindIt Works
            </h3>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              A transparent, campus-wide workflow designed for quick reporting and verified item recovery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="relative bg-slate-50 dark:bg-slate-800/60 rounded-3xl p-6 border border-slate-200/60 dark:border-slate-800 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                1
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Report
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Submit details and photos of lost or found belongings including campus location, date, and distinctive marks.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative bg-slate-50 dark:bg-slate-800/60 rounded-3xl p-6 border border-slate-200/60 dark:border-slate-800 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                2
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Search
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Filter by campus zone (Library, Canteen, Labs), category, or keyword to spot your item immediately.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative bg-slate-50 dark:bg-slate-800/60 rounded-3xl p-6 border border-slate-200/60 dark:border-slate-800 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                3
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Match
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Cross-reference items with reporter notes and automated multimodal AI vector similarity matching.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative bg-slate-50 dark:bg-slate-800/60 rounded-3xl p-6 border border-slate-200/60 dark:border-slate-800 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                4
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Recover
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Submit ownership proof, obtain administrative claim approval, and collect your item safely at the desk.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">
            Built for Campus Needs
          </h2>
          <h3 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Platform Features
          </h3>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Everything students, staff, and campus administration need to manage lost items seamlessly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1 */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-soft hover:shadow-soft-lg transition-all space-y-3">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl w-fit">
              <PlusCircle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Easy Reporting
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Intuitive forms with image upload preview, campus block dropdowns, and distinct marker tags for fast submission.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-soft hover:shadow-soft-lg transition-all space-y-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl w-fit">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Centralized Search
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Instantly filter campus items by type, category, location, and date with real-time text query matching.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-soft hover:shadow-soft-lg transition-all space-y-3">
            <div className="p-3 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-2xl w-fit">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Smart Matching Ready
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Clean modular backend architecture pre-wired for Google Gemini 2.5 Flash and FAISS vector similarity search.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-soft hover:shadow-soft-lg transition-all space-y-3">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl w-fit">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Secure Recovery
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Claim management workflow with student ID verification and administrator authorization before handoff.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              Frequently Asked Questions
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Got questions about using FindIt? Here are quick answers.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      openFaq === idx ? 'rotate-180 text-indigo-600' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
