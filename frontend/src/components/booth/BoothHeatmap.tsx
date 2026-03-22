import React, { useState } from 'react';
import type { BoothData } from '../../types/prediction';
import { PARTY_COLORS } from '../../types/constituency';

interface Props {
  booths: BoothData[];
  totalBooths: number;
}

const RISK_OPACITY = { low: 0.6, medium: 0.85, high: 1.0 };

export default function BoothHeatmap({ booths, totalBooths }: Props) {
  const [hoveredBooth, setHoveredBooth] = useState<BoothData | null>(null);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Booth Heatmap</h3>
        <span className="text-xs text-gray-400">{totalBooths} total booths (showing {booths.length})</span>
      </div>
      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(28px, 1fr))' }}>
        {booths.map(booth => {
          const color = PARTY_COLORS[booth.leadingParty] || '#6B7280';
          const opacity = RISK_OPACITY[booth.swingRisk];
          return (
            <div
              key={booth.boothId}
              title={`Booth ${booth.boothNumber}: ${booth.leadingParty} (${Math.round(booth.margin * 100)}% margin, ${booth.swingRisk} swing risk)`}
              onMouseEnter={() => setHoveredBooth(booth)}
              onMouseLeave={() => setHoveredBooth(null)}
              className="w-7 h-7 rounded-sm cursor-pointer transition-transform hover:scale-110 hover:shadow-md"
              style={{ backgroundColor: color, opacity }}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 mt-3 text-xs">
        <span className="text-gray-500">Opacity: </span>
        <span style={{ opacity: 0.6 }} className="text-gray-700">&#9632; Low swing risk</span>
        <span style={{ opacity: 0.85 }} className="text-gray-700">&#9632; Medium swing risk</span>
        <span style={{ opacity: 1.0 }} className="text-gray-700">&#9632; High swing risk</span>
      </div>
      {hoveredBooth && (
        <div className="mt-3 p-2 bg-gray-50 rounded-lg text-xs text-gray-700 border">
          <strong>Booth {hoveredBooth.boothNumber}</strong> — Leading: {hoveredBooth.leadingParty} |{' '}
          Margin: {Math.round(hoveredBooth.margin * 100)}% |{' '}
          Swing Risk: <span className={hoveredBooth.swingRisk === 'high' ? 'text-red-600' : hoveredBooth.swingRisk === 'medium' ? 'text-yellow-600' : 'text-green-600'}>{hoveredBooth.swingRisk}</span> |
          Est. Voters: {hoveredBooth.estimatedVoters.toLocaleString()}
        </div>
      )}
    </div>
  );
}
