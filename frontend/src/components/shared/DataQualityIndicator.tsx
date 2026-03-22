import React from 'react';

interface Props { quality: 'high' | 'medium' | 'low'; aiEnabled?: boolean }

export default function DataQualityIndicator({ quality, aiEnabled = true }: Props) {
  const config = {
    high: { color: 'text-green-600', bg: 'bg-green-50 border-green-200', icon: '●', label: 'High Data Quality' },
    medium: { color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', icon: '◐', label: 'Medium Data Quality' },
    low: { color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: '○', label: 'Low Data Quality' }
  };
  const c = config[quality];
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${c.bg}`}>
      <span className={c.color}>{c.icon}</span>
      <span className={`font-medium ${c.color}`}>{c.label}</span>
      {!aiEnabled && <span className="text-gray-400 ml-1">· AI Unavailable</span>}
    </div>
  );
}
