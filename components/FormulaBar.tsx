'use client';

import React from 'react';
import { Cell, SelectionRange } from '@/types/sheet';
import { addressToA1 } from '@/lib/a1';

interface FormulaBarProps {
  activeCell?: Cell;
  selection: SelectionRange;
  isEditing: boolean;
  draft: string;
  onUpdateDraft: (draft: string) => void;
  onStartEdit: () => void;
  onStopEdit: (commit: boolean) => void;
}

export default function FormulaBar({
  activeCell,
  selection,
  isEditing,
  draft,
  onUpdateDraft,
  onStartEdit,
  onStopEdit,
}: FormulaBarProps) {
  const activeAddress = addressToA1(selection.focus);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onStopEdit(true);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onStopEdit(false);
    }
  };

  return (
    <div className="formula-bar">
      <div className="font-semibold text-sm w-16">{activeAddress}</div>
      <input
        type="text"
        value={isEditing ? draft : activeCell?.raw || ''}
        onChange={(e) => onUpdateDraft(e.target.value)}
        onFocus={onStartEdit}
        onKeyDown={handleKeyDown}
        placeholder="Enter value or formula (=)"
        className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Formula bar"
      />
    </div>
  );
}
