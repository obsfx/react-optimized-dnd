import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { useReactOptimizedDndContext } from "./ReactOptimizedDndContext";
import type { UseDraggableProps } from "./types";

const DRAG_THRESHOLD = 3;

export function useDraggable(props?: UseDraggableProps) {
  const { data, dragThreshold = DRAG_THRESHOLD } = props || {};

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

      if (handleState.current.dragging) {
        setDeltaPos({ x: deltaX, y: deltaY });
        event.preventDefault(); // prevent scrolling while dragging
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
        event.preventDefault();
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
