import React, { useEffect, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface VoteGapAnalysis {
  currentVoteShare: number;
  targetVoteShare: number;
  votesNeeded: number;
  feasibility: 'high' | 'medium' | 'low';
  totalVoters?: number;
  marginInVotes?: number;
}

interface FactorDetail {
  factor: string;
  score?: number;
  winnerScore?: number;
  gap?: number;
  weight?: number;
  impact?: string;
  description?: string;
  candidateScore?: number;
  advantage?: number;
  advice?: string;
}

interface CampaignAction {
  priority: 'high' | 'medium' | 'low';
  factor?: string;
  action: string;
  timeline: string;
  expectedImpact: string;
  currentScore?: number;
  winnerScore?: number;
}

interface VoterOutreach {
  segment: string;
  approach: string;
  potentialVotes: number;
}

interface BoothStrategy {
  priorityBooths: string;
  weakBoothsApproach: string;
  strongBoothsApproach: string;
  electionDayPlan?: string;
}

interface Report {
  executiveSummary: string;
  voteGapAnalysis?: VoteGapAnalysis;
  keyWeaknesses?: FactorDetail[];
  exploitableGaps?: FactorDetail[];
  strengthsToCapitalize?: FactorDetail[];
  boothStrategy?: BoothStrategy;
  voterOutreach?: VoterOutreach[];
  campaignActions?: CampaignAction[];
  allianceOpportunities?: string;
  riskFactors?: string[];
  confidenceOfTurnaround?: number;
  candidateName?: string;
  party?: string;
  constituencyName?: string;
  isWinning?: boolean;
  generatedBy?: string;
}

interface Props {
  constituencyId: string;
  party: string;
  candidateName: string;
  contextText?: string;
  onClose: () => void;
}

const priorityColor = (p: string) =>
  p === 'high' ? 'bg-red-100 text-red-800 border-red-200' :
  p === 'medium' ? 'bg-amber-100 text-amber-800 border-amber-200' :
  'bg-green-100 text-green-800 border-green-200';

const feasibilityColor = (f: string) =>
  f === 'high' ? 'text-green-700' : f === 'medium' ? 'text-amber-700' : 'text-red-700';

const ScoreBar = ({ score, max = 100, color = '#3b82f6' }: { score: number; max?: number; color?: string }) => (
  <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
    <div className="h-2 rounded-full transition-all duration-500"
      style={{ width: `${Math.min(100, (score / max) * 100)}%`, backgroundColor: color }} />
  </div>
);

export default function ImprovementReport({ constituencyId, party, candidateName, contextText, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    setReport(null);
    setError(null);
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    fetch(`${apiBase}/api/improve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ constituencyId, party, candidateName, contextText })
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setReport(data);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [constituencyId, party, candidateName]);

  const handleDownloadPDF = async () => {
    if (!reportRef.current || !report) return;
    setPdfGenerating(true);
    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let yOffset = 10;
      let remainingHeight = imgHeight;

      while (remainingHeight > 0) {
        const sliceHeight = Math.min(remainingHeight, pageHeight - 20);
        const sourceY = (imgHeight - remainingHeight) * (canvas.height / imgHeight);
        const sourceHeight = sliceHeight * (canvas.height / imgHeight);

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceHeight;
        const ctx = pageCanvas.getContext('2d')!;
        ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);

        if (yOffset > 10) pdf.addPage();
        pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', 10, 10, imgWidth, sliceHeight);
        remainingHeight -= sliceHeight;
        yOffset += sliceHeight;
      }

      const fileName = `ImprovementReport_${report.candidateName?.replace(/\s+/g, '_') || party}_${report.constituencyName?.replace(/\s+/g, '_') || constituencyId}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setPdfGenerating(false);
    }
  };

  const confidenceColor = (c: number) => c >= 55 ? '#16a34a' : c >= 35 ? '#d97706' : '#dc2626';

  return (
    <div className="bg-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
        <div>
          <h3 className="font-bold text-gray-900 text-sm">
            Improvement Report — {candidateName} ({party})
          </h3>
          {report?.constituencyName && (
            <p className="text-xs text-gray-500">{report.constituencyName} Constituency</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {report && (
            <button
              onClick={handleDownloadPDF}
              disabled={pdfGenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {pdfGenerating ? (
                <>
                  <div className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full" />
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </>
              )}
            </button>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none px-1">×</button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-3 p-6 text-blue-600">
          <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />
          <span className="text-sm">Generating comprehensive improvement report...</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="p-4">
          <p className="text-red-600 text-sm bg-red-50 rounded p-3">{error}</p>
        </div>
      )}

      {/* Report content */}
      {report && !loading && (
        <div ref={reportRef} className="p-4 space-y-5 bg-white">

          {/* Header for PDF */}
          <div className="border-b border-gray-200 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Campaign Improvement Report
                </h2>
                <p className="text-sm text-gray-600">{report.candidateName} ({report.party}) · {report.constituencyName}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">West Bengal Assembly Election 2026</p>
                <p className="text-xs text-gray-400">Generated {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                {report.generatedBy === 'data-driven-model' && (
                  <p className="text-xs text-blue-500 mt-0.5">Data-driven model analysis</p>
                )}
              </div>
            </div>
          </div>

          {/* 1. Executive Summary */}
          <section>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Executive Summary</h4>
            <div className={`rounded-lg p-3 text-sm ${report.isWinning ? 'bg-green-50 border border-green-200 text-green-900' : 'bg-blue-50 border border-blue-200 text-blue-900'}`}>
              {report.executiveSummary}
            </div>
          </section>

          {/* 2. Vote Gap Analysis */}
          {report.voteGapAnalysis && (
            <section>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Vote Position Analysis</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                  <p className="text-2xl font-bold text-gray-900">{report.voteGapAnalysis.currentVoteShare}%</p>
                  <p className="text-xs text-gray-500 mt-0.5">Current Share</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-100">
                  <p className="text-2xl font-bold text-blue-700">{report.voteGapAnalysis.targetVoteShare}%</p>
                  <p className="text-xs text-gray-500 mt-0.5">Target Share</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center border border-amber-100">
                  <p className="text-2xl font-bold text-amber-700">
                    {report.voteGapAnalysis.votesNeeded > 0 ? report.voteGapAnalysis.votesNeeded.toLocaleString() : '—'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Votes Needed</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                  <p className={`text-2xl font-bold ${feasibilityColor(report.voteGapAnalysis.feasibility)}`}>
                    {report.voteGapAnalysis.feasibility.toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Feasibility</p>
                </div>
              </div>
              {report.voteGapAnalysis.marginInVotes !== undefined && report.voteGapAnalysis.marginInVotes > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  Current margin: ~{report.voteGapAnalysis.marginInVotes.toLocaleString()} votes out of {report.voteGapAnalysis.totalVoters?.toLocaleString()} registered voters
                </p>
              )}
            </section>
          )}

          {/* 3. Confidence Meter */}
          {report.confidenceOfTurnaround !== undefined && (
            <section>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                {report.isWinning ? 'Confidence of Holding Lead' : 'Confidence of Converting to Win'}
              </h4>
              <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-4 border border-gray-100">
                <div className="w-full">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>0% (Very Unlikely)</span><span>100% (Near Certain)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div className="h-4 rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                      style={{ width: `${report.confidenceOfTurnaround}%`, backgroundColor: confidenceColor(report.confidenceOfTurnaround) }}>
                      <span className="text-white text-xs font-bold">{report.confidenceOfTurnaround}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 4. Key Weaknesses */}
          {report.keyWeaknesses && report.keyWeaknesses.length > 0 && (
            <section>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Key Factor Weaknesses (Lowest Scoring)</h4>
              <div className="space-y-3">
                {report.keyWeaknesses.map((w, i) => (
                  <div key={i} className="border border-gray-100 rounded-lg p-3 bg-white">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${priorityColor(w.impact || 'medium')}`}>
                          {(w.impact || 'medium').toUpperCase()}
                        </span>
                        <span className="text-sm font-semibold text-gray-800">{w.factor}</span>
                        {w.weight && <span className="text-xs text-gray-400">(wt {w.weight})</span>}
                      </div>
                      <div className="text-right text-xs">
                        <span className="text-red-600 font-bold">{w.score}/100</span>
                        {w.winnerScore !== undefined && w.winnerScore > 0 && (
                          <span className="text-gray-400 ml-1">vs {w.winnerScore} (leader)</span>
                        )}
                      </div>
                    </div>
                    {w.score !== undefined && (
                      <div className="flex gap-1 mb-2">
                        <div className="flex-1">
                          <p className="text-xs text-gray-400 mb-0.5">Your score</p>
                          <ScoreBar score={w.score} color="#ef4444" />
                        </div>
                        {w.winnerScore !== undefined && w.winnerScore > 0 && (
                          <div className="flex-1">
                            <p className="text-xs text-gray-400 mb-0.5">Leader's score</p>
                            <ScoreBar score={w.winnerScore} color="#22c55e" />
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-gray-600">{w.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 5. Exploitable Gaps */}
          {report.exploitableGaps && report.exploitableGaps.length > 0 && (
            <section>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Areas Where Leader Has Large Advantage (Exploit These)</h4>
              <div className="space-y-2">
                {report.exploitableGaps.map((g, i) => (
                  <div key={i} className="bg-orange-50 border border-orange-100 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-orange-900">{g.factor}</span>
                      <span className="text-xs font-bold text-orange-700">Gap: -{g.gap} pts</span>
                    </div>
                    <p className="text-xs text-orange-800">{g.advice}</p>
                    {g.impact && <p className="text-xs text-orange-600 mt-1 font-medium">Expected Impact: {g.impact}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 6. Strengths to Capitalize */}
          {report.strengthsToCapitalize && report.strengthsToCapitalize.length > 0 && (
            <section>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Your Strengths — Amplify These</h4>
              <div className="space-y-2">
                {report.strengthsToCapitalize.map((s, i) => (
                  <div key={i} className="bg-green-50 border border-green-100 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-green-900">{s.factor}</span>
                      <span className="text-xs font-bold text-green-700">+{s.advantage} pts ahead</span>
                    </div>
                    <p className="text-xs text-green-800">{s.advice}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 7. Campaign Actions */}
          {report.campaignActions && report.campaignActions.length > 0 && (
            <section>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Priority Campaign Actions</h4>
              <div className="space-y-2">
                {report.campaignActions.map((action, i) => (
                  <div key={i} className="border border-gray-100 rounded-lg p-3 bg-white flex gap-3">
                    <div className="shrink-0 mt-0.5">
                      <span className={`inline-block text-xs px-1.5 py-0.5 rounded border font-bold ${priorityColor(action.priority)}`}>
                        {action.priority.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      {action.factor && (
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="text-xs text-blue-600 font-medium">{action.factor}</p>
                          {(action as any).contextDriven && (
                            <span className="text-xs bg-amber-100 text-amber-800 border border-amber-200 rounded px-1.5 py-0 font-bold">⚠ Context Alert</span>
                          )}
                        </div>
                      )}
                      <p className="text-sm font-semibold text-gray-900">{action.action}</p>
                      <div className="flex flex-wrap gap-3 mt-1">
                        <span className="text-xs text-gray-500">⏱ {action.timeline}</span>
                        <span className="text-xs text-green-700">↑ {action.expectedImpact}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 8. Booth Strategy */}
          {report.boothStrategy && (
            <section>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Booth-Level Strategy</h4>
              <div className="space-y-2">
                {[
                  { label: 'Priority Booths', text: report.boothStrategy.priorityBooths, color: 'border-red-200 bg-red-50' },
                  { label: 'Weak Booths Approach', text: report.boothStrategy.weakBoothsApproach, color: 'border-amber-200 bg-amber-50' },
                  { label: 'Strong Booths Approach', text: report.boothStrategy.strongBoothsApproach, color: 'border-green-200 bg-green-50' },
                  report.boothStrategy.electionDayPlan
                    ? { label: 'Election Day Plan', text: report.boothStrategy.electionDayPlan, color: 'border-blue-200 bg-blue-50' }
                    : null
                ].filter(Boolean).map((item: any, i) => (
                  <div key={i} className={`rounded-lg p-3 border ${item.color}`}>
                    <p className="text-xs font-semibold text-gray-700 mb-1">{item.label}</p>
                    <p className="text-xs text-gray-700">{item.text}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 9. Voter Outreach */}
          {report.voterOutreach && report.voterOutreach.length > 0 && (
            <section>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Targeted Voter Outreach</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-gray-100 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-2 px-3 font-semibold text-gray-600">Voter Segment</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-600">Approach</th>
                      <th className="text-right py-2 px-3 font-semibold text-gray-600">Potential Votes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {report.voterOutreach.map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="py-2 px-3 font-medium text-gray-800">{item.segment}</td>
                        <td className="py-2 px-3 text-gray-600">{item.approach}</td>
                        <td className="py-2 px-3 text-right font-bold text-blue-700">
                          ~{item.potentialVotes.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t border-gray-200">
                    <tr>
                      <td colSpan={2} className="py-2 px-3 font-semibold text-gray-700">Total Addressable Votes</td>
                      <td className="py-2 px-3 text-right font-bold text-green-700">
                        ~{report.voterOutreach.reduce((s, v) => s + v.potentialVotes, 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
          )}

          {/* 10. Alliance + Risk */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {report.allianceOpportunities && (
              <section>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Alliance Opportunities</h4>
                <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                  <p className="text-xs text-purple-900">{report.allianceOpportunities}</p>
                </div>
              </section>
            )}
            {report.riskFactors && report.riskFactors.length > 0 && (
              <section>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Risk Factors</h4>
                <ul className="space-y-1.5">
                  {report.riskFactors.map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                      <span className="text-red-500 shrink-0 mt-0.5">▲</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 pt-3 text-center">
            <p className="text-xs text-gray-400">
              WB Election 2026 Prediction System · {report.constituencyName} · {report.candidateName} ({report.party})
              {report.generatedBy === 'data-driven-model' ? ' · Data-Driven Analysis' : ' · AI Analysis'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
