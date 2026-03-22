import React, { useState } from 'react';
import { FACTOR_LABELS } from '../../types/prediction';

// Matches backend FACTOR_WEIGHTS in scoringWeights.js (total = 100)
const DEFAULT_WEIGHTS: Record<string, number> = {
  candidateImage:         7,
  partyBrand:             6,
  antiIncumbency:         5,
  casteEquation:          9,
  communityCoalition:     4,
  localIssuesFit:         3,
  boothNetwork:           8,
  groundIntelligence:     2,
  campaignNarrative:      2,
  leadershipSupport:      4,
  funding:                2,
  volunteerStrength:      3,
  socialMediaStrategy:    2,
  whatsappNetworks:       1,
  oppositionWeakness:     4,
  allianceStrategy:       6,
  candidateAccessibility: 3,
  pastPerformance:        5,
  manifestoCredibility:   2,
  mediaManagement:        2,
  crisisHandling:         2,
  voterTurnoutStrategy:   5,
  electionDayManagement:  5,
  microTargeting:         2,
  momentum:               6,
};

// Group factors for visual organization
const FACTOR_GROUPS: { label: string; keys: string[] }[] = [
  { label: 'Candidate', keys: ['candidateImage', 'antiIncumbency', 'candidateAccessibility', 'crisisHandling'] },
  { label: 'Party', keys: ['partyBrand', 'allianceStrategy', 'funding', 'mediaManagement', 'manifestoCredibility'] },
  { label: 'Voter Base', keys: ['casteEquation', 'communityCoalition', 'localIssuesFit', 'oppositionWeakness'] },
  { label: 'Operations', keys: ['boothNetwork', 'volunteerStrength', 'groundIntelligence', 'leadershipSupport', 'voterTurnoutStrategy', 'electionDayManagement'] },
  { label: 'Campaign', keys: ['momentum', 'campaignNarrative', 'socialMediaStrategy', 'whatsappNetworks', 'microTargeting', 'pastPerformance'] },
];

interface Props {
  onChange: (weights: Record<string, number> | null) => void;
}

export default function WeightAdjuster({ onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [weights, setWeights] = useState({ ...DEFAULT_WEIGHTS });

  const total = Object.values(weights).reduce((s, v) => s + v, 0);
  const isValid = Math.abs(total - 100) < 1;

  const handleChange = (key: string, val: number) => {
    const newWeights = { ...weights, [key]: val };
    setWeights(newWeights);
    const newTotal = Object.values(newWeights).reduce((s, v) => s + v, 0);
    if (Math.abs(newTotal - 100) < 1) {
      // Send raw integer weights (e.g. 7, 9) — backend normalizeWeights handles scaling
      onChange({ ...newWeights });
    }
  };

  const reset = () => {
    setWeights({ ...DEFAULT_WEIGHTS });
    onChange(null);
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors"
      >
        <span>Prediction Weight Configuration <span className="text-xs text-gray-400 font-normal">(25 factors)</span></span>
        <div className="flex items-center gap-2">
          {!isValid && <span className="text-xs text-red-500">Total: {total}%</span>}
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {isOpen && (
        <div className="p-4 bg-white space-y-5">
          {FACTOR_GROUPS.map(group => (
            <div key={group.label}>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pb-1 border-b border-gray-100">
                {group.label}
              </div>
              <div className="space-y-2">
                {group.keys.map(key => (
                  <div key={key} className="flex items-center gap-3">
                    <label className="text-xs text-gray-600 w-40 shrink-0">{FACTOR_LABELS[key] || key}</label>
                    <input
                      type="range"
                      min={0}
                      max={20}
                      value={weights[key] ?? 0}
                      onChange={e => handleChange(key, Number(e.target.value))}
                      className="flex-1 accent-blue-600"
                    />
                    <span className={`text-xs font-mono w-8 text-right ${isValid ? 'text-gray-600' : 'text-red-500'}`}>
                      {weights[key]}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className={`flex items-center justify-between pt-2 border-t text-xs ${isValid ? 'text-green-600' : 'text-red-500'}`}>
            <span>Total: {total}% {isValid ? '✓' : '(must = 100%)'}</span>
            <button type="button" onClick={reset} className="text-blue-600 hover:underline">Reset to defaults</button>
          </div>
        </div>
      )}
    </div>
  );
}
