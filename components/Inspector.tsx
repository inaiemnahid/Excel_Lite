'use client';

import React from 'react';
import { Cell, SelectionRange } from '@/types/sheet';
import { addressToA1 } from '@/lib/a1';

interface InspectorProps {
  activeCell?: Cell;
  selection: SelectionRange;
}

export default function Inspector({ activeCell, selection }: InspectorProps) {
  const activeAddress = addressToA1(selection.focus);

  return (
    <div className="inspector p-4">
      <h2 className="text-lg font-bold mb-4">Cell Inspector</h2>

      <div className="space-y-3">
        <div>
          <div className="text-xs text-gray-600 font-semibold">Address</div>
          <div className="text-sm font-mono">{activeAddress}</div>
        </div>

        <div>
          <div className="text-xs text-gray-600 font-semibold">Type</div>
          <div className="text-sm capitalize">{activeCell?.kind || 'empty'}</div>
        </div>

        {activeCell?.raw && (
          <div>
            <div className="text-xs text-gray-600 font-semibold">Raw Value</div>
            <div className="text-sm font-mono break-words">{activeCell.raw}</div>
          </div>
        )}

        {activeCell?.display && (
          <div>
            <div className="text-xs text-gray-600 font-semibold">Display</div>
            <div className="text-sm break-words">{activeCell.display}</div>
          </div>
        )}

        {activeCell?.value !== undefined && (
          <div>
            <div className="text-xs text-gray-600 font-semibold">Computed Value</div>
            <div className="text-sm font-mono">{activeCell.value}</div>
          </div>
        )}

        {activeCell?.error && (
          <div>
            <div className="text-xs text-red-600 font-semibold">Error</div>
            <div className="text-sm text-red-600 break-words">{activeCell.error}</div>
          </div>
        )}

        <div className="pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-600 font-semibold mb-2">Selection</div>
          <div className="text-xs space-y-1">
            <div>
              Anchor: {addressToA1(selection.anchor)}
            </div>
            <div>
              Focus: {addressToA1(selection.focus)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
