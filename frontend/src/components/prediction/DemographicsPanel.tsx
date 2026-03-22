import React from 'react';
import type { DemographicsData } from '../../types/prediction';

interface Props {
  data: DemographicsData;
  constituencyName: string;
}

const PARTY_COLORS: Record<string, string> = {
  hindu:    '#f97316',
  muslim:   '#16a34a',
  christian:'#3b82f6',
  other:    '#a855f7',
};

const CASTE_COLORS: Record<string, string> = {
  sc:      '#ef4444',
  st:      '#f59e0b',
  obc:     '#8b5cf6',
  general: '#6b7280',
};

function Bar({ value, color, label }: { value: number; color: string; label: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-20 text-right text-gray-500 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
        <div
          className="h-full rounded-full flex items-center pl-1 text-white font-semibold"
          style={{ width: `${Math.max(pct, 4)}%`, backgroundColor: color, fontSize: '10px' }}
        >
          {pct >= 8 ? `${pct}%` : ''}
        </div>
      </div>
      <span className="w-8 text-gray-700 font-semibold">{pct}%</span>
    </div>
  );
}

export default function DemographicsPanel({ data, constituencyName }: Props) {
  const { religion, caste, urbanRural, literacyRate, primaryOccupation } = data;

  return (
    <div className="card h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Voter Demographics</h3>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded capitalize">
          {primaryOccupation}
        </span>
      </div>

      {/* Religion */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Religion</p>
        <div className="space-y-1.5">
          <Bar value={religion.hindu}    color={PARTY_COLORS.hindu}    label="Hindu" />
          <Bar value={religion.muslim}   color={PARTY_COLORS.muslim}   label="Muslim" />
          <Bar value={religion.christian}color={PARTY_COLORS.christian} label="Christian" />
          {religion.other > 0.01 && (
            <Bar value={religion.other}  color={PARTY_COLORS.other}    label="Other" />
          )}
        </div>
      </div>

      {/* Caste */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Social Category</p>
        <div className="space-y-1.5">
          <Bar value={caste.general} color={CASTE_COLORS.general} label="General" />
          <Bar value={caste.obc}     color={CASTE_COLORS.obc}     label="OBC" />
          <Bar value={caste.sc}      color={CASTE_COLORS.sc}      label="SC" />
          <Bar value={caste.st}      color={CASTE_COLORS.st}      label="ST" />
        </div>
      </div>

      {/* Urban/Rural + Literacy */}
      <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-400 mb-1">Urban / Rural</p>
          <div className="flex gap-1 text-xs">
            <span className="font-bold text-blue-600">{Math.round(urbanRural.urban * 100)}%</span>
            <span className="text-gray-400">Urban</span>
            <span className="text-gray-300 mx-0.5">·</span>
            <span className="font-bold text-green-700">{Math.round(urbanRural.rural * 100)}%</span>
            <span className="text-gray-400">Rural</span>
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Literacy Rate</p>
          <span className="font-bold text-gray-800 text-sm">{Math.round(literacyRate * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
