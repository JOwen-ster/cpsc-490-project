import type { ComponentProps } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useDndEvents, DATA_TRANSFER_TYPES } from "./context";

export const KANBAN_BOARD_CIRCLE_COLORS_MAP = {
  primary: "bg-kanban-board-circle-primary",
  gray: "bg-kanban-board-circle-gray",
  red: "bg-kanban-board-circle-red",
  yellow: "bg-kanban-board-circle-yellow",
  green: "bg-kanban-board-circle-green",
  cyan: "bg-kanban-board-circle-cyan",
  blue: "bg-kanban-board-circle-blue",
  indigo: "bg-kanban-board-circle-indigo",
  violet: "bg-kanban-board-circle-violet",
  purple: "bg-kanban-board-circle-purple",
  pink: "bg-kanban-board-circle-pink",
};

export type KanbanBoardCircleColor = keyof typeof KANBAN_BOARD_CIRCLE_COLORS_MAP;

export const KANBAN_BOARD_CIRCLE_COLORS = Object.keys(
  KANBAN_BOARD_CIRCLE_COLORS_MAP,
) as KanbanBoardCircleColor[];

export type KanbanBoardColumnProps = {
  columnId: string;
  onDropOverColumn?: (dataTransferData: string) => void;
};

export const kanbanBoardColumnClassNames =
  "w-64 flex-shrink-0 rounded-lg border flex flex-col border-border bg-sidebar py-2 h-full";

export function KanbanBoardColumn({
  className,
  columnId,
  onDropOverColumn,
  ref,
  ...props
}: ComponentProps<"section"> & KanbanBoardColumnProps) {
  const [isDropTarget, setIsDropTarget] = useState(false);
  const { onDragEnd, onDragOver } = useDndEvents();

  return (
    <section
      aria-labelledby={`column-${columnId}-title`}
      className={cn(
        kanbanBoardColumnClassNames,
        isDropTarget && "border-primary",
        className,
      )}
      onDragLeave={() => {
        setIsDropTarget(false);
      }}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes(DATA_TRANSFER_TYPES.CARD)) {
          event.preventDefault();
          setIsDropTarget(true);
          onDragOver("", columnId);
        }
      }}
      onDrop={(event) => {
        const data = event.dataTransfer.getData(DATA_TRANSFER_TYPES.CARD);
        onDropOverColumn?.(data);
        onDragEnd(JSON.parse(data).id as string, columnId);
        setIsDropTarget(false);
      }}
      ref={ref}
      {...props}
    />
  );
}

export function KanbanBoardColumnSkeleton() {
  return (
    <section className={cn(kanbanBoardColumnClassNames, "h-full py-0")}>
      <Skeleton className="h-full w-full" />
    </section>
  );
}

export function KanbanBoardColumnHeader({
  className,
  ref,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex items-center justify-between px-2 py-1", className)}
      ref={ref}
      {...props}
    />
  );
}

export type KanbanBoardColumnTitleProps = {
  columnId: string;
};

export function KanbanBoardColumnTitle({
  className,
  columnId,
  ref,
  ...props
}: ComponentProps<"h2"> & KanbanBoardColumnTitleProps) {
  return (
    <h2
      className={cn(
        "text-muted-foreground inline-flex items-center text-sm font-medium",
        className,
      )}
      ref={ref}
      id={`column-${columnId}-title`}
      {...props}
    />
  );
}

export function KanbanBoardColumnIconButton({
  className,
  ref,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      className={cn("text-muted-foreground size-6", className)}
      variant="ghost"
      size="icon"
      ref={ref}
      {...props}
    />
  );
}

export type KanbanBoardColorCircleProps = {
  color?: KanbanBoardCircleColor;
};

export function KanbanColorCircle({
  className,
  color = "primary",
  ref,
  ...props
}: ComponentProps<"div"> & KanbanBoardColorCircleProps) {
  return (
    <div
      className={cn(
        "mr-2 size-2 rounded-full",
        KANBAN_BOARD_CIRCLE_COLORS_MAP[color],
        className,
      )}
      ref={ref}
      {...props}
    />
  );
}

export function KanbanBoardColumnList({
  className,
  ref,
  ...props
}: ComponentProps<"ul">) {
  return (
    <ul
      className={cn("min-h-0.5 grow overflow-y-auto", className)}
      ref={ref}
      {...props}
    />
  );
}

export type KanbanBoardDropDirection = "none" | "top" | "bottom";

export type KanbanBoardColumnListItemProps = {
  cardId: string;
  onDropOverListItem?: (
    dataTransferData: string,
    dropDirection: KanbanBoardDropDirection,
  ) => void;
};

export const kanbanBoardColumnListItemClassNames =
  "-mb-[2px] border-b-2 border-t-2 border-b-transparent border-t-transparent px-2 py-1 last:mb-0";

export function KanbanBoardColumnListItem({
  cardId,
  className,
  onDropOverListItem,
  ref,
  ...props
}: ComponentProps<"li"> & KanbanBoardColumnListItemProps) {
  const [dropDirection, setDropDirection] =
    useState<KanbanBoardDropDirection>("none");
  const { onDragOver, onDragEnd } = useDndEvents();

  return (
    <li
      className={cn(
        kanbanBoardColumnListItemClassNames,
        dropDirection === "top" && "border-t-primary",
        dropDirection === "bottom" && "border-b-primary",
        className,
      )}
      onDragLeave={() => {
        setDropDirection("none");
      }}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes(DATA_TRANSFER_TYPES.CARD)) {
          event.preventDefault();
          const rect = event.currentTarget.getBoundingClientRect();
          const midpoint = (rect.top + rect.bottom) / 2;
          setDropDirection(event.clientY <= midpoint ? "top" : "bottom");
          onDragOver("", cardId);
        }
      }}
      onDrop={(event) => {
        const data = event.dataTransfer.getData(DATA_TRANSFER_TYPES.CARD);
        onDropOverListItem?.(data, dropDirection);

        onDragEnd(JSON.parse(data).id as string, cardId);
        setDropDirection("none");
      }}
      ref={ref}
      {...props}
    />
  );
}

export function KanbanBoardColumnFooter({
  className,
  ref,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex items-center justify-between px-2 pt-1", className)}
      ref={ref}
      {...props}
    />
  );
}

export function KanbanBoardColumnButton({
  className,
  ref,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      className={cn(
        "bg-sidebar text-primary hover:text-primary/80 w-full justify-start",
        className,
      )}
      variant="outline"
      size="sm"
      ref={ref}
      {...props}
    />
  );
}
