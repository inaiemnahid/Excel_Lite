'use client';

import React from 'react';

interface RowHeaderProps {
  row: number;
  top: number;
  width: number;
  height: number;
}

export default function RowHeader({ row, top, width, height }: RowHeaderProps) {
  return (
    <div
      className="row-header absolute"
      style={{
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
      }}
      role="rowheader"
    >
      {row + 1}
    </div>
  );
}
