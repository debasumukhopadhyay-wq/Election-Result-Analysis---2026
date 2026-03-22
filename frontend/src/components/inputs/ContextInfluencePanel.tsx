import React from 'react';
import type { ContextSignal } from '../../types/prediction';
import { FACTOR_LABELS } from '../../types/prediction';

const PARTY_COLORS: Record<string, string> = {
  TMC: '#20B2AA', BJP: '#FF6B35', CPM: '#E63946', INC: '#2196F3',
  ISF: '#9C27B0', RSP: '#FF5722', CPI: '#795548', AIFB: '#607D8B', IND: '#9E9E9E',
};

interface Props {
  signals: ContextSignal[];
}

export default function ContextInfluencePanel({ signals }: Props) {
  if (!signals || signals.length === 0) return null;

  // Group by direction for summary
  const positive = signals.filter(s => s.direction === 'positive');
  const negative = signals.filter(s => s.direction === 'negative');

  // Aggregate total score delta per party
  const partyTotals: Record<string, number> = {};
  signals.forEach(s => {
    partyTotals[s.party] = (partyTotals[s.party] || 0) + s.scoreDelta;
  });

  return (
    <div className="border border-blue-200 rounded-lg bg-blue-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 border-b border-blue-200">
        <span className="text-blue-700 text-sm font-semibold">Context Influence Analysis</span>
        <span className="text-xs text-blue-500 ml-auto">
          {signals.length} signal{signals.length !== 1 ? 's' : ''} detected
        </span>
      </div>

      {/* Party impact summary bar */}
      <div className="px-3 py-2 border-b border-blue-100 flex flex-wrap gap-2">
        {Object.entries(partyTotals).map(([party, delta]) => (
          <div key={party} className="flex items-center gap-1.5 bg-white rounded-full px-2 py-0.5 border border-gray-100 shadow-sm">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PARTY_COLORS[party] || '#888' }} />
            <span className="text-xs font-semibold text-gray-700">{party}</span>
            <span className={`text-xs font-bold ${delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)} pts
            </span>
          </div>
        ))}
      </div>

      {/* Signal list */}
      <div className="divide-y divide-blue-100">
        {signals.map((s, i) => (
          <div key={i} className="px-3 py-2.5 flex gap-2.5 items-start">
            {/* Direction indicator */}
            <div className={`shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold
              ${s.direction === 'positive' ? 'bg-green-500' : 'bg-red-500'}`}>
              {s.direction === 'positive' ? '▲' : '▼'}
            </div>

            <div className="flex-1 min-w-0">
              {/* Signal label + party badge + delta */}
              <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                <span className="inline-block text-xs font-bold px-1.5 py-0.5 rounded text-white"
                  style={{ backgroundColor: PARTY_COLORS[s.party] || '#888' }}>
                  {s.party}
                </span>
                <span className="text-xs font-semibold text-gray-800">{s.label}</span>
                <span className={`text-xs font-bold ml-auto shrink-0 ${s.scoreDelta >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {s.scoreDelta >= 0 ? '+' : ''}{s.scoreDelta} pts
                </span>
              </div>

              {/* Reason */}
              <p className="text-xs text-gray-600 leading-snug mb-1">{s.reason}</p>

              {/* Affected factors */}
              <div className="flex flex-wrap gap-1">
                {s.factors.map(f => (
                  <span key={f} className="text-xs bg-white border border-gray-200 text-gray-500 rounded px-1.5 py-0.5">
                    {FACTOR_LABELS[f] || f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div className="px-3 py-1.5 bg-blue-50 border-t border-blue-100">
        <p className="text-xs text-blue-500">
          Score adjustments are factor-weighted — signals affecting high-weight factors (Booth Network wt 8, Caste Equation wt 9, Momentum wt 6) have larger impact on final prediction.
        </p>
      </div>
    </div>
  );
}
