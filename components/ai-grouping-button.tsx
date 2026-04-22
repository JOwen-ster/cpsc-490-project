"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useFormStatus } from "react-dom";
import { Sparkles, Loader2, BrainCircuit } from "lucide-react";

export function AiGroupingButton({ remaining }: { remaining: number }) {
  const { pending } = useFormStatus();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const overlay = (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-lg animate-in fade-in duration-500">
      <div className="bg-[#0d1117] border border-[#30363d] p-10 rounded-3xl shadow-[0_0_50px_rgba(168,85,247,0.15)] flex flex-col items-center gap-8 max-w-md w-[90%] text-center transform scale-110">
        <div className="relative">
          <div className="absolute inset-0 bg-purple-500/30 blur-2xl rounded-full animate-pulse" />
          <BrainCircuit size={64} className="text-purple-400 relative animate-bounce" />
        </div>
        <div className="space-y-3">
          <h3 className="text-[#f0f6fc] font-bold text-2xl tracking-tight">AI is working its magic</h3>
          <p className="text-[#8b949e] text-base leading-relaxed">
            Analyzing, categorizing, and prioritizing your issues to create the perfect project roadmap.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-[#161b22] px-6 py-3 rounded-full border border-[#30363d] text-purple-400 font-semibold shadow-inner">
          <Loader2 className="animate-spin" size={20} />
          <span>Optimizing Your Board...</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* UI Block Overlay - Rendered via Portal to ensure absolute centering on viewport */}
      {pending && mounted && createPortal(overlay, document.body)}

      <div className="flex items-center gap-3">
        {/* Usage Meter */}
        <div className="flex flex-col items-end gap-0.5" title={`${remaining} groupings left today`}>
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className={`h-1 w-3 rounded-full transition-all duration-500 ${
                  i <= remaining 
                    ? "bg-purple-500/60 shadow-[0_0_8px_rgba(168,85,247,0.4)]" 
                    : "bg-[#30363d]"
                }`} 
              />
            ))}
          </div>
          <span className="text-[9px] text-[#8b949e] font-mono uppercase tracking-tighter">
            {remaining}/3 LEFT
          </span>
        </div>

        <button 
          type="submit" 
          disabled={pending || remaining === 0}
          className="flex items-center gap-2 text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors p-2 hover:bg-[#1c2128] rounded-md border border-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed group"
          title={remaining === 0 ? "Daily limit reached" : (pending ? "Grouping issues..." : "Group and prioritize issues using AI")}
        >
          {pending ? (
            <Loader2 size={14} className="text-purple-400 animate-spin" />
          ) : (
            <Sparkles size={14} className="text-purple-400" />
          )}
          {pending ? "Grouping..." : "AI Grouping"}
        </button>
      </div>
    </>
  );
}
