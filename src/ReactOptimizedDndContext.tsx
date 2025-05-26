import { createContext, useContext, useRef } from 'react';
import type { ReactNode, RefObject } from 'react';
import type {
  IDroppableItem,
  IReactOptimizedDndContextState,
  IReactOptimizedDndComponentState,
} from './types';

const ReactOptimizedDndContext = createContext<IReactOptimizedDndContextState | null>(null);

export function useReactOptimizedDndContext() {
  const context = useContext(ReactOptimizedDndContext);
  if (!context) {
    throw new Error('useReactOptimizedDndContext must be used within a ReactOptimizedDndProvider');
  }
  return context;
}

function ReactOptimizedDndProvider({
  children,
  onDragStart,
  onDragEnd,
  onDragOver,
}: {
  children: ReactNode;
  onDragStart?: (state: IReactOptimizedDndComponentState) => void;
  onDragEnd?: (state: IReactOptimizedDndComponentState) => void;
  onDragOver?: (state: IReactOptimizedDndComponentState) => void;
}) {
  const draggingElementRef = useRef<HTMLElement>(null);
  const droppableElementRefsPool = useRef<Record<string, IDroppableItem>>({});

  const stateRef = useRef<IReactOptimizedDndComponentState>({
    draggingElement: {
      ref: null,
      data: null,
    },
    overElement: {
      ref: null,
      data: null,
    },
  });

  const loop = () => {
    if (!draggingElementRef.current) return;
    const draggingRect = draggingElementRef.current.getBoundingClientRect();
    let intersectingDroppableItem: IDroppableItem | null = null;
    let latestDeltaDistance = Infinity;

    const keys = Object.keys(droppableElementRefsPool.current);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const droppableRef = droppableElementRefsPool.current[key];
      const isOver = droppableRef.isOver;

      if (!droppableRef.ref.current) continue;

      const droppableRect = droppableRef.ref.current.getBoundingClientRect();
      const isIntersecting =
        draggingRect.x < droppableRect.x + droppableRect.width &&
        draggingRect.x + draggingRect.width > droppableRect.x &&
        draggingRect.y < droppableRect.y + droppableRect.height &&
        draggingRect.y + draggingRect.height > droppableRect.y;

      const deltaX = draggingRect.x - droppableRect.x;
      const deltaY = draggingRect.y - droppableRect.y;
      const deltaDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (deltaDistance < latestDeltaDistance && isIntersecting) {
        latestDeltaDistance = deltaDistance;
        intersectingDroppableItem = droppableRef;
      }

      if (isOver) {
        droppableRef.subscriber({ isOver: false });
        droppableElementRefsPool.current[key].isOver = false;
      }
    }

    if (intersectingDroppableItem && !intersectingDroppableItem.isOver) {
      intersectingDroppableItem.subscriber({ isOver: true });
      intersectingDroppableItem.isOver = true;

      stateRef.current.overElement.ref = intersectingDroppableItem.ref;
      stateRef.current.overElement.data = intersectingDroppableItem.data;

      onDragOver?.(stateRef.current);
    }

    requestAnimationFrame(loop);
  };

  const setDraggingElement = (ref: RefObject<HTMLElement> | null, draggableElementData: any) => {
    if (!ref) {
      if (draggingElementRef.current) {
        draggingElementRef.current = null;

        for (const key in droppableElementRefsPool.current) {
          droppableElementRefsPool.current[key].subscriber({ isOver: false });
          droppableElementRefsPool.current[key].isOver = false;
        }

        onDragEnd?.(stateRef.current);

        stateRef.current.draggingElement.ref = null;
        stateRef.current.draggingElement.data = null;
        stateRef.current.overElement.ref = null;
        stateRef.current.overElement.data = null;
      }
    } else {
      draggingElementRef.current = ref.current;

      stateRef.current.draggingElement.ref = ref;
      stateRef.current.draggingElement.data = draggableElementData;

      onDragStart?.(stateRef.current);
      requestAnimationFrame(loop);
    }
  };

  return (
    <ReactOptimizedDndContext.Provider
      value={{
        draggingElementRef,
        droppableElementRefsPool,
        setDraggingElement,
      }}
    >
      {children}
    </ReactOptimizedDndContext.Provider>
  );
}

export { ReactOptimizedDndContext, ReactOptimizedDndProvider };
