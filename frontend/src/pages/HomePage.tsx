import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConstituencySelector from '../components/inputs/ConstituencySelector';
import { fetchConstituencies, type ConstituencyListItem } from '../api/constituencyApi';
import { useConstituencyStore } from '../store/constituencyStore';

export default function HomePage() {
  const navigate = useNavigate();
  const { setConstituencies } = useConstituencyStore();
  const [constituencies, setLocal] = useState<ConstituencyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchConstituencies()
      .then(data => {
        setLocal(data);
        setConstituencies(data as any);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (id: string) => {
    setSelectedId(id);
  };

  const handlePredict = () => {
    if (selectedId) navigate(`/constituency/${selectedId}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          West Bengal Assembly Election 2026
        </h2>
        <p className="text-gray-500 text-lg">
          AI-powered constituency prediction system using weighted factor analysis and Claude AI reasoning
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Seats', value: '294' },
          { label: 'Majority Mark', value: '148' },
          { label: 'Prediction Factors', value: '25' }
        ].map(stat => (
          <div key={stat.label} className="card text-center">
            <p className="text-2xl font-bold text-blue-700">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Selector */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-gray-800">Predict a Constituency</h3>
        <ConstituencySelector
          constituencies={constituencies}
          selectedId={selectedId}
          onSelect={handleSelect}
          loading={loading}
        />
        <button
          onClick={handlePredict}
          disabled={!selectedId}
          className="btn-primary w-full py-3 text-base"
        >
          Analyze Constituency
        </button>
      </div>

      {/* Features */}
      <div className="mt-8 grid grid-cols-2 gap-4">
        {[
          { title: 'Weighted Scoring', desc: '25-factor war-room model: caste equation, booth network, momentum, alliance strategy, and more' },
          { title: 'AI Reasoning', desc: 'Claude AI provides political insights and natural language reports' },
          { title: 'Booth Analysis', desc: 'Micro-level booth simulation with swing sensitivity mapping' },
          { title: 'State Dashboard', desc: '294-seat projection with party tally and majority probability' }
        ].map(f => (
          <div key={f.title} className="card">
            <h4 className="font-semibold text-gray-800 text-sm mb-1">{f.title}</h4>
            <p className="text-xs text-gray-500">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-secondary"
        >
          View Statewide Dashboard
        </button>
      </div>
    </div>
  );
}
