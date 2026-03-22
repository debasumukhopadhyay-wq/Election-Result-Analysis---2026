import React, { useState } from 'react';
import type { CandidateScore, BoothSimulation } from '../../types/prediction';
import ImprovementReport from '../improvement/ImprovementReport';
import { FACTOR_LABELS } from '../../types/prediction';
import { usePredictionStore } from '../../store/predictionStore';

const PARTY_COLORS: Record<string, string> = {
  TMC: '#20B2AA', BJP: '#FF6B35', CPM: '#E63946', INC: '#2196F3',
  ISF: '#9C27B0', RSP: '#FF5722', CPI: '#795548', AIFB: '#607D8B', IND: '#9E9E9E',
};

function SwingRiskBar({ pct }: { pct: number }) {
  const color = pct >= 70 ? '#ef4444' : pct >= 45 ? '#f97316' : pct >= 25 ? '#eab308' : '#22c55e';
  const label = pct >= 70 ? 'Very High' : pct >= 45 ? 'High' : pct >= 25 ? 'Moderate' : 'Low';
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-semibold text-gray-700">Swing Risk</span>
        <span className="text-lg font-bold" style={{ color }}>{pct}% — {label}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3">
        <div className="h-3 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <p className="text-xs text-gray-400 mt-1">
        {pct >= 70 ? 'Result could easily flip with moderate ground-level changes'
          : pct >= 45 ? 'Competitive seat — significant campaign push can change outcome'
          : pct >= 25 ? 'Leader has an advantage but is not fully secure'
          : 'Winner has a strong lead; swing unlikely without major disruption'}
      </p>
    </div>
  );
}

interface Props {
  candidates: CandidateScore[];
  boothSimulation: BoothSimulation;
  constituencyId: string;
  constituencyName: string;
}

