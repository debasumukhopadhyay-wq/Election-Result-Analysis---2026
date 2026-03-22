import React from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function ContextInput({ value, onChange }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Additional Context <span className="text-gray-400 font-normal">(optional)</span>
      </label>
      <textarea
        rows={3}
        value={value}
        onChange={e => onChange(e.target.value)}
        maxLength={1000}
        placeholder="Add recent news, local incidents, candidate information, or any other context that may influence the prediction..."
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder-gray-400"
      />
      <p className="text-xs text-gray-400 text-right mt-1">{value.length}/1000</p>
    </div>
  );
}
