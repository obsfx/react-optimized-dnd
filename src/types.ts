export interface IDroppableItem {
  ref: React.RefObject<HTMLElement>;
  subscriber: (data: any) => void;
  isOver?: boolean;
  data?: any;
}

export interface IReactOptimizedDndContextState {
  draggingElementRef: React.RefObject<HTMLElement | null>;
  setDraggingElement: (
    ref: React.RefObject<HTMLElement> | null,
    draggableElementData: any
  ) => void;
  droppableElementRefsPool: React.RefObject<Record<string, IDroppableItem>>;
}

export interface IReactOptimizedDndComponentState {
  draggingElement: {
    ref: React.RefObject<HTMLElement> | null;
    data: any;
  };
  overElement: {
    ref: React.RefObject<HTMLElement> | null;
    data: any;
  };
}

export interface UseDraggableProps {
  data?: any;
  dragThreshold?: number;
}

export interface UseDroppableProps {
  data?: any;
} 