export default function SwingRiskPanel({ candidates, boothSimulation, constituencyId, constituencyName }: Props) {
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);
  const { contextText } = usePredictionStore();

  if (!candidates || candidates.length < 2) return null;

  const winner = candidates[0];
  const runnerUp = candidates[1];

  // ── Swing probability ──────────────────────────────────────────────────────
  const scoreMargin = winner.totalScore - runnerUp.totalScore;
  const voteMarginPct = Math.round((winner.predictedVoteShare - runnerUp.predictedVoteShare) * 100);
  const boothSwingPct = boothSimulation?.summary?.swingSensitivePercent ?? 0;

  // Swing risk: tighter margin = higher risk
  const rawRisk = Math.max(5, Math.min(95, Math.round(100 - scoreMargin * 4.5 + boothSwingPct * 0.3)));

  // ── High-level swing factors ───────────────────────────────────────────────
  // Factors where runner-up outscores or is within 5pts of winner
  const winnerFactors = winner.factorScores as Record<string, { score: number; weight: number }>;
  const ruFactors = runnerUp.factorScores as Record<string, { score: number; weight: number }>;

  interface SwingFactor {
    key: string;
    winnerScore: number;
    ruScore: number;
    gap: number;
    weight: number;
    ruLeads: boolean;
  }

  const swingFactors: SwingFactor[] = Object.keys(winnerFactors)
    .map(key => ({
      key,
      winnerScore: winnerFactors[key]?.score ?? 0,
      ruScore: ruFactors[key]?.score ?? 0,
      gap: (winnerFactors[key]?.score ?? 0) - (ruFactors[key]?.score ?? 0),
      weight: winnerFactors[key]?.weight ?? 0,
      ruLeads: (ruFactors[key]?.score ?? 0) > (winnerFactors[key]?.score ?? 0),
    }))
    .filter(f => f.gap < 8)  // close or runner-up leads
    .sort((a, b) => b.weight - a.weight)  // highest weight first
    .slice(0, 5);

  // Factors where runner-up has a clear advantage (potential to exploit)
  const ruStrengths: SwingFactor[] = Object.keys(winnerFactors)
    .map(key => ({
      key,
      winnerScore: winnerFactors[key]?.score ?? 0,
      ruScore: ruFactors[key]?.score ?? 0,
      gap: (winnerFactors[key]?.score ?? 0) - (ruFactors[key]?.score ?? 0),
      weight: winnerFactors[key]?.weight ?? 0,
      ruLeads: (ruFactors[key]?.score ?? 0) > (winnerFactors[key]?.score ?? 0),
    }))
    .filter(f => f.ruLeads && f.weight >= 3)
    .sort((a, b) => (b.ruScore - b.winnerScore) * b.weight - (a.ruScore - a.winnerScore) * a.weight)
    .slice(0, 4);

  return (
    <div className="card space-y-5">
      <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
        <span className="text-base">⚡</span> Swing Analysis — {constituencyName}
      </h3>

      {/* 1. Swing Risk */}
      <SwingRiskBar pct={rawRisk} />

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-xs text-gray-500">Score Margin</p>
          <p className="font-bold text-gray-800">{scoreMargin.toFixed(1)} pts</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-xs text-gray-500">Vote Gap</p>
          <p className="font-bold text-gray-800">{voteMarginPct}%</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-xs text-gray-500">Swing Booths</p>
          <p className="font-bold text-gray-800">{boothSwingPct}%</p>
        </div>
      </div>

      {/* 2. Swing-Influencing Factors */}
      <div>
        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
          Factors That Can Influence the Swing
        </h4>
        <div className="space-y-2">
          {swingFactors.map(f => (
            <div key={f.key} className="flex items-center gap-2">
              <div className="w-36 shrink-0">
                <span className="text-xs text-gray-700">{FACTOR_LABELS[f.key] || f.key}</span>
                <span className="text-xs text-gray-400 ml-1">(wt {f.weight})</span>
              </div>
              <div className="flex-1 relative h-4 bg-gray-100 rounded-full overflow-hidden">
                {/* winner bar */}
                <div className="absolute left-0 top-0 h-full rounded-full opacity-60"
                  style={{ width: `${f.winnerScore}%`, backgroundColor: PARTY_COLORS[winner.party] || '#888' }} />
                {/* runner-up bar */}
                <div className="absolute left-0 top-0 h-full rounded-full opacity-40 border-r-2"
                  style={{ width: `${f.ruScore}%`, backgroundColor: PARTY_COLORS[runnerUp.party] || '#555',
                    borderColor: f.ruLeads ? '#ef4444' : 'transparent' }} />
              </div>
              <div className="w-20 text-right shrink-0">
                {f.ruLeads
                  ? <span className="text-xs font-semibold text-red-600">{runnerUp.party} leads +{Math.abs(f.gap).toFixed(0)}</span>
                  : <span className="text-xs text-gray-400">Gap: {f.gap.toFixed(0)}</span>}
              </div>
            </div>
          ))}
        </div>
        {ruStrengths.length > 0 && (
          <p className="text-xs text-orange-600 mt-2 bg-orange-50 rounded p-2">
            <strong>{runnerUp.name} ({runnerUp.party})</strong> leads on{' '}
            {ruStrengths.map(f => FACTOR_LABELS[f.key] || f.key).join(', ')} —
            key areas where the challenger can close the gap.
          </p>
        )}
      </div>

      {/* 3. Per-Candidate Improvement Drill-Down */}
      <div>
        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
          How Each Candidate Can Change the Result
        </h4>
        <div className="space-y-2">
          {candidates.slice(0, 4).map((cand, idx) => {
            const isWinner = idx === 0;
            const isExpanded = expandedCandidate === cand.candidateId;
            const gap = isWinner ? 0 : Math.round((winner.totalScore - cand.totalScore) * 10) / 10;
            const isTBD = cand.name.includes('(TBD)');
            return (
              <div key={cand.candidateId} className="border border-gray-100 rounded-lg overflow-hidden">
                <button
                  type="button"
                  className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition-colors
                    ${isWinner ? 'bg-green-50' : 'bg-white'}`}
                  onClick={() => !isTBD && setExpandedCandidate(isExpanded ? null : cand.candidateId)}
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-10 text-center text-xs font-bold px-1 py-0.5 rounded"
                      style={{ backgroundColor: PARTY_COLORS[cand.party] || '#888', color: '#fff' }}>
                      {cand.party}
                    </span>
                    <span className="text-sm font-medium text-gray-800">{cand.name}</span>
                    {isWinner && <span className="text-xs text-green-600 font-semibold">● Leading</span>}
                    {!isWinner && !isTBD && (
                      <span className="text-xs text-gray-400">needs +{gap} pts</span>
                    )}
                    {isTBD && <span className="text-xs text-gray-400 italic">candidate TBD</span>}
                  </div>
                  {!isTBD && (
                    <span className="text-xs text-blue-600 shrink-0">
                      {isExpanded ? '▲ Close' : '▼ Improvement Report'}
                    </span>
                  )}
                </button>
                {isExpanded && !isTBD && (
                  <div className="border-t border-gray-100">
                    <ImprovementReport
                      constituencyId={constituencyId}
                      party={cand.party}
                      candidateName={cand.name}
                      contextText={contextText || undefined}
                      onClose={() => setExpandedCandidate(null)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
