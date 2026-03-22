import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchStateSummary } from '../api/summaryApi';
import { fetchConstituencies } from '../api/constituencyApi';
import { useDashboardStore } from '../store/dashboardStore';
import PartyTallyChart from '../components/dashboard/PartyTallyChart';
import MajorityMeter from '../components/dashboard/MajorityMeter';
import DistrictFilter from '../components/dashboard/DistrictFilter';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { PARTY_COLORS } from '../types/constituency';

export default function DashboardPage() {
  const { summary, loading, error, selectedDistrict, setSummary, setLoading, setError, setSelectedDistrict } = useDashboardStore();

  const [allSeats, setAllSeats] = useState<any[]>([]);
  const [seatSearch, setSeatSearch] = useState('');
  const [showAllSeats, setShowAllSeats] = useState(false);

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

  if (loading) return <LoadingSpinner size="lg" message="Loading statewide projections..." />;
  if (error) return (
    <div className="card border-l-4 border-red-500">
      <p className="text-red-700 font-medium">Failed to load dashboard</p>
      <p className="text-red-500 text-sm mt-1">{error}</p>
    </div>
  );
  if (!summary) return null;

  const filteredSeats = allSeats
    .filter((s: any) => !selectedDistrict || s.district === selectedDistrict)
    .filter((s: any) => !seatSearch || s.name.toLowerCase().includes(seatSearch.toLowerCase()) || s.district.toLowerCase().includes(seatSearch.toLowerCase()));

  const displayedSeats = showAllSeats ? filteredSeats : filteredSeats.slice(0, 20);

  const filteredDistricts = selectedDistrict
    ? summary.districtBreakdown.filter(d => d.district === selectedDistrict)
    : summary.districtBreakdown;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Statewide Election Dashboard</h2>
        <p className="text-gray-500 text-sm mt-1">
          West Bengal Assembly Election 2026 — 294 seats | Majority: {summary.majorityThreshold} seats
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(summary.projections)
          .sort((a, b) => b[1].seats - a[1].seats)
          .slice(0, 4)
          .map(([party, proj]) => (
            <div key={party} className="card" style={{ borderTop: `4px solid ${PARTY_COLORS[party] || '#6B7280'}` }}>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">{proj.seats}</span>
                <span className="text-sm text-gray-400">seats</span>
              </div>
              <p className="font-semibold mt-1" style={{ color: PARTY_COLORS[party] || '#6B7280' }}>{party}</p>
              <p className="text-xs text-gray-400 mt-1">
                Range: {proj.minSeats}–{proj.maxSeats}
              </p>
              <p className="text-xs text-gray-400">{Math.round(proj.voteShare * 100)}% vote share</p>
            </div>
          ))}
      </div>

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
                const leadingParty = seat.leadingParty || 'TMC';
                const partyColor = PARTY_COLORS[leadingParty] || '#6B7280';
                return (
                  <tr key={seat.id} className="hover:bg-gray-50">
                    <td className="py-2 text-gray-400 text-xs">{constNum}</td>
                    <td className="py-2 font-medium text-gray-900">{seat.name}</td>
                    <td className="py-2 text-gray-500 text-xs">{seat.district}</td>
                    <td className="py-2 text-gray-400 text-xs">{seat.reservedCategory || 'GEN'}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold text-white" style={{ backgroundColor: partyColor }}>
                          {leadingParty}
                        </span>
                        {seat.predictedWinner && (
                          <span className="text-xs text-gray-600">{seat.predictedWinner.name}</span>
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
    </div>
  );
}
