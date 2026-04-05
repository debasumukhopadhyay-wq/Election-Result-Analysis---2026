import React from 'react';
import type { CandidateScore, PredictedWinner, HistoricalData } from '../../types/prediction';
import { FACTOR_LABELS } from '../../types/prediction';

interface Props {
  predictedWinner: PredictedWinner;
  allCandidates: CandidateScore[];
  historicalData: HistoricalData;
}

const PARTY_COLORS: Record<string, string> = {
  TMC: '#20b2aa', BJP: '#ff6b35', CPM: '#dc2626',
  INC: '#2563eb', ISF: '#7c3aed', IND: '#6b7280',
};

function partyColor(p: string) { return PARTY_COLORS[p] || '#6b7280'; }

function PartyBadge({ party }: { party: string }) {
  return (
    <span className="inline-block text-xs font-bold px-2 py-0.5 rounded text-white"
      style={{ backgroundColor: partyColor(party) }}>
      {party}
    </span>
  );
}

interface Reason { title: string; detail: string; metric?: string }

function buildReasons(
  winner2026: PredictedWinner,
  winner2021Party: string,
  winner2021Candidate: string,
  winner2021Share: number,
  winner2021Margin: number,
  allCandidates: CandidateScore[],
): Reason[] {
  const reasons: Reason[] = [];
  const incumbent = allCandidates.find(c => c.party === winner2021Party);
  const challenger = allCandidates.find(c => c.party === winner2026.party);

  // ── 1. Anti-incumbency ───────────────────────────────────────────────────
  if (incumbent) {
    const aiScore = incumbent.factorScores.antiIncumbency?.score ?? 50;
    const risk = aiScore < 40 ? 'Very High' : aiScore < 55 ? 'High' : 'Moderate';
    reasons.push({
      title: `Anti-Incumbency Against ${winner2021Party}`,
      detail: `${winner2021Candidate} (${winner2021Party}) won in 2021 but now faces ${risk.toLowerCase()} anti-incumbency pressure. ` +
        `After 5 years, voter frustration with delivery gaps typically erodes the incumbent's base. ` +
        `${winner2026.name} (${winner2026.party}) is benefiting from a strong challenger wave.`,
      metric: `Anti-incumbency score: ${(aiScore / 10).toFixed(1)}/10 (lower = stronger against incumbent)`
    });
  }

  // ── 2. Key factor differentiators (top 2 gaps) ───────────────────────────
  if (incumbent && challenger) {
    const factorKeys = Object.keys(challenger.factorScores) as (keyof typeof challenger.factorScores)[];
    const gaps = factorKeys.map(f => ({
      key: f,
      label: FACTOR_LABELS[f] || f,
      challengerScore: challenger.factorScores[f]?.score ?? 0,
      incumbentScore: incumbent.factorScores[f]?.score ?? 0,
      diff: (challenger.factorScores[f]?.score ?? 0) - (incumbent.factorScores[f]?.score ?? 0),
    })).sort((a, b) => b.diff - a.diff);

    const topGap = gaps[0];
    const secondGap = gaps[1];

    if (topGap && topGap.diff > 5) {
      reasons.push({
        title: `${winner2026.party} Dominates on ${topGap.label}`,
        detail: `${winner2026.name} scores ${(topGap.challengerScore / 10).toFixed(1)}/10 on ${topGap.label}, ` +
          `compared to ${incumbent.name}'s ${(topGap.incumbentScore / 10).toFixed(1)}/10. ` +
          `This ${(topGap.diff / 10).toFixed(1)}-point advantage is translating directly into vote share gains for ${winner2026.party}.`,
        metric: `Gap: +${(topGap.diff / 10).toFixed(1)} pts in favour of ${winner2026.party}`
      });
    }

    if (secondGap && secondGap.diff > 5) {
      reasons.push({
        title: `${winner2021Party} Weakness: ${secondGap.label}`,
        detail: `${incumbent.name} (${winner2021Party}) scores only ${(secondGap.incumbentScore / 10).toFixed(1)}/10 on ` +
          `${secondGap.label}, a critical factor in this constituency. ` +
          `This structural weakness allows ${winner2026.party} to consolidate voters who are dissatisfied with ${winner2021Party}'s performance.`,
        metric: `${winner2021Party} score: ${(secondGap.incumbentScore / 10).toFixed(1)}/10 vs ${winner2026.party}: ${(secondGap.challengerScore / 10).toFixed(1)}/10`
      });
    }
  }

  // ── 3. Narrow 2021 victory / momentum ────────────────────────────────────
  const marginVotes = winner2021Margin;
  const marginPct   = Math.round(winner2021Share * 100);
  const isNarrow    = winner2021Share < 0.52;
  if (isNarrow) {
    reasons.push({
      title: `2021 Victory Was Narrow — Seat Was Always Contestable`,
      detail: `${winner2021Candidate} won in 2021 with just ${marginPct}% vote share and a margin of ~${marginVotes.toLocaleString()} votes. ` +
        `A narrow win signals a divided electorate. A relatively small swing of even 3–5% can flip this seat — ` +
        `and the 25-factor model shows enough ground-level movement to tip it in favour of ${winner2026.party}.`,
      metric: `2021 margin: ~${marginVotes.toLocaleString()} votes (${marginPct}% share)`
    });
  } else {
    // Booth network / organisational reason as fallback
    if (challenger && incumbent) {
      const boothAdv = (challenger.factorScores.boothNetwork?.score ?? 0) - (incumbent.factorScores.boothNetwork?.score ?? 0);
      const cBoothScore = challenger.factorScores.boothNetwork?.score ?? 0;
      const iBoothScore = incumbent.factorScores.boothNetwork?.score ?? 0;
      reasons.push({
        title: `${winner2026.party}'s Superior Ground & Booth Network`,
        detail: `${winner2026.party}'s booth-level machinery in this constituency has grown significantly since 2021. ` +
          `${winner2026.name}'s booth network score (${(cBoothScore / 10).toFixed(1)}/10) ` +
          `outperforms ${incumbent.name}'s (${(iBoothScore / 10).toFixed(1)}/10), enabling ` +
          `superior voter mobilisation and election-day logistics.`,
        metric: `Booth network advantage: ${boothAdv >= 0 ? '+' : ''}${(boothAdv / 10).toFixed(1)} pts for ${winner2026.party}`
      });
    }
  }

  // ── 5. Leadership / candidate quality ────────────────────────────────────
  if (challenger && incumbent) {
    const cScore = challenger.totalScore;
    const iScore = incumbent.totalScore;
    const diff   = cScore - iScore;
    reasons.push({
      title: `Candidate Quality: ${winner2026.name} Outscores ${incumbent.name}`,
      detail: `Across all 25 prediction factors, ${winner2026.name} (${winner2026.party}) achieves an overall score of ` +
        `${(cScore / 10).toFixed(1)}/10 vs ${incumbent.name} (${winner2021Party})'s ${(iScore / 10).toFixed(1)}/10. ` +
        `${winner2026.name}'s stronger community presence, oratory, and local issue alignment collectively explain ` +
        `why the model projects a ${Math.round(winner2026.predictedVoteShare * 100)}% vote share for ${winner2026.party} this cycle.`,
      metric: `Overall score gap: ${diff >= 0 ? '+' : ''}${(diff / 10).toFixed(1)} in favour of ${winner2026.party}`
    });
  }

  return reasons.slice(0, 5);
}

