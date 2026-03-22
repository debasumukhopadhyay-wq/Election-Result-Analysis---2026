import React from 'react';

interface Props { score: number; label?: string }

export default function ConfidenceBadge({ score, label = 'Confidence' }: Props) {
  const color = score >= 70 ? 'bg-green-100 text-green-800' :
                score >= 50 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>
      {label}: {score}%
    </span>
  );
}
