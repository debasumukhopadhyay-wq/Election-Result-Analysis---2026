import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { runPrediction } from '../api/predictionApi';
import WinnerCard from '../components/prediction/WinnerCard';
import VoteShareChart from '../components/prediction/VoteShareChart';
import FactorBreakdown from '../components/prediction/FactorBreakdown';
import BoothHeatmap from '../components/booth/BoothHeatmap';
import SwingGraph from '../components/booth/SwingGraph';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { PARTY_COLORS } from '../types/constituency';
import ImprovementReport from '../components/improvement/ImprovementReport';

export default function AssemblyResultsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedImproveParty, setSelectedImproveParty] = useState<string | null>(null);
  const [selectedImproveName, setSelectedImproveName] = useState<string>('');

  useEffect(() => {
    if (id) {
      setLoading(true);
      setResult(null);
      setError(null);
      runPrediction({ constituencyId: id })
        .then(data => setResult(data))
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:text-blue-800 text-sm">
          Back to Dashboard
        </button>
        {result && (
          <h2 className="text-xl font-bold text-gray-900">{result.constituencyName} — Results</h2>
        )}
      </div>

      {loading && <LoadingSpinner size="lg" message="Loading assembly results..." />}
      {error && <div className="card border-l-4 border-red-500"><p className="text-red-700">{error}</p></div>}

      {result && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <WinnerCard
              winner={result.predictedWinner}
              confidenceScore={result.confidenceScore}
              constituencyName={result.constituencyName}
            />
            <VoteShareChart candidates={result.allCandidates} />
          </div>

          <FactorBreakdown candidates={result.allCandidates} />

          {/* Booth results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BoothHeatmap
              booths={result.boothSimulation.booths}
              totalBooths={result.boothSimulation.totalBooths}
            />
            <SwingGraph simulation={result.boothSimulation} />
          </div>

          {/* Booth detail table */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Booth-wise Results ({result.boothSimulation.totalBooths} booths)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2 font-medium">Booth</th>
                    <th className="pb-2 font-medium text-center">Voters</th>
                    <th className="pb-2 font-medium">Leading</th>
                    {result.allCandidates.slice(0, 4).map((c: any) => (
                      <th
                        key={c.party}
                        className="pb-2 font-medium text-center"
                        style={{ color: PARTY_COLORS[c.party] || '#6B7280' }}
                      >
                        {c.party}
                      </th>
                    ))}
                    <th className="pb-2 font-medium text-center">Swing Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {result.boothSimulation.booths.map((booth: any) => (
                    <tr key={booth.boothId} className="hover:bg-gray-50">
                      <td className="py-1.5 font-mono text-gray-600">B{booth.boothNumber}</td>
                      <td className="py-1.5 text-center text-gray-500">{booth.estimatedVoters.toLocaleString()}</td>
                      <td className="py-1.5">
                        <span className="font-semibold" style={{ color: PARTY_COLORS[booth.leadingParty] || '#6B7280' }}>
                          {booth.leadingParty}
                        </span>
                      </td>
                      {result.allCandidates.slice(0, 4).map((c: any) => (
                        <td key={c.party} className="py-1.5 text-center text-gray-700">
                          {booth.shares[c.party] ? Math.round(booth.shares[c.party] * 100) + '%' : '—'}
                        </td>
                      ))}
                      <td className="py-1.5 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          booth.swingRisk === 'high' ? 'bg-red-100 text-red-700' :
                          booth.swingRisk === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {booth.swingRisk}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Candidates with improvement report buttons */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Candidates — Improvement Analysis</h3>
            <div className="space-y-3">
              {result.allCandidates.map((c: any, idx: number) => (
                <div
                  key={c.candidateId}
                  className={`flex items-center justify-between p-3 rounded-lg border ${idx === 0 ? 'border-green-200 bg-green-50' : 'border-gray-100'}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-block w-16 text-center px-2 py-0.5 rounded text-xs font-semibold text-white"
                      style={{ backgroundColor: PARTY_COLORS[c.party] || '#6B7280' }}
                    >
                      {c.party}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{c.name}</p>
                      <p className="text-xs text-gray-500">
                        Score: {c.totalScore.toFixed(1)} | Vote Share: {Math.round(c.predictedVoteShare * 100)}%
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedImproveParty(c.party);
                      setSelectedImproveName(c.name);
                    }}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded font-medium"
                  >
                    {idx === 0 ? 'Winning Strategy' : 'Improve to Win'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Improvement Report Panel */}
          {selectedImproveParty && id && (
            <ImprovementReport
              constituencyId={id}
              party={selectedImproveParty}
              candidateName={selectedImproveName}
              onClose={() => setSelectedImproveParty(null)}
            />
          )}
        </>
      )}
    </div>
  );
}
