import React, { useState } from 'react';
import type { AIReasoning } from '../../types/prediction';
import DataQualityIndicator from '../shared/DataQualityIndicator';

interface Props {
  reasoning: AIReasoning;
}

export default function AIReasoningPanel({ reasoning }: Props) {
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">AI Analysis</h3>
        <DataQualityIndicator quality={reasoning.dataQuality} />
      </div>

      <p className="text-sm text-gray-700 leading-relaxed">{reasoning.narrative}</p>

      {reasoning.keyFactors.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Key Influencing Factors</p>
          <ul className="space-y-1">
            {reasoning.keyFactors.map((factor, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-blue-500 mt-0.5 shrink-0">&#9658;</span>
                {factor}
              </li>
            ))}
          </ul>
        </div>
      )}

      {Object.entries(reasoning.candidateInsights).slice(0, 3).map(([id, insight]) => (
        <div key={id} className="border border-gray-100 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setExpandedCandidate(expandedCandidate === id ? null : id)}
            className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 text-xs font-medium text-gray-600 transition-colors"
          >
            <span>Candidate Insights: {id}</span>
            <svg className={`w-4 h-4 transition-transform ${expandedCandidate === id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedCandidate === id && (
            <div className="p-3 space-y-3">
              <div>
                <p className="text-xs font-semibold text-green-700 mb-1">Strengths</p>
                <ul className="space-y-0.5">
                  {insight.strengths.map((s, i) => <li key={i} className="text-xs text-gray-600 flex gap-1.5"><span className="text-green-500">+</span>{s}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-red-700 mb-1">Weaknesses</p>
                <ul className="space-y-0.5">
                  {insight.weaknesses.map((w, i) => <li key={i} className="text-xs text-gray-600 flex gap-1.5"><span className="text-red-500">-</span>{w}</li>)}
                </ul>
              </div>
              <div className="bg-blue-50 rounded-md p-2">
                <p className="text-xs font-semibold text-blue-700 mb-1">Strategy</p>
                <p className="text-xs text-blue-800">{insight.improvementStrategy}</p>
              </div>
            </div>
          )}
        </div>
      ))}

      {reasoning.missingDataIndicators.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-yellow-700 mb-1">Data Gaps</p>
          {reasoning.missingDataIndicators.map((m, i) => (
            <p key={i} className="text-xs text-yellow-700">• {m}</p>
          ))}
        </div>
      )}
    </div>
  );
}