export default function PartyChangePanel({ predictedWinner, allCandidates, historicalData }: Props) {
  const election2021 = historicalData.elections.find(e => e.year === 2021);
  if (!election2021) return null;

  const result2021 = election2021.results.find(r => r.winner);
  if (!result2021) return null;

  // No change — don't render
  if (result2021.party === predictedWinner.party) return null;

  const reasons = buildReasons(
    predictedWinner,
    result2021.party,
    result2021.candidate,
    result2021.voteShare,
    election2021.winMargin,
    allCandidates,
  );

  return (
    <div className="card border-l-4" style={{ borderColor: partyColor(predictedWinner.party) }}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-gray-800">Party Flip Detected</span>
            <PartyBadge party={result2021.party} />
            <span className="text-gray-400 text-sm">→</span>
            <PartyBadge party={predictedWinner.party} />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            2021 winner: <strong>{result2021.candidate}</strong> ({result2021.party}) with {Math.round(result2021.voteShare * 100)}% ·
            2026 projection: <strong>{predictedWinner.name}</strong> ({predictedWinner.party}) with {Math.round(predictedWinner.predictedVoteShare * 100)}%
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs text-gray-400">Projected swing</p>
          <p className="text-lg font-bold" style={{ color: partyColor(predictedWinner.party) }}>
            +{Math.round((predictedWinner.predictedVoteShare - result2021.voteShare) * 100)}%
          </p>
          <p className="text-xs text-gray-400">{predictedWinner.party} vs 2021</p>
        </div>
      </div>

      {/* Reasons */}
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Top 5 Reasons for This Shift
      </p>
      <div className="space-y-3">
        {reasons.map((reason, i) => (
          <div key={i} className="flex gap-3">
            <div
              className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: partyColor(predictedWinner.party) }}
            >
              {i + 1}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800 leading-tight">{reason.title}</p>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{reason.detail}</p>
              {reason.metric && (
                <p className="text-xs font-mono text-gray-400 mt-1 bg-gray-50 px-2 py-0.5 rounded inline-block">
                  {reason.metric}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
