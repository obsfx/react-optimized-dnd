import { useIntersectionObserver } from "usehooks-ts";
import { useReactOptimizedDndContext } from "./ReactOptimizedDndContext";
import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { v7 } from "uuid";
import type { UseDroppableProps } from "./types";

export function useDroppable(props?: UseDroppableProps) {
  const { data } = props || {};
  const { droppableElementRefsPool } = useReactOptimizedDndContext();

  const uuid = useRef(v7());
  const elementRef = useRef<HTMLElement>(null);
  const [isOver, setIsOver] = useState(false);

  const { isIntersecting, ref: intersectionObserverRef } =
    useIntersectionObserver({
      threshold: 0.01,
    });

  useEffect(() => {
    if (!elementRef.current) return;

    if (isIntersecting) {
      if (!droppableElementRefsPool.current[uuid.current]) {
        droppableElementRefsPool.current[uuid.current] = {
          ref: elementRef as RefObject<HTMLElement>,
          subscriber: (data: any) => {
            // handle the data
            setIsOver(data.isOver);
          },
          data: data || null,
        };
      }
    } else {
      if (droppableElementRefsPool.current[uuid.current]) {
        delete droppableElementRefsPool.current[uuid.current];
        setIsOver(false);
      }
    }
    // @eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isIntersecting]);

  const droppableRef = (node: any) => {
    elementRef.current = node;
    intersectionObserverRef(node);
  };

  return { droppableRef, isOver };
}
