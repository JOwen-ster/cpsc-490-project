import type {
  ChangeEvent,
  ComponentProps,
  KeyboardEvent,
} from "react";
import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useDndEvents, DATA_TRANSFER_TYPES } from "./context";

export type KanbanBoardCardProps<T extends { id: string } = { id: string }> = {
  /**
   * A string representing the data to add to the DataTransfer.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/setData#data
   */
  data: T;
  /**
   * Whether the card is being moved with the keyboard.
   */
  isActive?: boolean;
};

const kanbanBoardCardClassNames =
  "rounded-lg border border-border bg-background p-3 text-start text-foreground shadow-sm";

export function KanbanBoardCard({
  className,
  data,
  isActive = false,
  ref,
  ...props
}: ComponentProps<"button"> & KanbanBoardCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { draggableDescribedById, onDragStart } = useDndEvents();

  return (
    <button
      aria-describedby={draggableDescribedById}
      aria-roledescription="draggable"
      className={cn(
        kanbanBoardCardClassNames,
        "focus-visible:ring-ring inline-flex w-full cursor-grab touch-manipulation flex-col gap-1 focus-visible:ring-1 focus-visible:outline-none",
        isDragging
          ? "cursor-grabbing active:cursor-grabbing"
          : "group relative",
        isActive && "rotate-1 transform shadow-lg",
        className,
      )}
      draggable
      onDragStart={(event) => {
        setIsDragging(true);
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData(
          DATA_TRANSFER_TYPES.CARD,
          JSON.stringify(data),
        );
        // Remove outline from the card when dragging.
        event.currentTarget.blur();

        onDragStart(data.id);
      }}
      onDragEnd={() => {
        setIsDragging(false);
      }}
      ref={ref}
      {...props}
    />
  );
}

export function KanbanBoardCardTitle({
  className,
  ref,
  ...props
}: ComponentProps<"h3">) {
  return (
    <h3 className={cn("text-sm font-medium", className)} ref={ref} {...props} />
  );
}

export function KanbanBoardCardDescription({
  className,
  ref,
  ...props
}: ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "text-card-foreground text-xs leading-5 whitespace-pre-wrap",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
}

export function KanbanBoardCardTextarea({
  className,
  onChange,
  value,
  ref: externalReference,
  ...props
}: ComponentProps<"textarea">) {
  const internalReference = useRef<HTMLTextAreaElement | null>(null);

  const adjustTextareaHeight = () => {
    if (internalReference.current) {
      internalReference.current.style.height = "auto"; 
      internalReference.current.style.height = `${internalReference.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, []);

  useEffect(() => {
    if (value === "") {
      adjustTextareaHeight();
    }
  }, [value]);

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    onChange?.(event);
    adjustTextareaHeight();
  }

  useImperativeHandle(externalReference, () => internalReference.current!);

  return (
    <Textarea
      className={cn(
        kanbanBoardCardClassNames,
        "min-h-min resize-none overflow-hidden text-xs leading-5",
        className,
      )}
      onChange={handleChange}
      rows={1}
      value={value}
      ref={internalReference}
      {...props}
    />
  );
}

export type KanbanBoardCardButtonGroupProps = {
  disabled?: boolean;
};

export function KanbanBoardCardButtonGroup({
  className,
  disabled = false,
  ref,
  ...props
}: ComponentProps<"div"> & KanbanBoardCardButtonGroupProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "bg-background absolute top-2.5 right-2.5 z-40 hidden items-center",
        !disabled && "group-focus-within:flex group-hover:flex",
        className,
      )}
      {...props}
    />
  );
}

export type KanbanBoardCardButtonProps = {
  tooltip?: string;
};

export function KanbanBoardCardButton({
  className,
  tooltip,
  ref: externalReference,
  ...props
}: ComponentProps<"div"> & KanbanBoardCardButtonProps) {
  const internalReference = useRef<HTMLDivElement | null>(null);

  useImperativeHandle(externalReference, () => internalReference.current!);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      internalReference.current?.click();
    }
  };

  const button = (
    <div
      className={cn(
        buttonVariants({ size: "icon", variant: "ghost" }),
        "border-border size-5 border hover:cursor-default [&_svg]:size-3.5",
        className,
      )}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      ref={internalReference}
      {...props}
    />
  );

  if (!tooltip) {
    return button;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>

      <TooltipContent align="center" side="bottom">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
