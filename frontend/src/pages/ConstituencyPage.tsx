import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchConstituencyById, fetchCandidates, fetchConstituencies } from '../api/constituencyApi';
import { runPrediction } from '../api/predictionApi';
import { useConstituencyStore } from '../store/constituencyStore';
import { usePredictionStore } from '../store/predictionStore';
import ConstituencySelector from '../components/inputs/ConstituencySelector';
import ContextInput from '../components/inputs/ContextInput';
import ContextInfluencePanel from '../components/inputs/ContextInfluencePanel';
import WeightAdjuster from '../components/inputs/WeightAdjuster';
import WinnerCard from '../components/prediction/WinnerCard';
import FactorBreakdown from '../components/prediction/FactorBreakdown';
import VoteShareChart from '../components/prediction/VoteShareChart';
import AIReasoningPanel from '../components/prediction/AIReasoningPanel';
import BoothHeatmap from '../components/booth/BoothHeatmap';
import SwingGraph from '../components/booth/SwingGraph';
import SwingRiskPanel from '../components/prediction/SwingRiskPanel';
import DemographicsPanel from '../components/prediction/DemographicsPanel';
import Election2021Panel from '../components/prediction/Election2021Panel';
import PartyChangePanel from '../components/prediction/PartyChangePanel';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import type { ConstituencyListItem } from '../api/constituencyApi';

export default function ConstituencyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setConstituencies } = useConstituencyStore();

  const [constituencies, setConstituenciesList] = useState<ConstituencyListItem[]>([]);
  const [constituenciesLoading, setConstituenciesLoading] = useState(false);

  const {
    status, result, error, contextText, customWeights,
    setContextText, setCustomWeights, setLoading, setResult, setError
  } = usePredictionStore();

  // Load constituencies list for selector
  useEffect(() => {
    setConstituenciesLoading(true);
    fetchConstituencies()
      .then(data => {
        setConstituenciesList(data);
        setConstituencies(data as any);
      })
      .finally(() => setConstituenciesLoading(false));
  }, []);

  // Auto-run prediction when ID changes
  useEffect(() => {
    if (id) {
      handleRunPrediction(id);
    }
  }, [id]);

  const handleRunPrediction = async (constituencyId: string) => {
    setLoading();
    try {
      const prediction = await runPrediction({
        constituencyId,
        contextText: contextText || undefined,
        weights: customWeights || undefined
      });
      setResult(prediction);
    } catch (err: any) {
      setError(err.message || 'Prediction failed');
    }
  };

  const handleConstituencySelect = (newId: string) => {
    navigate(`/constituency/${newId}`);
  };

  return (
    <div className="space-y-6">
      {/* Top controls */}
      <div className="card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ConstituencySelector
            constituencies={constituencies}
            selectedId={id || null}
            onSelect={handleConstituencySelect}
            loading={constituenciesLoading}
          />
          <div className="space-y-2">
            <ContextInput value={contextText} onChange={setContextText} />
            {result?.contextSignals && result.contextSignals.length > 0 && (
              <ContextInfluencePanel signals={result.contextSignals} />
            )}
          </div>
        </div>
        <WeightAdjuster onChange={setCustomWeights} />
        <button
          onClick={() => id && handleRunPrediction(id)}
          disabled={status === 'loading' || !id}
          className="btn-primary"
        >
          {status === 'loading' ? 'Predicting...' : 'Re-run Prediction'}
        </button>
      </div>

      {/* Loading */}
      {status === 'loading' && (
        <LoadingSpinner size="lg" message="Running prediction model and AI analysis..." />
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="card border-l-4 border-red-500">
          <p className="text-red-700 font-medium">Prediction failed</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Results */}
      {status === 'success' && result && (
        <>
          {/* 2026 Prediction (left) + 2021 Actual Result (right) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <WinnerCard
              winner={result.predictedWinner}
              confidenceScore={result.confidenceScore}
              constituencyName={result.constituencyName}
            />
            {result.historicalData ? (
              <Election2021Panel
                data={result.historicalData}
                constituencyName={result.constituencyName}
              />
            ) : (
              <VoteShareChart candidates={result.allCandidates} />
            )}
          </div>

          {/* Party flip analysis — only when winner party changed vs 2021 */}
          {result.historicalData && (
            <PartyChangePanel
              predictedWinner={result.predictedWinner}
              allCandidates={result.allCandidates}
              historicalData={result.historicalData}
            />
          )}

          {/* Demographics panel */}
          {result.demographics && (
            <DemographicsPanel
              data={result.demographics}
              constituencyName={result.constituencyName}
            />
          )}

          {/* Factor breakdown */}
          <FactorBreakdown candidates={result.allCandidates} />

          {/* AI Reasoning */}
          <AIReasoningPanel reasoning={result.aiReasoning} />

          {/* Swing Risk Panel */}
          <SwingRiskPanel
            candidates={result.allCandidates}
            boothSimulation={result.boothSimulation}
            constituencyId={id!}
            constituencyName={result.constituencyName}
          />

          {/* Booth analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BoothHeatmap
              booths={result.boothSimulation.booths}
              totalBooths={result.boothSimulation.totalBooths}
            />
            <SwingGraph simulation={result.boothSimulation} />
          </div>

          {/* Candidate table */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">All Candidates</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b">
                    <th className="pb-2 font-medium">Candidate</th>
                    <th className="pb-2 font-medium">Party</th>
                    <th className="pb-2 font-medium text-right">Score</th>
                    <th className="pb-2 font-medium text-right">Vote Share</th>
                    <th className="pb-2 font-medium">Education</th>
                    <th className="pb-2 font-medium text-right">Terms</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {result.allCandidates.map((c, idx) => (
                    <tr key={c.candidateId} className={idx === 0 ? 'bg-green-50' : ''}>
                      <td className="py-2 font-medium text-gray-900">
                        {idx === 0 && <span className="text-green-600 mr-1">&#9733;</span>}
                        {c.name}
                      </td>
                      <td className="py-2">
                        <span className="party-badge" style={{ backgroundColor: '#6B7280' }}>
                          {c.party}
                        </span>
                      </td>
                      <td className="py-2 text-right font-mono text-gray-700">{c.totalScore.toFixed(1)}</td>
                      <td className="py-2 text-right font-bold text-gray-900">{Math.round(c.predictedVoteShare * 100)}%</td>
                      <td className="py-2 text-gray-500 text-xs">{c.education || '—'}</td>
                      <td className="py-2 text-right text-gray-500">{c.termCount ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
