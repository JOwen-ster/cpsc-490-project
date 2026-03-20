import type {
  ComponentProps,
  RefObject,
} from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/*
Accessibility & DnD Context
*/

export type KanbanBoardDndMonitorEventHandler = {
  onDragStart?: (activeId: string) => void;
  onDragMove?: (activeId: string, overId?: string) => void;
  onDragOver?: (activeId: string, overId?: string) => void;
  onDragEnd?: (activeId: string, overId?: string) => void;
  onDragCancel?: (activeId: string) => void;
};

export type KanbanBoardDndEventType = keyof KanbanBoardDndMonitorEventHandler;

export type KanbanBoardDndMonitorContextValue = {
  activeIdRef: RefObject<string>;
  draggableDescribedById: string;
  registerMonitor: (monitor: KanbanBoardDndMonitorEventHandler) => void;
  unregisterMonitor: (monitor: KanbanBoardDndMonitorEventHandler) => void;
  triggerEvent: (
    eventType: KanbanBoardDndEventType,
    activeId: string,
    overId?: string,
  ) => void;
};

export const KanbanBoardContext = createContext<
  KanbanBoardDndMonitorContextValue | undefined
>(undefined);

export function useDndMonitor(monitor: KanbanBoardDndMonitorEventHandler) {
  const context = useContext(KanbanBoardContext);
  if (!context) {
    throw new Error("useDndMonitor must be used within a DndMonitorProvider");
  }

  const { registerMonitor, unregisterMonitor } = context;

  useEffect(() => {
    registerMonitor(monitor);
    return () => {
      unregisterMonitor(monitor);
    };
  }, [monitor, registerMonitor, unregisterMonitor]);
}

export function useDndEvents() {
  const context = useContext(KanbanBoardContext);

  if (!context) {
    throw new Error("useDndEvents must be used within a DndMonitorProvider");
  }

  const { activeIdRef, draggableDescribedById, triggerEvent } = context;

  const onDragStart = useCallback(
    (activeId: string) => {
      activeIdRef.current = activeId;
      triggerEvent("onDragStart", activeId);
    },
    [triggerEvent, activeIdRef],
  );

  const onDragMove = useCallback(
    (activeId: string, overId?: string) => {
      triggerEvent("onDragMove", activeId, overId);
    },
    [triggerEvent],
  );

  const onDragOver = useCallback(
    (activeId: string, overId?: string) => {
      const actualActiveId = activeId || (activeIdRef.current as string);
      triggerEvent("onDragOver", actualActiveId, overId);
    },
    [triggerEvent, activeIdRef],
  );

  const onDragEnd = useCallback(
    (activeId: string, overId?: string) => {
      triggerEvent("onDragEnd", activeId, overId);
    },
    [triggerEvent],
  );

  const onDragCancel = useCallback(
    (activeId: string) => {
      triggerEvent("onDragCancel", activeId);
    },
    [triggerEvent],
  );

  return {
    draggableDescribedById,
    onDragStart,
    onDragMove,
    onDragOver,
    onDragEnd,
    onDragCancel,
  };
}

export const defaultScreenReaderInstructions = `
To pick up a draggable item, press the space bar.
While dragging, use the arrow keys to move the item.
Press space again to drop the item in its new position, or press escape to cancel.
`;

export type KanbanBoardAnnouncements = {
  onDragStart: (activeId: string) => string;
  onDragMove?: (activeId: string, overId?: string) => string | undefined;
  onDragOver: (activeId: string, overId?: string) => string;
  onDragEnd: (activeId: string, overId?: string) => string;
  onDragCancel: (activeId: string) => string;
};

export const defaultAnnouncements: KanbanBoardAnnouncements = {
  onDragStart(activeId) {
    return `Picked up draggable item ${activeId}.`;
  },
  onDragOver(activeId, overId) {
    if (overId) {
      return `Draggable item ${activeId} was moved over droppable area ${overId}.`;
    }

    return `Draggable item ${activeId} is no longer over a droppable area.`;
  },
  onDragEnd(activeId, overId) {
    if (overId) {
      return `Draggable item ${activeId} was dropped over droppable area ${overId}`;
    }

    return `Draggable item ${activeId} was dropped.`;
  },
  onDragCancel(activeId) {
    return `Dragging was cancelled. Draggable item ${activeId} was dropped.`;
  },
};

export type KanbanBoardLiveRegionProps = {
  id: string;
  announcement: string;
  ariaLiveType?: "polite" | "assertive" | "off";
};

