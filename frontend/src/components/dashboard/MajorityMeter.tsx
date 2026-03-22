import React from 'react';
import type { StateSummary } from '../../types/dashboard';

interface Props { summary: StateSummary }

export default function MajorityMeter({ summary }: Props) {
  const { majorityProbability, projections } = summary;

  const items = [
    { party: 'TMC', prob: majorityProbability.TMC, color: '#20B2AA', seats: projections.TMC?.seats || 0 },
    { party: 'BJP', prob: majorityProbability.BJP, color: '#FF6B00', seats: projections.BJP?.seats || 0 },
    { party: 'Hung', prob: majorityProbability.hung, color: '#9CA3AF', seats: null }
  ];

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Majority Probability</h3>
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.party}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm font-medium text-gray-700">{item.party}</span>
                {item.seats !== null && <span className="text-xs text-gray-400">({item.seats} seats)</span>}
              </div>
              <span className="text-sm font-bold" style={{ color: item.color }}>
                {Math.round(item.prob * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all duration-700"
                style={{ width: `${item.prob * 100}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
