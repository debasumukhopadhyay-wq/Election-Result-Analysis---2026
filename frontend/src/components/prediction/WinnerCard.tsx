import React from 'react';
import type { PredictedWinner } from '../../types/prediction';
import { PARTY_COLORS, PARTY_FULL_NAMES } from '../../types/constituency';
import ConfidenceBadge from '../shared/ConfidenceBadge';

interface Props {
  winner: PredictedWinner;
  confidenceScore: number;
  constituencyName: string;
}

export default function WinnerCard({ winner, confidenceScore, constituencyName }: Props) {
  const color = PARTY_COLORS[winner.party] || '#6B7280';

  return (
    <div className="card" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Predicted Winner — {constituencyName}</p>
          <h2 className="text-2xl font-bold text-gray-900">{winner.name}</h2>
          <p className="text-sm text-gray-600 mt-0.5">{PARTY_FULL_NAMES[winner.party] || winner.party}</p>
        </div>
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg"
          style={{ backgroundColor: color }}
        >
          {winner.party}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{Math.round(winner.predictedVoteShare * 100)}%</p>
          <p className="text-xs text-gray-500 mt-1">Vote Share</p>
        </div>
        <div className="text-center border-x border-gray-100">
          <p className="text-2xl font-bold text-gray-900">{Math.round(winner.winProbability * 100)}%</p>
          <p className="text-xs text-gray-500 mt-1">Win Probability</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{winner.margin.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Est. Margin</p>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-gray-100">
        <ConfidenceBadge score={confidenceScore} />
      </div>
    </div>
  );
}
