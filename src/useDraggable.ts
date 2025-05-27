import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { useReactOptimizedDndContext } from "./ReactOptimizedDndContext";
import type { UseDraggableProps } from "./types";

const DRAG_THRESHOLD = 3;
const TOUCH_DRAG_DELAY = 35;

export function useDraggable(props?: UseDraggableProps) {
  const { data, dragThreshold = DRAG_THRESHOLD, touchDragDelay = TOUCH_DRAG_DELAY } = props || {};

  const { draggingElementRef, setDraggingElement } = useReactOptimizedDndContext();

  const handle = useRef<any>(null);
  const handleState = useRef({
    mouseOver: false,
    mouseDown: false,
    dragging: false,
    holdStartedX: 0,
    holdStartedY: 0,
    holdStartedScrollX: 0,
    holdStartedScrollY: 0,
  });


  const posState = useRef({
    deltaScrollX: 0,
    deltaScrollY: 0,
    deltaMouseX: 0,
    deltaMouseY: 0,
  });

  const [isDragging, setIsDragging] = useState(false);
  const isMounted = useRef(false);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    if (!isDragging) {
      setDraggingElement(null, null);
    } else {
      setDraggingElement(handle as RefObject<HTMLElement>, data);
    }
  }, [isDragging]);

  const [deltaPos, setDeltaPos] = useState({ x: 0, y: 0 });

  // Touch drag delay state
  const touchDragTimeout = useRef<NodeJS.Timeout | null>(null);
  const touchDragReady = useRef(false);

  useEffect(() => {
    if (!handle.current) return;

    const onMouseEnter = () => {
      handleState.current.mouseOver = true;
    };

    const onMouseLeave = () => {
      handleState.current.mouseOver = false;
    };

    const onMouseDown = (event: MouseEvent) => {
      handleState.current.mouseDown = true;
      handleState.current.holdStartedX = event.clientX;
      handleState.current.holdStartedY = event.clientY;
      handleState.current.holdStartedScrollX = window.scrollX;
      handleState.current.holdStartedScrollY = window.scrollY;
    };

    const onMouseUp = () => {
      handleState.current.mouseDown = false;
      handleState.current.dragging = false;

      handleState.current.holdStartedX = 0;
      handleState.current.holdStartedY = 0;
      handleState.current.holdStartedScrollX = 0;
      handleState.current.holdStartedScrollY = 0;

      setIsDragging(false);
      setDeltaPos({ x: 0, y: 0 });
    };

    const onMouseMove = (event: MouseEvent) => {
      const deltaScrollX = window.scrollX - handleState.current.holdStartedScrollX;
      const deltaScrollY = window.scrollY - handleState.current.holdStartedScrollY;
      const deltaMouseX = event.clientX - handleState.current.holdStartedX;
      const deltaMouseY = event.clientY - handleState.current.holdStartedY;

      posState.current.deltaMouseX = deltaMouseX;
      posState.current.deltaMouseY = deltaMouseY;
      posState.current.deltaScrollX = deltaScrollX;
      posState.current.deltaScrollY = deltaScrollY;

      const deltaX = deltaMouseX + deltaScrollX;
      const deltaY = deltaMouseY + deltaScrollY;

      if (handleState.current.dragging) {
        setDeltaPos({ x: deltaX, y: deltaY });
        return;
      }

      if (
        !draggingElementRef.current &&
        (Math.abs(deltaX) > dragThreshold ||
          Math.abs(deltaY) > dragThreshold) &&
        handleState.current.mouseOver &&
        handleState.current.mouseDown
      ) {
        handleState.current.dragging = true;
        setIsDragging(true);
      }
    };

    const onScroll = () => {
      if (handleState.current.dragging) {
        posState.current.deltaScrollX = window.scrollX - handleState.current.holdStartedScrollX;
        posState.current.deltaScrollY = window.scrollY - handleState.current.holdStartedScrollY;

        const deltaX = posState.current.deltaMouseX + posState.current.deltaScrollX;
        const deltaY = posState.current.deltaMouseY + posState.current.deltaScrollY;

        setDeltaPos({ x: deltaX, y: deltaY });
      }
    };

    // Touch events for mobile support
    const onTouchStart = (event: TouchEvent) => {
      if (!event.touches || event.touches.length !== 1) return;
      const touch = event.touches[0];
      handleState.current.mouseDown = true;
      handleState.current.mouseOver = true; // treat as over
      handleState.current.holdStartedX = touch.clientX;
      handleState.current.holdStartedY = touch.clientY;
      handleState.current.holdStartedScrollX = window.scrollX;
      handleState.current.holdStartedScrollY = window.scrollY;
      // Set up touch drag delay
      touchDragReady.current = false;
      if (touchDragTimeout.current) clearTimeout(touchDragTimeout.current);
      touchDragTimeout.current = setTimeout(() => {
        touchDragReady.current = true;
        // As soon as delay passes, enter dragging state
        handleState.current.dragging = true;
        setIsDragging(true);
      }, touchDragDelay);
    };

    const onTouchEnd = () => {
      handleState.current.mouseDown = false;
      handleState.current.dragging = false;
      handleState.current.mouseOver = false;
      handleState.current.holdStartedX = 0;
      handleState.current.holdStartedY = 0;
      handleState.current.holdStartedScrollX = 0;
      handleState.current.holdStartedScrollY = 0;
      setIsDragging(false);
      setDeltaPos({ x: 0, y: 0 });
      // Clear touch drag delay
      if (touchDragTimeout.current) clearTimeout(touchDragTimeout.current);
      touchDragReady.current = false;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!event.touches || event.touches.length !== 1) return;
      const touch = event.touches[0];
      const deltaScrollX = window.scrollX - handleState.current.holdStartedScrollX;
      const deltaScrollY = window.scrollY - handleState.current.holdStartedScrollY;
      const deltaMouseX = touch.clientX - handleState.current.holdStartedX;
      const deltaMouseY = touch.clientY - handleState.current.holdStartedY;

      posState.current.deltaMouseX = deltaMouseX;
      posState.current.deltaMouseY = deltaMouseY;
      posState.current.deltaScrollX = deltaScrollX;
      posState.current.deltaScrollY = deltaScrollY;

      const deltaX = deltaMouseX + deltaScrollX;
      const deltaY = deltaMouseY + deltaScrollY;

      // If user moves before delay, cancel drag activation
      if (!touchDragReady.current) {
        if (Math.abs(deltaX) > dragThreshold || Math.abs(deltaY) > dragThreshold) {
          if (touchDragTimeout.current) clearTimeout(touchDragTimeout.current);
          touchDragReady.current = false;
        }
        return; // allow scroll
      }

      // If touchDragReady, we are in dragging state
      if (touchDragReady.current && handleState.current.dragging) {
        setDeltaPos({ x: deltaX, y: deltaY });
        event.preventDefault(); // prevent scrolling while dragging
        return;
      }
    };

    handle.current?.addEventListener("mouseenter", onMouseEnter);
    handle.current?.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("scroll", onScroll);

    // Touch events
    handle.current?.addEventListener("touchstart", onTouchStart, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: false });
    document.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      handle.current?.removeEventListener("mouseenter", onMouseEnter);
      handle.current?.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("scroll", onScroll);
      // Touch events
      handle.current?.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchmove", onTouchMove);
    };
  }, [handle]);

  const handleRef = (node: any) => {
    handle.current = node;
  };

  return { handleRef, deltaPos, isDragging };
}
