import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchStateSummary, fetchStateSummaryWithContext } from '../api/summaryApi';
import { fetchConstituencies } from '../api/constituencyApi';
import { useDashboardStore } from '../store/dashboardStore';
import PartyTallyChart from '../components/dashboard/PartyTallyChart';
import MajorityMeter from '../components/dashboard/MajorityMeter';
import DistrictFilter from '../components/dashboard/DistrictFilter';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import PdfDownloadButton from '../components/shared/PdfDownloadButton';
import TMCStateActionPoints from '../components/dashboard/TMCStateActionPoints';
import { PARTY_COLORS } from '../types/constituency';

export default function DashboardPage() {
  const { summary, loading, error, selectedDistrict, setSummary, setLoading, setError, setSelectedDistrict } = useDashboardStore();

  const [allSeats, setAllSeats] = useState<any[]>([]);
  const [seatSearch, setSeatSearch] = useState('');
  const [showAllSeats, setShowAllSeats] = useState(false);
  const [contextText, setContextText] = useState('');
  const [contextLoading, setContextLoading] = useState(false);
  const [contextSignals, setContextSignals] = useState<any[]>([]);
  const [contextApplied, setContextApplied] = useState(false);
  const [seatPredictions, setSeatPredictions] = useState<Record<string, { leadingParty: string; predictedWinner: { name: string; party: string } }>>({});

  useEffect(() => {
    if (!summary) {
      setLoading(true);
      fetchStateSummary()
        .then(data => setSummary(data))
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, []);

  useEffect(() => {
    fetchConstituencies().then(data => setAllSeats(data));
  }, []);

  const handleApplyContext = async () => {
    if (!contextText.trim()) {
      // Reset to baseline
      setContextLoading(true);
      try {
        const data = await fetchStateSummary();
        setSummary(data);
        setContextSignals([]);
        setContextApplied(false);
      } finally { setContextLoading(false); }
      return;
    }
    setContextLoading(true);
    try {
      const data = await fetchStateSummaryWithContext(contextText);
      setSummary(data as any);
      setContextSignals(data.contextSignals || []);
      setContextApplied(data.contextApplied || false);
      setSeatPredictions((data as any).seatPredictions || {});
    } catch (err: any) {
      setError(err.message);
    } finally { setContextLoading(false); }
  };

  if (loading) return <LoadingSpinner size="lg" message="Loading statewide projections..." />;
  if (error) return (
    <div className="card border-l-4 border-red-500">
      <p className="text-red-700 font-medium">Failed to load dashboard</p>
      <p className="text-red-500 text-sm mt-1">{error}</p>
    </div>
  );
  if (!summary) return null;

  // Compute flipping seats: 2021 winner ≠ 2026 predicted winner
  // Uses winner2021 field (from historicalResults with real overrides) for all 294 seats
  const flippingSeats = allSeats
    .filter((s: any) => s.winner2021 && s.leadingParty && s.winner2021.party !== s.leadingParty)
    .sort((a: any, b: any) => {
      // Verified real data first, then by from-party
      const aV = a.winner2021?.verified ? 1 : 0;
      const bV = b.winner2021?.verified ? 1 : 0;
      return bV - aV;
    });

  const filteredSeats = allSeats
    .filter((s: any) => !selectedDistrict || s.district === selectedDistrict)
    .filter((s: any) => !seatSearch || s.name.toLowerCase().includes(seatSearch.toLowerCase()) || s.district.toLowerCase().includes(seatSearch.toLowerCase()));

  const displayedSeats = showAllSeats ? filteredSeats : filteredSeats.slice(0, 20);

  const filteredDistricts = selectedDistrict
    ? summary.districtBreakdown.filter(d => d.district === selectedDistrict)
    : summary.districtBreakdown;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Statewide Election Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">
            West Bengal Assembly Election 2026 — 294 seats | Majority: {summary.majorityThreshold} seats
          </p>
        </div>
        <PdfDownloadButton
          elementId="dashboard-content"
          filename="WB-Election-2026-Dashboard.pdf"
          label="Print / Save PDF"
        />
      </div>

      {/* Capturable content starts here */}
      <div id="dashboard-content" className="space-y-6">

      {/* ═══ HEADLINE SUMMARY — Seats, Vote %, Swings ═══ */}
      {(() => {
        const projEntries = Object.entries(summary.projections).sort((a, b) => b[1].seats - a[1].seats);
        // Actual 2021 WB Assembly results (including Samserganj & Jangipur bypolls):
        // TMC 215, BJP 77, ISF 1 (Bhangar), IND 1 (Kalimpong — GJM-Tamang), CPM 0, INC 0
        const seats2021: Record<string, number> = {
          TMC: 215, BJP: 77, ISF: 1, IND: 1, CPM: 0, INC: 0
        };
        // Merge: all parties from projections + any 2021 winners not in projections
        const projMap = new Map(projEntries);
        const allParties = [...projEntries];
        Object.entries(seats2021).forEach(([party, seats]) => {
          if (seats > 0 && !projMap.has(party)) {
            allParties.push([party, { seats: 0, minSeats: 0, maxSeats: 0, voteShare: 0 }]);
          }
        });
        allParties.sort((a, b) => {
          // Sort by 2026 seats desc, then 2021 seats desc
          const diff = (b[1] as any).seats - (a[1] as any).seats;
          return diff !== 0 ? diff : (seats2021[b[0]] || 0) - (seats2021[a[0]] || 0);
        });

        const topReasons = [
          { title: 'TMC Organizational Dominance', detail: 'TMC\'s unmatched booth-level machinery, panchayat control, and welfare schemes (Lakshmir Bhandar, Kanyashree) give it a structural advantage in 250+ seats. But 15 years of incumbency is eroding margins — projected vote share drops from ~48% (2021) to ~43%.' },
          { title: 'BJP Hindu Consolidation', detail: 'BJP retains strong Hindu vote consolidation in border districts, Jungle Mahal, and urban seats — but has limited reach in Muslim-majority belts. Its 2021 vote share (~38%) erodes slightly to ~34% as some anti-TMC voters explore other options.' },
          { title: 'CPM-ISF Alliance: Marginal Revival (0 → 5 seats)', detail: 'Left Front + ISF seat-sharing deal pools cadre and Muslim mobilization vote. But Left vote share collapsed from 40% (2011) to ~5% (2021) and recovery is slow — projected at ~10%. Competitive only in industrial belt (Paschim Bardhaman, Asansol-Durgapur), a few N.Bengal pockets, and select Muslim-majority seats.' },
          { title: 'Congress Limited Foothold (0 → 6 seats)', detail: 'INC\'s presence is confined to Murshidabad-Malda belt where Adhir Ranjan Chowdhury and Isha Khan Chowdhury retain influence. Projected ~6% vote share statewide — a modest improvement from 2.9% in 2021, but INC remains a non-factor outside its traditional pockets.' },
          { title: 'Muslim Vote Fragmentation', detail: 'Muslims (~30% of WB population) influence 85+ seats. TMC still commands the largest share of Muslim votes as the anti-BJP shield, but ISF, AJUP, and AIMIM are nibbling at margins — creating slim openings in Murshidabad, Malda, and S24P without fundamentally altering the TMC-BJP bipolar contest.' },
        ];

        return (
          <div className="card" style={{ borderTop: '4px solid #1E40AF', background: 'linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)' }}>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Election Projection Summary</h3>

            {/* Seat Tally + Vote % + Swing */}
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b">
                    <th className="pb-2 text-left font-medium">Party</th>
                    <th className="pb-2 text-center font-medium">2026 Seats</th>
                    <th className="pb-2 text-center font-medium">2021 Seats</th>
                    <th className="pb-2 text-center font-medium">Swing</th>
                    <th className="pb-2 text-center font-medium">Vote %</th>
                    <th className="pb-2 text-center font-medium">Range</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allParties.map(([party, proj]) => {
                    const prev = seats2021[party] ?? 0;
                    const projected = (proj as any).seats || 0;
                    const swing = projected - prev;
                    const votePercent = Math.round(((proj as any).voteShare || 0) * 100);
                    return (
                      <tr key={party} className="hover:bg-blue-50">
                        <td className="py-2 font-semibold" style={{ color: PARTY_COLORS[party] || '#6B7280' }}>{party}</td>
                        <td className="py-2 text-center text-lg font-bold text-gray-900">{projected}</td>
                        <td className="py-2 text-center text-gray-500">{prev}</td>
                        <td className="py-2 text-center">
                          <span className={`font-semibold ${swing > 0 ? 'text-green-600' : swing < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                            {swing > 0 ? `+${swing}` : swing === 0 ? '—' : swing}
                          </span>
                        </td>
                        <td className="py-2 text-center font-medium text-gray-700">{votePercent > 0 ? `${votePercent}%` : '—'}</td>
                        <td className="py-2 text-center text-xs text-gray-400">
                          {(proj as any).minSeats !== undefined && projected > 0
                            ? `${(proj as any).minSeats}–${(proj as any).maxSeats}`
                            : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 5 Top Reasons */}
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-2">Top 5 Reasons Behind the Projection</h4>
              <ol className="space-y-1.5">
                {topReasons.map((r, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">{i + 1}</span>
                    <div>
                      <span className="font-semibold text-gray-800">{r.title}:</span>{' '}
                      <span className="text-gray-600">{r.detail}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        );
      })()}

      {/* Context Chat Box */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">State-level Context</span>
          {contextApplied && (
            <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
              Context Active — Results Updated
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500">
          Describe ground-level intelligence, alliances, or political events to re-run the statewide projection.
          E.g. "Strong anti-incumbency against TMC. Muslim voters shifting to CPM and ISF. BJP wave in Hindu belt."
        </p>
        <div className="flex gap-2">
          <textarea
            className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
            rows={2}
            placeholder="Enter state-level context or intelligence..."
            value={contextText}
            onChange={e => setContextText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleApplyContext(); } }}
          />
          <div className="flex flex-col gap-1">
            <button
              onClick={handleApplyContext}
              disabled={contextLoading}
              className="btn-primary text-xs px-4 whitespace-nowrap"
            >
              {contextLoading ? 'Applying...' : 'Apply Context'}
            </button>
            {contextApplied && (
              <button
                onClick={() => { setContextText(''); setContextApplied(false); setContextSignals([]); setSeatPredictions({}); fetchStateSummary().then(d => setSummary(d)); }}
                className="text-xs text-gray-400 hover:text-gray-600 underline text-center"
              >
                Reset to Baseline
              </button>
            )}
          </div>
        </div>
        {/* Context signal pills */}
        {contextSignals.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {contextSignals.map((sig, i) => (
              <div key={i} className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${sig.direction === 'positive' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                <span className="font-semibold">{sig.party}</span>
                <span>·</span>
                <span>{sig.label}</span>
                <span className="font-mono ml-1">{sig.scoreDelta >= 0 ? '+' : ''}{sig.scoreDelta}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(summary.projections)
          .sort((a, b) => b[1].seats - a[1].seats)
          .slice(0, 4)
          .map(([party, proj]) => {
            const allianceLabel = (party === 'CPM' || party === 'ISF') ? 'CPM + ISF Alliance' : null;
            return (
            <div key={party} className="card" style={{ borderTop: `4px solid ${PARTY_COLORS[party] || '#6B7280'}` }}>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">{proj.seats}</span>
                <span className="text-sm text-gray-400">seats</span>
              </div>
              <p className="font-semibold mt-1" style={{ color: PARTY_COLORS[party] || '#6B7280' }}>{party}</p>
              {allianceLabel && (
                <p className="text-xs text-red-600 font-medium mt-0.5">{allianceLabel}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Range: {proj.minSeats}–{proj.maxSeats}
              </p>
              <p className="text-xs text-gray-400">{Math.round(proj.voteShare * 100)}% vote share</p>
            </div>
          );})}
      </div>

      {/* Alliance Summary — CPM + ISF */}
      {summary.projections['CPM'] && summary.projections['ISF'] && (() => {
        const cpm = summary.projections['CPM'];
        const isf = summary.projections['ISF'];
        const allianceSeats = (cpm.seats || 0) + (isf.seats || 0);
        const allianceMin = (cpm.minSeats || 0) + (isf.minSeats || 0);
        const allianceMax = Math.min(294, (cpm.maxSeats || 0) + (isf.maxSeats || 0));
        const allianceVoteShare = ((cpm.voteShare || 0) + (isf.voteShare || 0));
        return (
          <div className="card" style={{ borderTop: '4px solid #DC2626', background: 'linear-gradient(135deg, #FEF2F2 0%, #FFF7ED 100%)' }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-bold text-red-800">Alliance: CPM + ISF (Left-ISF Front)</span>
              <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">Combined Projection</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">Combined Seats</p>
                <p className="text-2xl font-bold text-red-700">{allianceSeats}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Seat Range</p>
                <p className="text-lg font-semibold text-gray-700">{allianceMin}–{allianceMax}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Combined Vote Share</p>
                <p className="text-lg font-semibold text-gray-700">{Math.round(allianceVoteShare * 100)}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Breakdown</p>
                <p className="text-sm"><span className="font-semibold text-red-700">CPM: {cpm.seats}</span> + <span className="font-semibold text-orange-600">ISF: {isf.seats}</span></p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Highlights: Flipping Seats */}
      {flippingSeats.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-bold text-gray-800">Key Highlights</span>
            <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
              {flippingSeats.length} Seats Projected to Flip
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b">
                  <th className="pb-2 font-medium w-12">AC#</th>
                  <th className="pb-2 font-medium">Assembly</th>
                  <th className="pb-2 font-medium">District</th>
                  <th className="pb-2 font-medium">2021 Winner</th>
                  <th className="pb-2 font-medium">2026 Projected</th>
                  <th className="pb-2 font-medium text-right">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {flippingSeats.slice(0, 20).map((s: any) => {
                  const from = s.winner2021?.party || '?';
                  const to = s.leadingParty;
                  const acNum = parseInt(s.id.replace('WB-', ''));
                  return (
                    <tr key={s.id} className="hover:bg-amber-50">
                      <td className="py-1.5 font-bold text-blue-700 text-xs">{acNum}</td>
                      <td className="py-1.5 font-medium text-gray-900 text-xs">{s.name}</td>
                      <td className="py-1.5 text-gray-500 text-xs">{s.district}</td>
                      <td className="py-1.5">
                        <span className="inline-block text-xs font-bold px-2 py-0.5 rounded text-white"
                          style={{ backgroundColor: PARTY_COLORS[from] || '#6B7280' }}>{from}</span>
                      </td>
                      <td className="py-1.5">
                        <span className="text-gray-400 text-xs mr-1">→</span>
                        <span className="inline-block text-xs font-bold px-2 py-0.5 rounded text-white"
                          style={{ backgroundColor: PARTY_COLORS[to] || '#6B7280' }}>{to}</span>
                        {s.predictedWinner && (
                          <span className="text-xs text-gray-500 ml-1">{s.predictedWinner.name}</span>
                        )}
                      </td>
                      <td className="py-1.5 text-right">
                        <a href={`/constituency/${s.id}`} className="text-blue-600 hover:text-blue-800 text-xs font-medium">View →</a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {flippingSeats.length > 20 && (
            <p className="text-xs text-gray-400 mt-2">+ {flippingSeats.length - 20} more flipping seats</p>
          )}
        </div>
      )}

      {/* Close-margin seats (<5000 votes) */}
      {(() => {
        const closeSeats = allSeats
          .filter((s: any) => s.predictedMargin !== null && s.predictedMargin !== undefined && Math.abs(s.predictedMargin) < 5000)
          .sort((a: any, b: any) => Math.abs(a.predictedMargin) - Math.abs(b.predictedMargin));
        if (closeSeats.length === 0) return null;
        // Count by leading party
        const partyClose: Record<string, number> = {};
        closeSeats.forEach((s: any) => {
          const p = s.leadingParty || 'TMC';
          partyClose[p] = (partyClose[p] || 0) + 1;
        });
        return (
          <div className="card" style={{ borderTop: '4px solid #DC2626' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-bold text-gray-800">Razor-Thin Margins</span>
              <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">
                {closeSeats.length} Seats with &lt;5,000 Margin
              </span>
            </div>
            <div className="flex gap-3 mb-3 flex-wrap">
              {Object.entries(partyClose).sort((a, b) => b[1] - a[1]).map(([party, count]) => (
                <span key={party} className="text-xs font-semibold px-2 py-1 rounded" style={{
                  backgroundColor: (PARTY_COLORS[party] || '#6B7280') + '20',
                  color: PARTY_COLORS[party] || '#6B7280'
                }}>
                  {party}: {count} close seat{count > 1 ? 's' : ''}
                </span>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b">
                    <th className="pb-2 font-medium w-12">AC#</th>
                    <th className="pb-2 font-medium">Assembly</th>
                    <th className="pb-2 font-medium">District</th>
                    <th className="pb-2 font-medium">Leading</th>
                    <th className="pb-2 font-medium text-right">Est. Margin</th>
                    <th className="pb-2 font-medium text-right">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {closeSeats.slice(0, 25).map((s: any) => {
                    const acNum = parseInt(s.id.replace('WB-', ''));
                    const party = s.leadingParty || 'TMC';
                    return (
                      <tr key={s.id} className="hover:bg-red-50">
                        <td className="py-1.5 font-bold text-blue-700 text-xs">{acNum}</td>
                        <td className="py-1.5 font-medium text-gray-900 text-xs">{s.name}</td>
                        <td className="py-1.5 text-gray-500 text-xs">{s.district}</td>
                        <td className="py-1.5">
                          <span className="inline-block text-xs font-bold px-2 py-0.5 rounded text-white"
                            style={{ backgroundColor: PARTY_COLORS[party] || '#6B7280' }}>{party}</span>
                        </td>
                        <td className="py-1.5 text-right">
                          <span className="text-xs font-semibold text-red-600">
                            {Math.abs(s.predictedMargin).toLocaleString()} votes
                          </span>
                        </td>
                        <td className="py-1.5 text-right">
                          <a href={`/constituency/${s.id}`} className="text-blue-600 hover:text-blue-800 text-xs font-medium">View →</a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {closeSeats.length > 25 && (
              <p className="text-xs text-gray-400 mt-2">+ {closeSeats.length - 25} more close seats</p>
            )}
          </div>
        );
      })()}

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <PartyTallyChart summary={summary} />
        </div>
        <MajorityMeter summary={summary} />
      </div>

      {/* District breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <DistrictFilter
            districts={summary.districtBreakdown}
            selected={selectedDistrict}
            onSelect={setSelectedDistrict}
          />
        </div>
        <div className="md:col-span-2 card">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            {selectedDistrict ? `${selectedDistrict} District` : 'All Districts'} Overview
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b">
                  <th className="pb-2 font-medium">District</th>
                  <th className="pb-2 font-medium text-center">Total Seats</th>
                  {['TMC', 'BJP', 'CPM', 'INC', 'ISF'].map(p => (
                    <th key={p} className="pb-2 font-medium text-center" style={{ color: PARTY_COLORS[p] }}>{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredDistricts.map(d => (
                  <tr key={d.district} className="hover:bg-gray-50">
                    <td className="py-2 font-medium text-gray-800">{d.district}</td>
                    <td className="py-2 text-center text-gray-600">{d.seats}</td>
                    {['TMC', 'BJP', 'CPM', 'INC', 'ISF'].map(p => (
                      <td key={p} className="py-2 text-center">
                        {d.partySeats[p] ? (
                          <span className="font-semibold" style={{ color: PARTY_COLORS[p] }}>
                            {d.partySeats[p]}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Assembly Seat Results */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Assembly Seat Results</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search constituency..."
              value={seatSearch}
              onChange={e => setSeatSearch(e.target.value)}
              className="border border-gray-200 rounded px-2 py-1 text-xs w-48"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b">
                <th className="pb-2 font-medium w-12">#</th>
                <th className="pb-2 font-medium">Assembly</th>
                <th className="pb-2 font-medium">District</th>
                <th className="pb-2 font-medium">Category</th>
                <th className="pb-2 font-medium">Leading Party</th>
                <th className="pb-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayedSeats.map((seat: any) => {
                const constNum = parseInt(seat.id.replace('WB-', ''));
                const ctxOverride = seatPredictions[seat.id];
                const leadingParty = ctxOverride ? ctxOverride.leadingParty : (seat.leadingParty || 'TMC');
                const winner = ctxOverride ? ctxOverride.predictedWinner : seat.predictedWinner;
                const partyColor = PARTY_COLORS[leadingParty] || '#6B7280';
                const partyChanged = ctxOverride && ctxOverride.leadingParty !== (seat.leadingParty || 'TMC');
                return (
                  <tr key={seat.id} className={partyChanged ? 'bg-amber-50 hover:bg-amber-100' : 'hover:bg-gray-50'}>
                    <td className="py-2 font-bold text-blue-700 text-xs">{constNum}</td>
                    <td className="py-2 font-medium text-gray-900">{seat.name}</td>
                    <td className="py-2 text-gray-500 text-xs">{seat.district}</td>
                    <td className="py-2 text-gray-400 text-xs">{seat.reservedCategory || 'GEN'}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold text-white" style={{ backgroundColor: partyColor }}>
                          {leadingParty}
                        </span>
                        {winner && (
                          <span className="text-xs text-gray-600">{winner.name}</span>
                        )}
                        {partyChanged && (
                          <span className="text-xs text-amber-600 font-medium">(flipped)</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 text-right">
                      <Link to={`/constituency/${seat.id}`} className="text-blue-600 hover:text-blue-800 text-xs font-medium mr-3">
                        View Results →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredSeats.length > 20 && (
          <button
            onClick={() => setShowAllSeats(!showAllSeats)}
            className="mt-3 text-blue-600 hover:text-blue-800 text-xs font-medium"
          >
            {showAllSeats ? 'Show Less' : `Show All ${filteredSeats.length} Seats`}
          </button>
        )}
      </div>

      {/* TMC State Action Plan — included in PDF export */}
      <TMCStateActionPoints
        projections={summary.projections}
        districtBreakdown={summary.districtBreakdown}
        majorityThreshold={summary.majorityThreshold}
      />

      </div> {/* end dashboard-content */}
    </div>
  );
}
