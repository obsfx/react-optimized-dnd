# react-optimized-dnd

A React package for building performant drag-and-drop interfaces. Provides context provider, hooks, and type definitions for flexible, optimized DnD in React apps.

## Features

- Simple API: Provider and hooks for drag-and-drop
- Optimized for React performance
- TypeScript support
- No external dependencies

## Installation

```
npm install react-optimized-dnd
```

or

```
yarn add react-optimized-dnd
```

## Usage Example

Below is a minimal Trello-like board with draggable cards and droppable columns.

```tsx
import { useState } from 'react';
import { ReactOptimizedDndProvider, useDraggable, useDroppable } from 'react-optimized-dnd';

const columnsData = [
  [
    { title: 'Card 1', description: 'Desc 1', color: '#60a5fa' },
    { title: 'Card 2', description: 'Desc 2', color: '#f59e42' },
  ],
  [{ title: 'Card 3', description: 'Desc 3', color: '#10b981' }],
  [{ title: 'Card 4', description: 'Desc 4', color: '#f43f5e' }],
];

function Card({ index, columnIndex, title, description, color }) {
  const { droppableRef, isOver } = useDroppable({ data: { index, columnIndex, type: 'card' } });
  const { handleRef, deltaPos, isDragging } = useDraggable({
    data: { index, columnIndex, type: 'card' },
  });
  return (
    <div
      ref={droppableRef}
      style={{
        border: isDragging ? '1px solid #e5e7eb' : '1px solid transparent',
        background: isDragging ? '#fafaf9' : 'white',
        borderRadius: 6,
      }}
    >
      <div
        ref={handleRef}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          background: isDragging ? '#93c5fd' : '#fff',
          borderRadius: 6,
          padding: 12,
          boxShadow: '0 1px 2px #0001',
          transform: `translate(${deltaPos.x}px, ${deltaPos.y}px)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: color,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
            }}
          >
            {title.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 500 }}>{title}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>{description}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Column({ children, index }) {
  const { droppableRef, isOver } = useDroppable({ data: { index, type: 'column' } });
  return (
    <div
      ref={droppableRef}
      style={{
        width: 280,
        background: '#f3f4f6',
        borderRadius: 8,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {children}
      {isOver && (
        <div
          style={{
            height: 48,
            background: '#dbeafe',
            border: '1px solid #bfdbfe',
            borderRadius: 6,
          }}
        />
      )}
    </div>
  );
}

export default function Example() {
  const [columns, setColumns] = useState(columnsData);
  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <ReactOptimizedDndProvider
        onDragStart={() => {}}
        onDragEnd={(state) => {
          const dragging = state.draggingElement.data;
          const over = state.overElement.data;
          if (!dragging || !over) return;
          if (over.type === 'card') {
            const newColumns = [...columns];
            const targetCol = over.columnIndex;
            const targetIdx = over.index;
            const dragCol = dragging.columnIndex;
            const dragIdx = dragging.index;
            const item = newColumns[dragCol][dragIdx];
            newColumns[dragCol] = newColumns[dragCol].filter((_, i) => i !== dragIdx);
            newColumns[targetCol].splice(targetIdx, 0, item);
            setColumns(newColumns);
            return;
          }
          if (over.type === 'column') {
            const newColumns = [...columns];
            const targetCol = over.index;
            const dragCol = dragging.columnIndex;
            const dragIdx = dragging.index;
            const item = newColumns[dragCol][dragIdx];
            newColumns[dragCol] = newColumns[dragCol].filter((_, i) => i !== dragIdx);
            newColumns[targetCol] = [...newColumns[targetCol], item];
            setColumns(newColumns);
            return;
          }
        }}
        onDragOver={() => {}}
      >
        {columns.map((column, columnIndex) => (
          <Column key={columnIndex} index={columnIndex}>
            {column.map((item, cardIndex) => (
              <Card key={cardIndex} index={cardIndex} columnIndex={columnIndex} {...item} />
            ))}
          </Column>
        ))}
      </ReactOptimizedDndProvider>
    </div>
  );
}
```

## API

### `ReactOptimizedDndProvider`

Wrap your app or a subtree to enable drag-and-drop. Accepts optional callbacks:

- `onDragStart: (state) => void`
- `onDragEnd: (state) => void`
- `onDragOver: (state) => void`

### `useDraggable`

Hook to make an element draggable.

- `data`: Any object to identify the draggable (required)
- Returns: `{ handleRef, deltaPos, isDragging }`

### `useDroppable`

Hook to make an element a drop target.

- `data`: Any object to identify the droppable (required)
- Returns: `{ droppableRef, isOver }`

## License

MIT
