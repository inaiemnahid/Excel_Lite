'use client';

import React, { useState, useRef } from 'react';
import { colToLetter } from '@/lib/a1';

interface ColumnHeaderProps {
  col: number;
  left: number;
  width: number;
  height: number;
  onResize: (col: number, width: number) => void;
}

export default function ColumnHeader({
  col,
  left,
  width,
  height,
  onResize,
}: ColumnHeaderProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState(0);
  const [initialWidth, setInitialWidth] = useState(0);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeStart(e.clientX);
    setInitialWidth(width);
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing) return;
    const delta = e.clientX - resizeStart;
    const newWidth = Math.max(50, initialWidth + delta);
    onResize(col, newWidth);
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, resizeStart, initialWidth]);

  return (
    <div
      className="col-header absolute"
      style={{
        left: `${left}px`,
        width: `${width}px`,
        height: `${height}px`,
      }}
      role="columnheader"
    >
      <span>{colToLetter(col)}</span>
      <div
        className="resize-handle absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-500"
        onMouseDown={handleResizeStart}
      />
    </div>
  );
}
