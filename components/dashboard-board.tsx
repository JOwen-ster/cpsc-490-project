"use client";

import React, { useState } from "react";
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

export default function DashboardBoard({ initialColumns = INITIAL_COLUMNS }: { initialColumns?: Column[] }) {
  const [columns, setColumns] = useState<Column[]>(initialColumns);

  const handleDropOverColumn = (columnId: string, dataTransferData: string) => {
    const draggedCard = JSON.parse(dataTransferData) as CardData;

    setColumns((prev) => {
      // Remove card from any existing column
      const newColumns = prev.map((col) => ({
        ...col,
        cards: col.cards.filter((card) => card.id !== draggedCard.id),
      }));

      // Add card to the new column
      return newColumns.map((col) => {
        if (col.id === columnId) {
          return {
            ...col,
            cards: [...col.cards, draggedCard],
          };
        }
        return col;
      });
    });
  };

  return (
    <KanbanBoardProvider>
      <KanbanBoard className="p-6 gap-6">
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
                className="text-[#f0f6fc]"
              >
                <KanbanColorCircle
                  color={column.color as any}
                  className="ml-5"
                />
                {column.title}
              </KanbanBoardColumnTitle>
            </KanbanBoardColumnHeader>

            <KanbanBoardColumnList className="px-1 flex flex-col gap-3">
              {column.cards.map((card) => (
                <KanbanBoardColumnListItem key={card.id} cardId={card.id}>
                  <KanbanBoardCard
                    data={card}
                    className="bg-[#161b22] border-[#30363d] p-4 rounded-lg shadow-sm w-full"
                  >
                    <KanbanBoardCardTitle className="text-[#f0f6fc]  text-sm font-medium">
                      {card.title}
                    </KanbanBoardCardTitle>
                    <KanbanBoardCardDescription className="text-[#8b949e] text-xs mt-1">
                      {card.author} • {card.time}
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
    </KanbanBoardProvider>
  );
}