export function KanbanBoardLiveRegion({
  announcement,
  ariaLiveType = "assertive",
  className,
  id,
  ref,
  ...props
}: ComponentProps<"div"> & KanbanBoardLiveRegionProps) {
  return (
    <div
      aria-live={ariaLiveType}
      aria-atomic
      className={cn(
        "clip-[rect(0_0_0_0)] clip-path-[inset(100%)] fixed top-0 left-0 -m-px h-px w-px overflow-hidden border-0 p-0 whitespace-nowrap",
        className,
      )}
      id={id}
      ref={ref}
      role="status"
      {...props}
    >
      {announcement}
    </div>
  );
}

export type KanbanBoardHiddenTextProps = {
  id: string;
  value: string;
};

export function KanbanBoardHiddenText({
  id,
  value,
  className,
  ref,
  ...props
}: ComponentProps<"div"> & KanbanBoardHiddenTextProps) {
  return (
    <div id={id} className={cn("hidden", className)} ref={ref} {...props}>
      {value}
    </div>
  );
}

export function useAnnouncement() {
  const [announcement, setAnnouncement] = useState("");
  const announce = useCallback((value: string | undefined) => {
    if (value != undefined) {
      setAnnouncement(value);
    }
  }, []);

  return { announce, announcement } as const;
}

export type KanbanBoardAccessibilityProps = {
  announcements?: KanbanBoardAnnouncements;
  container?: Element;
  screenReaderInstructions?: string;
  hiddenTextDescribedById: string;
};

export const KanbanBoardAccessibility = ({
  announcements = defaultAnnouncements,
  container,
  hiddenTextDescribedById,
  screenReaderInstructions = defaultScreenReaderInstructions,
}: KanbanBoardAccessibilityProps) => {
  const { announce, announcement } = useAnnouncement();
  const liveRegionId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useDndMonitor(
    useMemo(
      () => ({
        onDragStart(activeId) {
          announce(announcements.onDragStart(activeId));
        },
        onDragMove(activeId, overId) {
          if (announcements.onDragMove) {
            announce(announcements.onDragMove(activeId, overId));
          }
        },
        onDragOver(activeId, overId) {
          announce(announcements.onDragOver(activeId, overId));
        },
        onDragEnd(activeId, overId) {
          announce(announcements.onDragEnd(activeId, overId));
        },
        onDragCancel(activeId) {
          announce(announcements.onDragCancel(activeId));
        },
      }),
      [announce, announcements],
    ),
  );

  if (!mounted) {
    return null;
  }

  const markup = (
    <>
      <KanbanBoardHiddenText
        id={hiddenTextDescribedById}
        value={screenReaderInstructions}
      />
      <KanbanBoardLiveRegion id={liveRegionId} announcement={announcement} />
    </>
  );

  return container ? createPortal(markup, container) : markup;
};

export type KanbanBoardProviderProps = {
  announcements?: KanbanBoardAnnouncements;
  screenReaderInstructions?: string;
  container?: Element;
  children: React.ReactNode;
};

export const KanbanBoardProvider = ({
  announcements,
  screenReaderInstructions,
  container,
  children,
}: KanbanBoardProviderProps) => {
  const draggableDescribedById = useId();
  const monitorsReference = useRef<KanbanBoardDndMonitorEventHandler[]>([]);
  const activeIdReference = useRef<string>("");

  const registerMonitor = useCallback(
    (monitor: KanbanBoardDndMonitorEventHandler) => {
      monitorsReference.current.push(monitor);
    },
    [],
  );

  const unregisterMonitor = useCallback(
    (monitor: KanbanBoardDndMonitorEventHandler) => {
      monitorsReference.current = monitorsReference.current.filter(
        (m) => m !== monitor,
      );
    },
    [],
  );

  const triggerEvent = useCallback(
    (eventType: KanbanBoardDndEventType, activeId: string, overId?: string) => {
      for (const monitor of monitorsReference.current) {
        const handler = monitor[eventType];
        if (handler) {
          handler(activeId, overId);
        }
      }
    },
    [],
  );

  const contextValue = useMemo(
    () => ({
      activeIdRef: activeIdReference,
      draggableDescribedById,
      registerMonitor,
      unregisterMonitor,
      triggerEvent,
    }),
    [
      activeIdReference,
      draggableDescribedById,
      registerMonitor,
      unregisterMonitor,
      triggerEvent,
    ],
  );

  return (
    <TooltipProvider>
      <KanbanBoardContext.Provider value={contextValue}>
        {children}
        <KanbanBoardAccessibility
          announcements={announcements}
          screenReaderInstructions={screenReaderInstructions}
          container={container}
          hiddenTextDescribedById={draggableDescribedById}
        />
      </KanbanBoardContext.Provider>
    </TooltipProvider>
  );
};

export const DATA_TRANSFER_TYPES = {
  CARD: "kanban-board-card",
};
