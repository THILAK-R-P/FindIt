import React from 'react';
import { Sparkles, Cpu, Layers, BellRing, ArrowRight } from 'lucide-react';

const AIPlaceholderBanner = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-blue-950/40 border border-indigo-200/80 dark:border-indigo-800/80 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              AI Smart Matching Engine (Phase 2 Roadmap)
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Multimodal Gemini 2.5 Flash & FAISS vector search will be integrated in the next milestone.
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex text-[11px] font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-700">
          Architecture Ready
        </span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-indigo-700/50">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-8 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Architecture Blueprint • Phase 2</span>
          </div>
          <span className="text-xs font-medium text-slate-400 bg-white/5 px-3 py-1 rounded-lg border border-white/10">
            Backend Interface Configured
          </span>
        </div>

        <div className="space-y-2 max-w-2xl">
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Next-Gen Multimodal Matching Engine
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            AI-powered matching will analyze item images and descriptions in the next development phase using Google Gemini 2.5 Flash, feature embeddings, and FAISS vector similarity search.
          </p>
        </div>

        {/* 4-Step Pipeline Architecture Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">1</span>
              <span>Gemini 2.5 Flash</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Multimodal image feature extraction & attribute tagging.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-purple-300 text-xs font-bold">
              <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">2</span>
              <span>Embeddings</span>
            </div>
            <p className="text-[11px] text-slate-300">
              High-dimensional vector representations for lost & found items.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-blue-300 text-xs font-bold">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">3</span>
              <span>FAISS Index</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Fast cosine similarity & clustering for instant match discovery.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">4</span>
              <span>Smart Alerts</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Automated notifications & Nodemailer alerts to verified owners.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPlaceholderBanner;
