import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { CandidateScore } from '../../types/prediction';
import { PARTY_COLORS } from '../../types/constituency';

interface Props { candidates: CandidateScore[] }

export default function VoteShareChart({ candidates }: Props) {
  const data = candidates.map(c => ({
    name: `${c.name} (${c.party})`,
    party: c.party,
    value: Math.round(c.predictedVoteShare * 100)
  }));

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Predicted Vote Share</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={85} dataKey="value" label={({ name, value }) => `${value}%`} labelLine={false}>
            {data.map((entry) => (
              <Cell key={entry.party} fill={PARTY_COLORS[entry.party] || '#6B7280'} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => [`${value}%`, 'Vote Share']} />
          <Legend formatter={(value) => <span className="text-xs text-gray-600">{value}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
