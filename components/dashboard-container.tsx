"use client";

import React, { useState } from "react";
import { PieChart, ChevronRight, ChevronLeft, X } from "lucide-react";

interface DashboardContainerProps {
  sidebar: React.ReactNode;
  main: React.ReactNode;
  graph: React.ReactNode;
  headerActions?: React.ReactNode;
}

export default function DashboardContainer({ sidebar, main, graph, headerActions }: DashboardContainerProps) {
  const [showGraph, setShowGraph] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex h-screen w-full bg-[#0d1117] text-[#e6edf3] overflow-hidden font-[family-name:var(--font-geist-sans)]">
      {/* 1. Sidebar (Repositories Selection) - Column 1 */}
      <div className="w-64 border-r border-[#30363d] bg-[#010409] flex flex-col shrink-0">
        {sidebar}
      </div>

      {/* 2. Main Area (Kanban or Graph) - Column 2 */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0d1117] relative">
        <header className="h-14 border-b border-[#30363d] flex items-center justify-between px-6 shrink-0 bg-[#010409]/50 backdrop-blur-sm z-20">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-[#f0f6fc]">
              Issues Board
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {headerActions}
            {headerActions && <div className="h-6 w-[1px] bg-[#30363d] mx-1" />}
            <button
              onClick={() => setShowGraph(!showGraph)}
              className={`flex items-center gap-2 text-xs font-medium text-[#8b949e] hover:text-[#f0f6fc] transition-colors p-2 hover:bg-[#1c2128] rounded-md ${showGraph ? "bg-[#1f242c] text-[#f0f6fc]" : ""}`}
            >
              <PieChart size={14} />
              <span>Analysis View</span>
            </button>
          </div>
        </header>

        <main className="flex-1 min-h-0 flex flex-col relative">
          {main}

          {/* Popout Graph Widget */}
          {showGraph && (
            <>
              {/* Overlay backdrop */}
              <div 
                className="absolute inset-0 bg-black/40 z-10 animate-in fade-in duration-300" 
                onClick={() => setShowGraph(false)}
              />
              {/* Sliding Panel */}
              <div 
                className={`absolute top-0 right-0 bottom-0 bg-[#010409] border-l border-[#30363d] shadow-2xl z-20 flex flex-col p-6 transition-all duration-300 ease-in-out ${isExpanded ? "w-[800px]" : "w-96"}`}
              >
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="text-[#8b949e] hover:text-[#f0f6fc] p-1 hover:bg-[#1c2128] rounded-md transition-colors"
                      title={isExpanded ? "Collapse" : "Expand"}
                    >
                      {isExpanded ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                    <div className="flex items-center gap-2 text-[#f0f6fc]">
                      <PieChart size={18} />
                      <span className="font-bold text-sm uppercase tracking-wider">
                        Analysis View
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowGraph(false)}
                    className="text-[#8b949e] hover:text-[#f0f6fc] p-1 hover:bg-[#1c2128] rounded-md transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  {graph}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
