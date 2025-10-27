'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { SheetState, Cell, CellAddress } from '@/types/sheet';
import { cellKey } from '@/lib/a1';
import { DependencyGraph } from '@/lib/graph';
import { useLocalStorage, SerializedSheet } from '@/hooks/useLocalStorage';
import { useFormulaEngine } from '@/hooks/useFormulaEngine';
import { useA11yAnnouncer } from '@/hooks/useA11yAnnouncer';
import Grid from './Grid';
import FormulaBar from './FormulaBar';
import Inspector from './Inspector';

const COLS = 50; // A-AX
const ROWS = 100; // 1-100
const DEFAULT_COL_WIDTH = 100;

// Undo/Redo stack
interface HistoryEntry {
  cells: Map<string, Cell>;
  columnWidths: number[];
}

export default function SheetApp() {
  // Dependency graph for formulas
  const dependencyGraphRef = useRef(new DependencyGraph());
  
  // Initialize state
  const [state, setState] = useState<SheetState>(() => {
    const columnWidths = Array(COLS).fill(DEFAULT_COL_WIDTH);
    return {
      cols: COLS,
      rows: ROWS,
      cells: new Map(),
      selection: { anchor: { col: 0, row: 0 }, focus: { col: 0, row: 0 } },
      columnWidths,
    };
  });

  // Undo/Redo stacks
  const [undoStack, setUndoStack] = useState<HistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryEntry[]>([]);

  // Hooks
  const { loadState, clearState, exportState, importState } = useLocalStorage(state);
  const { announce } = useA11yAnnouncer();
  const { processCell, recalculateDependents } = useFormulaEngine(
    state.cells,
    dependencyGraphRef.current
  );

  // Load initial state from localStorage
  useEffect(() => {
    const loaded = loadState();
    if (loaded) {
      const cellsMap = new Map<string, Cell>();
      Object.entries(loaded.cells).forEach(([key, cell]) => {
        cellsMap.set(key, cell);
      });

      setState({
        cols: loaded.cols,
        rows: loaded.rows,
        cells: cellsMap,
        selection: { anchor: { col: 0, row: 0 }, focus: { col: 0, row: 0 } },
        columnWidths: loaded.columnWidths.length > 0 ? loaded.columnWidths : Array(COLS).fill(DEFAULT_COL_WIDTH),
      });
    }
  }, []); // Only on mount

  // Save to history before mutation
  const saveHistory = useCallback(() => {
    setUndoStack(prev => [
      ...prev,
      {
        cells: new Map(state.cells),
        columnWidths: [...state.columnWidths],
      },
    ]);
    setRedoStack([]); // Clear redo stack on new action
  }, [state.cells, state.columnWidths]);

  // Update a cell
  const updateCell = useCallback(
    (addr: CellAddress, raw: string) => {
      saveHistory();

      const key = cellKey(addr);
      const newCell = processCell(raw, addr);
      
      // Update cell
      const newCells = new Map(state.cells);
      if (newCell.kind === 'empty') {
        newCells.delete(key);
        dependencyGraphRef.current.removeCell(key);
      } else {
        newCells.set(key, newCell);
      }

      // Recalculate dependents
      const updatedCells = recalculateDependents([key]);
      updatedCells.forEach((cell, k) => {
        newCells.set(k, cell);
      });

      setState(prev => ({ ...prev, cells: newCells }));

      // Announce if error
      if (newCell.error) {
        announce(`Cell has error: ${newCell.error}`, 'assertive');
      }
    },
    [state.cells, saveHistory, processCell, recalculateDependents, announce]
  );

  // Update selection
  const updateSelection = useCallback((anchor: CellAddress, focus: CellAddress) => {
    setState(prev => ({
      ...prev,
      selection: { anchor, focus },
    }));
  }, []);

  // Start editing
  const startEditing = useCallback((addr: CellAddress) => {
    const key = cellKey(addr);
    const cell = state.cells.get(key);
    const draft = cell?.raw || '';

    setState(prev => ({
      ...prev,
      editing: { addr, draft },
    }));
  }, [state.cells]);

  // Stop editing
  const stopEditing = useCallback((commit: boolean) => {
    if (!state.editing) return;

    if (commit) {
      updateCell(state.editing.addr, state.editing.draft);
    }

    setState(prev => ({
      ...prev,
      editing: undefined,
    }));
  }, [state.editing, updateCell]);

  // Update draft during editing
  const updateDraft = useCallback((draft: string) => {
    setState(prev => ({
      ...prev,
      editing: prev.editing ? { ...prev.editing, draft } : undefined,
    }));
  }, []);

  // Update column width
  const updateColumnWidth = useCallback(
    (col: number, width: number) => {
      saveHistory();

      const newWidths = [...state.columnWidths];
      newWidths[col] = Math.max(50, width); // Minimum width

      setState(prev => ({
        ...prev,
        columnWidths: newWidths,
      }));
    },
    [state.columnWidths, saveHistory]
  );

  // Undo
  const undo = useCallback(() => {
    if (undoStack.length === 0) return;

    const entry = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [
      ...prev,
      {
        cells: new Map(state.cells),
        columnWidths: [...state.columnWidths],
      },
    ]);

    setState(prev => ({
      ...prev,
      cells: new Map(entry.cells),
      columnWidths: [...entry.columnWidths],
    }));

    announce('Undo', 'polite');
  }, [undoStack, state.cells, state.columnWidths, announce]);

  // Redo
  const redo = useCallback(() => {
    if (redoStack.length === 0) return;

    const entry = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [
      ...prev,
      {
        cells: new Map(state.cells),
        columnWidths: [...state.columnWidths],
      },
    ]);

    setState(prev => ({
      ...prev,
      cells: new Map(entry.cells),
      columnWidths: [...entry.columnWidths],
    }));

    announce('Redo', 'polite');
  }, [redoStack, state.cells, state.columnWidths, announce]);

  // Reset sheet
  const resetSheet = useCallback(() => {
    if (confirm('Are you sure you want to reset the sheet? This will clear all data.')) {
      saveHistory();
      clearState();
      setState({
        cols: COLS,
        rows: ROWS,
        cells: new Map(),
        selection: { anchor: { col: 0, row: 0 }, focus: { col: 0, row: 0 } },
        columnWidths: Array(COLS).fill(DEFAULT_COL_WIDTH),
      });
      dependencyGraphRef.current.clear();
      announce('Sheet reset', 'polite');
    }
  }, [clearState, saveHistory, announce]);

  // Export/Import
  const handleExport = useCallback(() => {
    const json = exportState(state);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spreadsheet-export.json';
    a.click();
    URL.revokeObjectURL(url);
    announce('Exported successfully', 'polite');
  }, [state, exportState, announce]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const json = ev.target?.result as string;
        const imported = importState(json);
        if (imported) {
          saveHistory();
          setState(imported);
          announce('Imported successfully', 'polite');
        } else {
          announce('Import failed: Invalid file format', 'assertive');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [importState, saveHistory, announce]);

  // Get active cell
  const activeCell = useMemo(() => {
    const key = cellKey(state.selection.focus);
    return state.cells.get(key);
  }, [state.cells, state.selection.focus]);

  return (
    <div className="flex flex-col h-screen">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-300 p-2 flex gap-2 items-center">
        <h1 className="text-lg font-bold mr-4">Spreadsheet-Lite</h1>
        <button
          onClick={undo}
          disabled={undoStack.length === 0}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Undo (Ctrl+Z)"
        >
          Undo
        </button>
        <button
          onClick={redo}
          disabled={redoStack.length === 0}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Redo (Ctrl+Y)"
        >
          Redo
        </button>
        <div className="flex-1" />
        <button
          onClick={handleExport}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Export
        </button>
        <button
          onClick={handleImport}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Import
        </button>
        <button
          onClick={resetSheet}
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Reset
        </button>
      </div>

      {/* Formula Bar */}
      <FormulaBar
        activeCell={activeCell}
        selection={state.selection}
        isEditing={!!state.editing}
        draft={state.editing?.draft || ''}
        onUpdateDraft={updateDraft}
        onStartEdit={() => startEditing(state.selection.focus)}
        onStopEdit={stopEditing}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Grid */}
        <div className="flex-1">
          <Grid
            state={state}
            onUpdateCell={updateCell}
            onUpdateSelection={updateSelection}
            onStartEditing={startEditing}
            onStopEditing={stopEditing}
            onUpdateDraft={updateDraft}
            onUpdateColumnWidth={updateColumnWidth}
            onUndo={undo}
            onRedo={redo}
          />
        </div>

        {/* Inspector */}
        <div className="w-64 border-l border-gray-300 bg-white overflow-y-auto">
          <Inspector activeCell={activeCell} selection={state.selection} />
        </div>
      </div>
    </div>
  );
}
