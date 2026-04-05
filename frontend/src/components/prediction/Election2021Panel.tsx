import React from 'react';
import type { HistoricalData } from '../../types/prediction';

interface Props {
  data: HistoricalData;
  constituencyName: string;
}

const PARTY_COLORS: Record<string, string> = {
  TMC: '#20b2aa',
  BJP: '#ff6b35',
  CPM: '#dc2626',
  INC: '#2563eb',
  ISF: '#7c3aed',
  IND: '#6b7280',
};

const PARTY_BG: Record<string, string> = {
  TMC: '#f0fdfa',
  BJP: '#fff7ed',
  CPM: '#fef2f2',
  INC: '#eff6ff',
  ISF: '#f5f3ff',
  IND: '#f9fafb',
};

function partyColor(party: string) {
  return PARTY_COLORS[party] || '#6b7280';
}

export default function Election2021Panel({ data, constituencyName }: Props) {
  const election2021 = data.elections.find(e => e.year === 2021);

  if (!election2021) {
    return (
      <div className="card h-full flex items-center justify-center">
        <p className="text-gray-400 text-sm">2021 result data unavailable</p>
      </div>
    );
  }

  const winner = election2021.results.find(r => r.winner);
  const runnerUp = election2021.results[1];
  const topFour = election2021.results.filter(r => r.voteShare >= 0.03);

  const marginPct = winner && runnerUp
    ? Math.round((winner.voteShare - runnerUp.voteShare) * 100)
    : 0;

  return (
    <div className="card h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">2021 Assembly Election Result</h3>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
          Turnout {Math.round(election2021.turnout * 100)}%
        </span>
      </div>

      {/* Winner banner */}
      {winner && (
        <div
          className="rounded-lg p-3 mb-4 border"
          style={{ backgroundColor: PARTY_BG[winner.party] || '#f9fafb', borderColor: partyColor(winner.party) + '40' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-bold px-2 py-0.5 rounded text-white"
              style={{ backgroundColor: partyColor(winner.party) }}
            >
              {winner.party}
            </span>
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Winner</span>
          </div>
          <p className="font-bold text-gray-900 text-base">{winner.candidate}</p>
          <div className="flex gap-4 mt-1 text-xs">
            <span>
              <span className="font-bold text-gray-800">{Math.round(winner.voteShare * 100)}%</span>
              <span className="text-gray-400 ml-1">vote share</span>
            </span>
            <span>
              <span className="font-bold" style={{ color: partyColor(winner.party) }}>+{marginPct}%</span>
              <span className="text-gray-400 ml-1">margin over 2nd</span>
            </span>
          </div>
        </div>
      )}

      {/* Party-wise bars */}
      <div className="space-y-2 mb-4">
        {topFour.map((r) => (
          <div key={r.party} className="flex items-center gap-2 text-xs">
            <span
              className="w-10 text-center text-white font-bold rounded py-0.5 shrink-0"
              style={{ backgroundColor: partyColor(r.party), fontSize: '10px' }}
            >
              {r.party}
            </span>
            <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.round(r.voteShare * 100)}%`, backgroundColor: partyColor(r.party) }}
              />
            </div>
            <span className="w-8 text-right font-semibold text-gray-700">
              {Math.round(r.voteShare * 100)}%
            </span>
            {r.winner && <span className="text-green-600 font-bold">★</span>}
          </div>
        ))}
      </div>

      {/* Runner-up */}
      {runnerUp && (
        <div className="pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-0.5">Runner-up 2021</p>
          <p className="text-xs font-semibold text-gray-700">
            <span style={{ color: partyColor(runnerUp.party) }}>{runnerUp.party}</span>
            {' · '}{runnerUp.candidate}{' · '}{Math.round(runnerUp.voteShare * 100)}%
          </p>
        </div>
      )}
    </div>
  );
}
