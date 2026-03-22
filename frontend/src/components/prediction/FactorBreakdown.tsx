import React, { useState } from 'react';
import { PARTY_COLORS } from '../../types/constituency';

const FACTOR_META: Record<string, { label: string; group: string; icon: string }> = {
  candidateImage:         { label: 'Candidate Image',         group: 'Candidate',   icon: '👤' },
  antiIncumbency:         { label: 'Anti-Incumbency',         group: 'Candidate',   icon: '🔄' },
  candidateAccessibility: { label: 'Accessibility',           group: 'Candidate',   icon: '🤝' },
  pastPerformance:        { label: 'Past Performance',        group: 'Candidate',   icon: '📈' },
  crisisHandling:         { label: 'Crisis Handling',         group: 'Candidate',   icon: '🛡️' },

  partyBrand:             { label: 'Party Brand',             group: 'Party',       icon: '🏛️' },
  allianceStrategy:       { label: 'Alliance Strategy',       group: 'Party',       icon: '🤜' },
  leadershipSupport:      { label: 'Leadership Support',      group: 'Party',       icon: '⭐' },
  manifestoCredibility:   { label: 'Manifesto Credibility',   group: 'Party',       icon: '📜' },
  mediaManagement:        { label: 'Media Management',        group: 'Party',       icon: '📺' },
  funding:                { label: 'Funding',                 group: 'Party',       icon: '💰' },

  casteEquation:          { label: 'Caste Equation',          group: 'Voter Base',  icon: '⚖️' },
  communityCoalition:     { label: 'Community Coalition',     group: 'Voter Base',  icon: '🫂' },
  localIssuesFit:         { label: 'Local Issues Fit',        group: 'Voter Base',  icon: '📍' },
  oppositionWeakness:     { label: 'Opposition Weakness',     group: 'Voter Base',  icon: '🎯' },

  boothNetwork:           { label: 'Booth Network',           group: 'Operations',  icon: '🏘️' },
  groundIntelligence:     { label: 'Ground Intelligence',     group: 'Operations',  icon: '🔍' },
  volunteerStrength:      { label: 'Volunteer Strength',      group: 'Operations',  icon: '💪' },
  voterTurnoutStrategy:   { label: 'Turnout Strategy',        group: 'Operations',  icon: '🗳️' },
  electionDayManagement:  { label: 'Election Day Mgmt',       group: 'Operations',  icon: '📋' },

  campaignNarrative:      { label: 'Campaign Narrative',      group: 'Campaign',    icon: '📢' },
  socialMediaStrategy:    { label: 'Social Media',            group: 'Campaign',    icon: '📱' },
  whatsappNetworks:       { label: 'WhatsApp Networks',       group: 'Campaign',    icon: '💬' },
  microTargeting:         { label: 'Micro-Targeting',         group: 'Campaign',    icon: '🎯' },
  momentum:               { label: 'Momentum (Last 10 Days)', group: 'Campaign',    icon: '🚀' },
};

const GROUPS = ['Candidate', 'Party', 'Voter Base', 'Operations', 'Campaign'];

interface Props {
  candidates: any[];
}

export default function FactorBreakdown({ candidates }: Props) {
  const [activeGroup, setActiveGroup] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'factor' | 'weight'>('weight');

  const allGroups = ['All', ...GROUPS];
  const top4 = candidates.slice(0, 4);

  const factorKeys = Object.keys(FACTOR_META).filter(key =>
    activeGroup === 'All' || FACTOR_META[key].group === activeGroup
  );

  const sortedKeys = sortBy === 'weight'
    ? [...factorKeys].sort((a, b) => {
        const wa = candidates[0]?.factorScores?.[a]?.weight || 0;
        const wb = candidates[0]?.factorScores?.[b]?.weight || 0;
        return wb - wa;
      })
    : factorKeys;

  const gridCols = `180px repeat(${top4.length}, 1fr)`;

  return (
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h3 className="text-sm font-semibold text-gray-700">25-Factor Score Breakdown</h3>
        <button
          onClick={() => setSortBy(sortBy === 'weight' ? 'factor' : 'weight')}
          className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-500 hover:bg-gray-50"
        >
          Sort: {sortBy === 'weight' ? 'By Weight ↓' : 'By Factor'}
        </button>
      </div>

      {/* Group filter tabs */}
      <div className="flex flex-wrap gap-1 mb-4">
        {allGroups.map(g => (
          <button
            key={g}
            onClick={() => setActiveGroup(g)}
            className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
              activeGroup === g
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Column headers */}
      <div className="grid mb-2" style={{ gridTemplateColumns: gridCols }}>
        <div className="text-xs text-gray-400 font-medium">Factor (Weight)</div>
        {top4.map(c => (
          <div
            key={c.party}
            className="text-xs font-semibold text-center truncate px-1"
            style={{ color: PARTY_COLORS[c.party] || '#6B7280' }}
          >
            {c.party}
          </div>
        ))}
      </div>

      {/* Factor rows */}
      <div className="space-y-1.5">
        {sortedKeys.map(key => {
          const meta = FACTOR_META[key];
          const weight = candidates[0]?.factorScores?.[key]?.weight || 0;
          return (
            <div
              key={key}
              className="grid items-center gap-1"
              style={{ gridTemplateColumns: gridCols }}
            >
              {/* Factor label */}
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs">{meta.icon}</span>
                <span className="text-xs text-gray-700 truncate">{meta.label}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">({weight}%)</span>
              </div>
              {/* Score bars per candidate */}
              {top4.map(c => {
                const fs = c.factorScores?.[key];
                const score = fs ? Math.round(fs.score) : 0;
                const barColor = PARTY_COLORS[c.party] || '#6B7280';
                return (
                  <div key={c.party} className="flex flex-col items-center gap-0.5 px-1">
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${score}%`, backgroundColor: barColor, opacity: 0.85 }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 font-mono">{score}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-100 justify-center">
        {top4.map(c => (
          <div key={c.party} className="flex items-center gap-1.5 text-xs">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: PARTY_COLORS[c.party] || '#6B7280' }} />
            <span className="text-gray-600">{c.name} ({c.party})</span>
          </div>
        ))}
      </div>

      {/* Summary: top factors for predicted winner */}
      {candidates[0]?.topFactors && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-1">
            <span className="font-medium" style={{ color: PARTY_COLORS[candidates[0].party] || '#6B7280' }}>
              {candidates[0].party}
            </span>{' '}top deciding factors:
          </p>
          <div className="flex flex-wrap gap-1">
            {candidates[0].topFactors.map((f: string) => (
              <span key={f} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
                {FACTOR_META[f]?.icon} {FACTOR_META[f]?.label || f}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
