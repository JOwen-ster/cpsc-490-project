import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export * from "./context";
export * from "./column";
export * from "./card";

/*
Board Components
*/

export function KanbanBoard({
  className,
  ref,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex h-full grow items-start gap-x-2 overflow-x-auto py-1",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
}

/**
 * Add some extra margin to the right of the container to allow for scrolling
 * when adding a new column.
 */
export function KanbanBoardExtraMargin({
  className,
  ref,
  ...props
}: ComponentProps<"div">) {
  return (
    <div className={cn("h-1 w-8 shrink-0", className)} ref={ref} {...props} />
  );
}
