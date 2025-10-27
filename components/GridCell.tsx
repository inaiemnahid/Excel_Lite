'use client';

import React, { memo } from 'react';
import { Cell, CellAddress } from '@/types/sheet';

interface GridCellProps {
  addr: CellAddress;
  cell?: Cell;
  isSelected: boolean;
  isActive: boolean;
  isEditing: boolean;
  draft: string;
  left: number;
  top: number;
  width: number;
  height: number;
  onClick: (addr: CellAddress, shiftKey: boolean) => void;
  onDoubleClick: (addr: CellAddress) => void;
  onUpdateDraft: (draft: string) => void;
  onStopEditing: (commit: boolean) => void;
}

const GridCell = memo(function GridCell({
  addr,
  cell,
  isSelected,
  isActive,
  isEditing,
  draft,
  left,
  top,
  width,
  height,
  onClick,
  onDoubleClick,
  onUpdateDraft,
  onStopEditing,
}: GridCellProps) {
  const handleClick = (e: React.MouseEvent) => {
    onClick(addr, e.shiftKey);
  };

  const handleDoubleClick = () => {
    onDoubleClick(addr);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onStopEditing(true);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onStopEditing(false);
    }
  };

  const className = [
    'grid-cell absolute',
    isSelected && 'cell-selected',
    isActive && 'cell-focus-ring',
    isEditing && 'cell-editing',
    cell?.error && 'cell-error',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={className}
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      role="gridcell"
      aria-selected={isSelected}
      tabIndex={isActive ? 0 : -1}
    >
      {isEditing ? (
        <input
          type="text"
          value={draft}
          onChange={(e) => onUpdateDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => onStopEditing(true)}
          autoFocus
          className="w-full h-full px-2 border-0 outline-none bg-transparent"
          aria-label={`Editing cell`}
        />
      ) : (
        <span className="block truncate">{cell?.display || ''}</span>
      )}
    </div>
  );
});

export default GridCell;
