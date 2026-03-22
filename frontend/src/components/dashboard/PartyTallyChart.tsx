import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine, ResponsiveContainer } from 'recharts';
import type { StateSummary } from '../../types/dashboard';
import { PARTY_COLORS } from '../../types/constituency';

interface Props { summary: StateSummary }

export default function PartyTallyChart({ summary }: Props) {
  const data = Object.entries(summary.projections)
    .sort((a, b) => b[1].seats - a[1].seats)
    .map(([party, proj]) => ({
      party,
      seats: proj.seats,
      min: proj.minSeats,
      max: proj.maxSeats,
      voteShare: Math.round(proj.voteShare * 100)
    }));

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">Seat Projection (294 seats)</h3>
      <p className="text-xs text-gray-400 mb-4">Majority mark: {summary.majorityThreshold} seats</p>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="party" tick={{ fontSize: 12, fontWeight: 600 }} />
          <YAxis domain={[0, 200]} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value: number, name: string) => [value, name === 'seats' ? 'Projected Seats' : name]}
          />
          <ReferenceLine y={summary.majorityThreshold} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'Majority', position: 'right', fontSize: 11, fill: '#ef4444' }} />
          <Bar dataKey="seats" radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 12, fontWeight: 600 }}>
            {data.map((entry) => (
              <Cell key={entry.party} fill={PARTY_COLORS[entry.party] || '#6B7280'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
