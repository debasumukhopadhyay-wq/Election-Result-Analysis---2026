import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { BoothSimulation } from '../../types/prediction';
import { PARTY_COLORS } from '../../types/constituency';

interface Props { simulation: BoothSimulation }

export default function SwingGraph({ simulation }: Props) {
  const { swingScenarios, summary } = simulation;

  const scenarios = ['base', 'highTurnout', 'lowTurnout'] as const;
  const scenarioLabels = { base: 'Base', highTurnout: 'High Turnout', lowTurnout: 'Low Turnout' };

  const parties = Object.keys(swingScenarios.base);
  const data = scenarios.map(scenario => {
    const entry: Record<string, string | number> = { scenario: scenarioLabels[scenario] };
    parties.forEach(party => {
      entry[party] = Math.round((swingScenarios[scenario][party] || 0) * 100);
    });
    return entry;
  });

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">Turnout Swing Scenarios</h3>
      <p className="text-xs text-gray-400 mb-4">
        Swing-sensitive booths: {summary.swingSensitivePercent}% ({summary.highSwingBooths} booths)
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="scenario" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 80]} tick={{ fontSize: 11 }} unit="%" />
          <Tooltip formatter={(value: number) => [`${value}%`, '']} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {parties.slice(0, 3).map(party => (
            <Bar key={party} dataKey={party} fill={PARTY_COLORS[party] || '#6B7280'} radius={[3, 3, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
