import React from 'react';
import type { DistrictBreakdown } from '../../types/dashboard';
import { PARTY_COLORS } from '../../types/constituency';

interface Props {
  districts: DistrictBreakdown[];
  selected: string | null;
  onSelect: (district: string | null) => void;
}

export default function DistrictFilter({ districts, selected, onSelect }: Props) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">District Breakdown</h3>
        {selected && (
          <button type="button" onClick={() => onSelect(null)} className="text-xs text-blue-600 hover:underline">
            Clear filter
          </button>
        )}
      </div>
      <div className="space-y-1 max-h-80 overflow-y-auto">
        {districts.slice(0, 25).map(d => {
          const leadingParty = Object.entries(d.partySeats).sort((a, b) => b[1] - a[1])[0];
          return (
            <button
              key={d.district}
              type="button"
              onClick={() => onSelect(d.district === selected ? null : d.district)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                d.district === selected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
              }`}
            >
              <span className="font-medium text-gray-700">{d.district}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{d.seats} seats</span>
                {leadingParty && (
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: PARTY_COLORS[leadingParty[0]] || '#6B7280' }}
                  >
                    {leadingParty[0]} {leadingParty[1]}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
