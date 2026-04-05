import React from 'react';

interface Projection { seats: number; minSeats: number; maxSeats: number; voteShare: number }
interface DistrictBreakdown { district: string; seats: number; partySeats: Record<string, number> }

interface Props {
  projections: Record<string, Projection>;
  districtBreakdown: DistrictBreakdown[];
  majorityThreshold: number;
}

const STATE_ACTIONS = [
  {
    priority: 'CRITICAL',
    area: 'Minority Vote Consolidation',
    action: 'Deploy senior leaders to Muslim-majority districts (Murshidabad, Malda, Uttar Dinajpur) for direct community engagement. Ensure ISF vote-split does not erode TMC margins — explore formal seat-sharing or non-compete agreements.',
  },
  {
    priority: 'CRITICAL',
    area: 'Anti-Incumbency Counter Strategy',
    action: 'Commission a state-wide rapid assessment of unresolved constituency-level grievances. Announce a "TMC Grievance Redressal Fortnight" with CM-level visibility — resolve top 3 pending issues in each district before polling.',
  },
  {
    priority: 'CRITICAL',
    area: 'Booth Network Reinforcement',
    action: 'Identify the bottom 20% of booths by 2021 TMC turnout. Redeploy experienced senior party workers to these booths as "booth stabilisers" for the final 6 weeks. Target ≥80% booth coverage in all 294 constituencies.',
  },
  {
    priority: 'HIGH',
    area: 'Welfare Scheme Amplification',
    action: 'Run a "Mamata\'s Guarantee" campaign amplifying Lakshmir Bhandar, Swasthya Sathi, and Kanyashree schemes. Organize district-level scheme-delivery melas — visible disbursement events drive last-mile voter gratitude.',
  },
  {
    priority: 'HIGH',
    area: 'Candidate Quality Upgrade',
    action: 'In the 30+ seats where the TMC candidate scores below 55 on candidate image, strongly consider replacing with a better-regarded local figure. Weak candidate image is the single largest predictor of surprise losses.',
  },
  {
    priority: 'HIGH',
    area: 'BJP Vote Fragmentation Strategy',
    action: 'In constituencies where BJP won 35–45% in 2021, target Hindu OBC and SC voters with development-focused outreach. Highlight BJP\'s unfulfilled promises at the Centre. A 5% swing from BJP to TMC flips many seats.',
  },
  {
    priority: 'HIGH',
    area: 'Last-Mile Communication (WhatsApp & Local Media)',
    action: 'Establish a state-level digital war room producing constituency-specific content daily. Local cable TV, FM radio spots, and ward-level WhatsApp broadcasts in Bengali reaching every voter household in the final 2 weeks.',
  },
  {
    priority: 'MEDIUM',
    area: 'Alliance Formalisation',
    action: 'Finalise written seat-sharing agreements with smaller allies (AIFB, RSP, CPI allies) in close districts. Formalised alliances prevent triangular contests that split the anti-BJP vote.',
  },
  {
    priority: 'MEDIUM',
    area: 'Youth & First-Time Voter Outreach',
    action: 'Mobilise TMCP (student wing) in every college and polytechnic. Hold "Youth Conclave" events with state ministers. First-time voters (18–22) are swing voters — a focused outreach can add 2–3% in urban seats.',
  },
  {
    priority: 'MEDIUM',
    area: 'Election Day Turnout Machine',
    action: 'Prepare ward-wise voter transport plans — vehicles, volunteers, and reminders for every registered TMC supporter. A 3% higher turnout among TMC supporters can compensate for swing in nearly all competitive seats.',
  },
];

export default function TMCStateActionPoints({ projections, districtBreakdown, majorityThreshold }: Props) {
  const tmc = projections['TMC'];
  if (!tmc) return null;

  const seatsAhead = tmc.seats - majorityThreshold;
  const isOnTrack = tmc.seats >= majorityThreshold;

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">TMC State-Level Action Plan</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Top 10 priority actions to {isOnTrack ? 'protect the majority and widen the margin' : 'close the gap and cross the majority threshold'}
          </p>
        </div>
        <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded text-white" style={{ backgroundColor: '#20b2aa' }}>
          TMC
        </span>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-4 mb-4 p-3 bg-teal-50 border border-teal-100 rounded-lg">
        <div className="text-center">
          <p className="text-xl font-bold text-teal-700">{tmc.seats}</p>
          <p className="text-xs text-gray-500">Projected Seats</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-teal-700">{Math.round(tmc.voteShare * 100)}%</p>
          <p className="text-xs text-gray-500">Vote Share</p>
        </div>
        <div className="text-center">
          <p className={`text-xl font-bold ${isOnTrack ? 'text-green-700' : 'text-red-600'}`}>
            {isOnTrack ? `+${seatsAhead}` : seatsAhead}
          </p>
          <p className="text-xs text-gray-500">vs Majority ({majorityThreshold})</p>
        </div>
        <div className="flex-1 text-xs text-gray-600 leading-relaxed">
          {isOnTrack
            ? `TMC is projected to form government. Executing these 10 state-level actions will widen the margin and guard against last-minute swings in competitive seats.`
            : `TMC is ${Math.abs(seatsAhead)} seats short of majority. These actions, if executed in the next 4–6 weeks, can bridge the gap.`}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {STATE_ACTIONS.map((action, i) => {
          const priorityStyle = action.priority === 'CRITICAL'
            ? 'bg-red-100 text-red-800 border-red-200'
            : action.priority === 'HIGH'
            ? 'bg-amber-100 text-amber-800 border-amber-200'
            : 'bg-blue-100 text-blue-700 border-blue-200';

          return (
            <div key={i} className="flex gap-3 border border-gray-100 rounded-lg p-3 bg-white">
              <div className="shrink-0 w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-xs px-1.5 py-0.5 rounded border font-bold ${priorityStyle}`}>
                    {action.priority}
                  </span>
                  <span className="text-xs font-semibold text-gray-800">{action.area}</span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">{action.action}</p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 mt-3 text-center">
        Actions ranked by strategic impact across all 294 constituencies · WB Assembly Election 2026
      </p>
    </div>
  );
}
