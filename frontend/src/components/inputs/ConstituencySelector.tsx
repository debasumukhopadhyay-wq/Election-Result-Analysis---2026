import React, { useState, useEffect, useRef } from 'react';
import type { ConstituencyListItem } from '../../api/constituencyApi';

interface Props {
  constituencies: ConstituencyListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
}

export default function ConstituencySelector({ constituencies, selectedId, onSelect, loading }: Props) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = constituencies.find(c => c.id === selectedId);
  const filtered = constituencies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.district.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Assembly Constituency
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm text-left hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      >
        <span className={selected ? 'text-gray-900 font-medium' : 'text-gray-400'}>
          {loading ? 'Loading...' : selected ? `${selected.name} — ${selected.district}` : 'Select a constituency...'}
        </span>
        <svg className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-2 border-b">
            <input
              type="text"
              placeholder="Search by name or district..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <ul className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-400 text-center">No results found</li>
            ) : (
              filtered.map(c => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => { onSelect(c.id); setIsOpen(false); setSearch(''); }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors ${c.id === selectedId ? 'bg-blue-50 font-semibold text-blue-700' : 'text-gray-700'}`}
                  >
                    <span>{c.name}</span>
                    <span className="text-xs text-gray-400">{c.district}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
          <div className="px-4 py-2 border-t text-xs text-gray-400 text-right">
            {constituencies.length} total constituencies
          </div>
        </div>
      )}
    </div>
  );
}
