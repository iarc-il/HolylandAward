import { useEffect, useRef } from "react";
import type { PointerEvent } from "react";

// Lets a dialog be dragged by its header. The window is moved by writing
// straight to the element (not through React state): re-rendering a long
// list on every mouse move makes the drag lag. The dialog element is created
// fresh each time it opens, so it always starts centred.
export const useDraggableDialog = (isOpen: boolean) => {
  const offset = useRef({ x: 0, y: 0 });
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  const windowOf = (header: HTMLElement) =>
    header.closest<HTMLElement>("[data-slot='dialog-content']");

  useEffect(() => {
    if (isOpen) offset.current = { x: 0, y: 0 };
  }, [isOpen]);

  // Spread these on the dialog header.
  const headerProps = {
    className: "cursor-move select-none touch-none",
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      dragStart.current = {
        x: event.clientX - offset.current.x,
        y: event.clientY - offset.current.y,
      };
      const el = windowOf(event.currentTarget);
      if (el) el.style.transition = "none";
    },
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
      if (!dragStart.current) return;
      offset.current = {
        x: event.clientX - dragStart.current.x,
        y: event.clientY - dragStart.current.y,
      };
      const el = windowOf(event.currentTarget);
      if (el) {
        el.style.marginLeft = `${offset.current.x}px`;
        el.style.marginTop = `${offset.current.y}px`;
      }
    },
    onPointerUp: () => {
      dragStart.current = null;
    },
  };

  return headerProps;
};
