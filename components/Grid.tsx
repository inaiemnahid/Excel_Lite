'use client';

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { SheetState, CellAddress } from '@/types/sheet';
import { useSelection } from '@/hooks/useSelection';
import { useGridMeasurements } from '@/hooks/useGridMeasurements';
import { cellKey, colToLetter } from '@/lib/a1';
import GridCell from './GridCell';
import ColumnHeader from './ColumnHeader';
import RowHeader from './RowHeader';

interface GridProps {
  state: SheetState;
  onUpdateCell: (addr: CellAddress, raw: string) => void;
  onUpdateSelection: (anchor: CellAddress, focus: CellAddress) => void;
  onStartEditing: (addr: CellAddress) => void;
  onStopEditing: (commit: boolean) => void;
  onUpdateDraft: (draft: string) => void;
  onUpdateColumnWidth: (col: number, width: number) => void;
  onUndo: () => void;
  onRedo: () => void;
}

export default function Grid({
  state,
  onUpdateCell,
  onUpdateSelection,
  onStartEditing,
  onStopEditing,
  onUpdateDraft,
  onUpdateColumnWidth,
  onUndo,
  onRedo,
}: GridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollPos, setScrollPos] = useState({ left: 0, top: 0 });
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  const selection = useSelection();
  const measurements = useGridMeasurements(state.cols, state.rows, state.columnWidths);

  // Update viewport size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setViewportSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollPos({
      left: target.scrollLeft,
      top: target.scrollTop,
    });
  }, []);

  // Get visible range
  const visibleRange = measurements.getVisibleRange(
    scrollPos.left,
    scrollPos.top,
    viewportSize.width,
    viewportSize.height
  );

  // Handle cell click
  const handleCellClick = useCallback(
    (addr: CellAddress, shiftKey: boolean) => {
      if (state.editing) {
        onStopEditing(true);
      }

      if (shiftKey) {
        // Extend selection
        onUpdateSelection(state.selection.anchor, addr);
      } else {
        // New selection
        onUpdateSelection(addr, addr);
      }
    },
    [state.editing, state.selection.anchor, onStopEditing, onUpdateSelection]
  );

  // Handle cell double click
  const handleCellDoubleClick = useCallback(
    (addr: CellAddress) => {
      onStartEditing(addr);
    },
    [onStartEditing]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const { focus, anchor } = state.selection;

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        onUndo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        onRedo();
        return;
      }

      // If editing, handle edit mode keys
      if (state.editing) {
        if (e.key === 'Enter') {
          e.preventDefault();
          onStopEditing(true);
          // Move down
          const newAddr = selection.moveSelection(focus, 'down', state.cols, state.rows, 0);
          onUpdateSelection(newAddr, newAddr);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          onStopEditing(false);
        } else if (e.key === 'Tab') {
          e.preventDefault();
          onStopEditing(true);
          // Move right or left
          const direction = e.shiftKey ? 'left' : 'right';
          const newAddr = selection.moveSelection(focus, direction, state.cols, state.rows, 0);
          onUpdateSelection(newAddr, newAddr);
        }
        return;
      }

      // Navigation mode
      if (e.key === 'Enter') {
        e.preventDefault();
        onStartEditing(focus);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onUpdateSelection(focus, focus); // Clear range to single cell
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const direction = e.shiftKey ? 'left' : 'right';
        const newAddr = selection.moveSelection(focus, direction, state.cols, state.rows, 0);
        if (e.shiftKey) {
          onUpdateSelection(newAddr, newAddr);
        } else {
          onUpdateSelection(newAddr, newAddr);
        }
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const dirMap: Record<string, 'up' | 'down' | 'left' | 'right'> = {
          ArrowUp: 'up',
          ArrowDown: 'down',
          ArrowLeft: 'left',
          ArrowRight: 'right',
        };
        const direction = dirMap[e.key];

        if (e.shiftKey) {
          // Extend selection
          const newSelection = selection.extendSelection(
            state.selection,
            direction,
            state.cols,
            state.rows
          );
          onUpdateSelection(newSelection.anchor, newSelection.focus);
        } else {
          // Move selection
          const newAddr = selection.moveSelection(focus, direction, state.cols, state.rows, 0);
          onUpdateSelection(newAddr, newAddr);
        }
      } else if (e.key === 'Home') {
        e.preventDefault();
        const newAddr = selection.moveSelection(focus, 'home', state.cols, state.rows, 0);
        onUpdateSelection(newAddr, newAddr);
      } else if (e.key === 'End') {
        e.preventDefault();
        const newAddr = selection.moveSelection(focus, 'end', state.cols, state.rows, 0);
        onUpdateSelection(newAddr, newAddr);
      } else if (e.key === 'PageUp') {
        e.preventDefault();
        const newAddr = selection.moveSelection(focus, 'pageup', state.cols, state.rows, 20);
        onUpdateSelection(newAddr, newAddr);
      } else if (e.key === 'PageDown') {
        e.preventDefault();
        const newAddr = selection.moveSelection(focus, 'pagedown', state.cols, state.rows, 20);
        onUpdateSelection(newAddr, newAddr);
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        // Start typing - enter edit mode
        e.preventDefault();
        onStartEditing(focus);
        onUpdateDraft(e.key);
      }
    },
    [
      state.selection,
      state.editing,
      state.cols,
      state.rows,
      selection,
      onStopEditing,
      onUpdateSelection,
      onStartEditing,
      onUpdateDraft,
      onUndo,
      onRedo,
    ]
  );

  // Render cells
  const renderCells = () => {
    const cells: React.ReactElement[] = [];
    
    for (let row = Math.max(0, visibleRange.startRow); row <= Math.min(state.rows - 1, visibleRange.endRow + 1); row++) {
      for (let col = Math.max(0, visibleRange.startCol); col <= Math.min(state.cols - 1, visibleRange.endCol + 1); col++) {
        const addr = { row, col };
        const key = cellKey(addr);
        const cell = state.cells.get(key);
        const isSelected = selection.isInSelection(addr, state.selection);
        const isActive = selection.isActiveCell(addr, state.selection);
        const isEditing = !!(state.editing && state.editing.addr.row === row && state.editing.addr.col === col);

        const left = measurements.getColumnOffset(col);
        const top = measurements.getRowOffset(row);
        const width = measurements.getColumnWidth(col);
        const height = measurements.getRowHeight();

        cells.push(
          <GridCell
            key={key}
            addr={addr}
            cell={cell}
            isSelected={isSelected}
            isActive={isActive}
            isEditing={isEditing}
            draft={isEditing ? state.editing!.draft : ''}
            left={left}
            top={top}
            width={width}
            height={height}
            onClick={handleCellClick}
            onDoubleClick={handleCellDoubleClick}
            onUpdateDraft={onUpdateDraft}
            onStopEditing={onStopEditing}
          />
        );
      }
    }

    return cells;
  };

  // Render column headers
  const renderColumnHeaders = () => {
    const headers: React.ReactElement[] = [];
    
    for (let col = Math.max(0, visibleRange.startCol); col <= Math.min(state.cols - 1, visibleRange.endCol + 1); col++) {
      const left = measurements.getColumnOffset(col);
      const width = measurements.getColumnWidth(col);

      headers.push(
        <ColumnHeader
          key={col}
          col={col}
          left={left}
          width={width}
          height={measurements.headerHeight}
          onResize={onUpdateColumnWidth}
        />
      );
    }

    return headers;
  };

  // Render row headers
  const renderRowHeaders = () => {
    const headers: React.ReactElement[] = [];
    
    for (let row = Math.max(0, visibleRange.startRow); row <= Math.min(state.rows - 1, visibleRange.endRow + 1); row++) {
      const top = measurements.getRowOffset(row);
      const height = measurements.getRowHeight();

      headers.push(
        <RowHeader
          key={row}
          row={row}
          top={top}
          width={measurements.headerWidth}
          height={height}
        />
      );
    }

    return headers;
  };

  return (
    <div
      ref={containerRef}
      className="spreadsheet-grid relative w-full h-full overflow-auto"
      onScroll={handleScroll}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="grid"
      aria-label="Spreadsheet grid"
    >
      {/* Corner cell */}
      <div
        className="col-header sticky top-0 left-0 z-30"
        style={{
          width: measurements.headerWidth,
          height: measurements.headerHeight,
        }}
      />

      {/* Column headers */}
      <div className="sticky top-0 z-20" style={{ height: measurements.headerHeight }}>
        {renderColumnHeaders()}
      </div>

      {/* Row headers */}
      <div className="sticky left-0 z-20" style={{ width: measurements.headerWidth }}>
        {renderRowHeaders()}
      </div>

      {/* Cells */}
      <div
        className="relative"
        style={{
          width: measurements.totalWidth,
          height: measurements.totalHeight,
        }}
      >
        {renderCells()}
      </div>
    </div>
  );
}
