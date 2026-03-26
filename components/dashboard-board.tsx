"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useJsLoaded } from "@/hooks/use-js-loaded";
import {
  KanbanBoard,
  KanbanBoardProvider,
  KanbanBoardColumn,
  KanbanBoardColumnHeader,
  KanbanBoardColumnTitle,
  KanbanBoardColumnList,
  KanbanBoardColumnListItem,
  KanbanBoardCard,
  KanbanBoardCardTitle,
  KanbanBoardCardDescription,
  KanbanColorCircle,
  KanbanBoardExtraMargin,
} from "@/components/kanban";

import { updateIssueStatus } from "@/app/actions";

export interface CardData {
  id: string;
  title: string;
  author: string;
  time: string;
  tags?: { name: string; color: string }[];
}

export interface Column {
  id: string;
  title: string;
  color: "gray" | "yellow" | "green" | "primary";
  cards: CardData[];
}

const INITIAL_COLUMNS: Column[] = [
  {
    id: "todo",
    title: "To Do",
    color: "gray",
    cards: [
      {
        id: "1",
        title: "#1 Fix sidebar rendering",
        author: "@lucas",
        time: "2h ago",
      },
    ],
  },
  {
    id: "inprogress",
    title: "In Progress",
    color: "yellow",
    cards: [
      {
        id: "4",
        title: "#4 Integrating Auth.js",
        author: "@lucas",
        time: "5h ago",
      },
    ],
  },
  {
    id: "done",
    title: "Done",
    color: "green",
    cards: [],
  },
];

export default function DashboardBoard({ 
  initialColumns = INITIAL_COLUMNS,
  groupColumns = []
}: { 
  initialColumns?: Column[],
  groupColumns?: Column[]
}) {
  const [view, setView] = useState<"status" | "groups">("status");
  const columns = view === "status" ? initialColumns : groupColumns;
  const router = useRouter();

  const handleDropOverColumn = (columnId: string, dataTransferData: string) => {
    if (view !== "status") return; // Disable drag/drop for grouped view for now

    const draggedCard = JSON.parse(dataTransferData) as CardData;

    // Fire and forget server action to persist status
    updateIssueStatus(draggedCard.id, columnId)
      .then(() => {
        // Trigger server-side re-render to sync the graph view
        router.refresh();
      })
      .catch(console.error);
  };


  return (
    <KanbanBoardProvider>
      <div className="flex flex-col h-full">
        <div className="px-6 pt-4 flex items-center gap-4">
          <div className="flex bg-[#161b22] p-1 rounded-lg border border-[#30363d]">
            <button
              onClick={() => setView("status")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                view === "status" 
                  ? "bg-[#30363d] text-[#f0f6fc]" 
                  : "text-[#8b949e] hover:text-[#f0f6fc]"
              }`}
            >
              Status View
            </button>
            <button
              onClick={() => setView("groups")}
              disabled={groupColumns.length === 0}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                view === "groups" 
                  ? "bg-[#30363d] text-[#f0f6fc]" 
                  : "text-[#8b949e] hover:text-[#f0f6fc]"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              AI Groups
            </button>
          </div>
          {view === "groups" && groupColumns.length > 0 && (
            <span className="text-[10px] text-[#8b949e] italic">
              Issues prioritized by AI (1 = highest)
            </span>
          )}
        </div>

        <KanbanBoard className="p-6 gap-6 flex-1 overflow-x-auto">
          {columns.map((column) => (
            <KanbanBoardColumn
              key={column.id}
              columnId={column.id}
              className="w-72 bg-[#161b22]/40 border-[#30363d]"
              onDropOverColumn={(data) => handleDropOverColumn(column.id, data)}
            >
              <KanbanBoardColumnHeader className="px-1 py-4">
                <KanbanBoardColumnTitle
                  columnId={column.id}
                  className="text-[#f0f6fc] truncate pr-2"
                >
                  <KanbanColorCircle
                    color={column.color as any}
                    className="ml-5"
                  />
                  {column.title}
                </KanbanBoardColumnTitle>
              </KanbanBoardColumnHeader>

              <KanbanBoardColumnList className="px-1 flex flex-col gap-3">
                {column.cards.map((card, index) => (
                  <KanbanBoardColumnListItem key={card.id} cardId={card.id}>
                    <KanbanBoardCard
                      data={card}
                      className="bg-[#161b22] border-[#30363d] p-4 rounded-lg shadow-sm w-full relative"
                    >
                      {view === "groups" && (
                        <div className="absolute top-2 right-2 bg-purple-500/20 text-purple-400 text-[10px] px-1.5 py-0.5 rounded border border-purple-500/30 font-bold">
                          #{index + 1}
                        </div>
                      )}
                      <KanbanBoardCardTitle className="text-[#f0f6fc] text-sm font-medium pr-6">
                        {card.title}
                      </KanbanBoardCardTitle>
                      <KanbanBoardCardDescription className="text-[#8b949e] text-xs mt-1">
                        {card.author} • <ClientDate date={card.time} />
                      </KanbanBoardCardDescription>
                      {card.tags && card.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {card.tags.map((tag) => (
                            <span
                              key={tag.name}
                              className="px-2 py-0.5 rounded-full text-[10px] font-medium border border-transparent"
                              style={{ backgroundColor: `${tag.color}20`, color: tag.color, borderColor: `${tag.color}40` }}
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </KanbanBoardCard>
                  </KanbanBoardColumnListItem>
                ))}
              </KanbanBoardColumnList>
            </KanbanBoardColumn>
          ))}
          <KanbanBoardExtraMargin />
        </KanbanBoard>
      </div>
    </KanbanBoardProvider>
  );
}

function ClientDate({ date }: { date: string }) {
  const isLoaded = useJsLoaded();
  // Don't render formatting until JS is loaded to match server HTML exactly
  if (!isLoaded) return <span>{date.includes('T') ? date.split('T')[0] : date}</span>;
  
  // After JS loads, format it properly
  const d = new Date(date);
  return <span>{isNaN(d.getTime()) ? date : d.toLocaleDateString()}</span>;
}
