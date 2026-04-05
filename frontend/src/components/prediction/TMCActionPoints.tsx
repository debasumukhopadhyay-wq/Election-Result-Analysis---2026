import React from 'react';

interface CandidateScore {
  party: string;
  name: string;
  totalScore: number;
  predictedVoteShare: number;
  factorScores: Record<string, { score: number; weight: number }>;
}

interface Props {
  allCandidates: CandidateScore[];
  constituencyName: string;
}

// Map each factor to a concrete, field-level action
const FACTOR_PLAYBOOK: Record<string, {
  label: string;
  high: string;   // action when score is decent but could improve
  low: string;    // action when score is weak
}> = {
  boothNetwork: {
    label: 'Booth Network',
    low: 'Appoint a dedicated booth president + 5 active workers per booth immediately. Run daily attendance trackers and resolve booth-level complaints within 24 hours.',
    high: 'Conduct a full booth audit — identify the bottom 20% by voter-turn rate and redeploy experienced workers from strong booths to shore them up.',
  },
  casteEquation: {
    label: 'Caste Equation',
    low: 'Hold caste-wise community meetings with SC/OBC/minority leaders. Address specific welfare gaps and get written endorsements from influential community heads.',
    high: 'Leverage existing caste support to build cross-caste coalitions. Organize joint events with leaders from secondary caste groups to broaden the base.',
  },
  communityCoalition: {
    label: 'Community Coalition',
    low: 'Identify 3–5 key community organizations (trade unions, religious bodies, farmers\' groups) and formalize support agreements with concrete local promises.',
    high: 'Activate community leaders as "TMC ambassadors" in their neighbourhoods — weekly outreach calls, door-to-door visits with party workers alongside them.',
  },
  momentum: {
    label: 'Momentum (Last 10 Days)',
    low: 'Launch a 10-day rapid-response campaign: daily small rallies, voice call blasts to all registered voters, and social media live sessions with the candidate.',
    high: 'Sustain current momentum with a high-visibility final stretch — large public rally in the last 3 days and a strong get-out-the-vote push 48 hours before polling.',
  },
  candidateImage: {
    label: 'Candidate Image',
    low: 'Invest in door-to-door meet-and-greet sessions by the candidate personally — prioritise wards where approval is below average. Address criminal case perceptions proactively.',
    high: 'Amplify the candidate\'s strongest local achievements through wall paintings, local FM ads, and short video testimonials from beneficiaries.',
  },
  antiIncumbency: {
    label: 'Anti-Incumbency Management',
    low: 'Conduct a rapid "listening campaign" — public grievance booths where voters can register complaints directly. Show visible action on top 5 complaints within 1 week.',
    high: 'Reframe the incumbency narrative: highlight completed development works, inaugurate pending projects, and circulate a one-page "5-year delivery report".',
  },
  allianceStrategy: {
    label: 'Alliance Strategy',
    low: 'Urgently reach out to smaller parties and influential independent leaders for formal support. Offer concessions on ward committee representation in exchange for campaigning help.',
    high: 'Lock in alliance commitments with written seat-sharing or campaign-support MoUs. Organise joint rallies with allied party leaders to demonstrate unity.',
  },
  groundIntelligence: {
    label: 'Ground Intelligence',
    low: 'Set up a constituency-level war room with daily intel feeds from each booth. Use WhatsApp groups with booth agents to track voter sentiment in real time.',
    high: 'Upgrade the war room with daily polling simulations — call 50 voters per ward per day to track swing and adjust messaging.',
  },
  voterTurnoutStrategy: {
    label: 'Voter Turnout Strategy',
    low: 'Create a voter ID verification drive — identify unregistered or lapsed voters and ensure they are enrolled. Deploy vehicles on poll day for transport to booths.',
    high: 'Prepare ward-wise voter lists with contact numbers. Assign each party worker 100 voters to personally follow up with on election day.',
  },
  localIssuesFit: {
    label: 'Local Issues Fit',
    low: 'Commission a rapid survey (300 voters across 6 wards) to identify top 3 local grievances. Tailor the candidate\'s speech and leaflets to address them directly.',
    high: 'Run a "TMC Delivers" campaign spotlighting solved local issues — road repairs, water supply, health camp deliveries — with before/after visuals.',
  },
  electionDayManagement: {
    label: 'Election Day Management',
    low: 'Designate a trained polling agent per booth, brief them on Form 17A and objection procedures. Run a mock election-day drill 2 weeks before polling.',
    high: 'Station a sector-in-charge per 10 booths with a direct mobile line to the war room. Prepare contingency protocols for booth-capturing attempts.',
  },
  whatsappNetworks: {
    label: 'WhatsApp / Social Networks',
    low: 'Create a 3-tier WhatsApp structure: constituency → ward → booth. Share daily campaign content and track read rates to identify low-engagement areas.',
    high: 'Push targeted voter-segment content — videos for youth, audio messages for older voters. Train 50 "content volunteers" to forward and amplify.',
  },
  volunteerStrength: {
    label: 'Volunteer Strength',
    low: 'Launch a 7-day volunteer drive through party committees, student wings, and unions — target 200 additional volunteers. Assign each a specific ward.',
    high: 'Motivate existing volunteers with daily recognition, clear tasks, and milestone rewards. Ensure no volunteer sits idle — each has a specific voter list.',
  },
  campaignNarrative: {
    label: 'Campaign Narrative',
    low: 'Craft a 3-sentence core message focused on the candidate\'s strongest local achievement and future promise. Repeat it consistently across all media.',
    high: 'Test the current narrative with 3 focus groups across different wards. Refine messaging for the final stretch based on what resonates most.',
  },
  pastPerformance: {
    label: 'Track Record Communication',
    low: 'Print and distribute a factsheet listing the top 10 works completed in the constituency in the past 5 years. Door-to-door distribution in every household.',
    high: 'Convert the delivery record into a shareable video and run it on local cable networks and social media for the final 2 weeks.',
  },
  leadershipSupport: {
    label: 'Leadership Support',
    low: 'Request a high-profile TMC leader or state minister to hold at least 2 rallies in the constituency. State leadership visibility significantly lifts local morale.',
    high: 'Coordinate a CM or senior leader visit for the final 3-day sprint — a Mamata Banerjee roadshow or virtual address amplifies the closing push.',
  },
  partyBrand: {
    label: 'Party Brand',
    low: 'Distribute TMC welfare scheme beneficiary cards and organize a "TMC Guarantee" campaign highlighting state government schemes (Lakshmir Bhandar, Swasthya Sathi).',
    high: 'Conduct a "TMC Scheme Fair" where beneficiaries collect cheques / cards publicly — provides strong visual content for media and social sharing.',
  },
  microTargeting: {
    label: 'Micro-Targeting',
    low: 'Segment the voter list by age, gender, and locality. Assign ward-level teams specific voter sub-segments to contact with tailored messages.',
    high: 'Use booth-level data to identify 5% swing voters per booth. Deploy the candidate for personal visits to those specific households in the final week.',
  },
  fundingMobilisation: {
    label: 'Campaign Funding',
    low: 'Activate party donor networks and local businessmen supporters. Use funds for targeted advertising, vehicle hiring, and election-day logistics.',
    high: 'Allocate fund budgets by booth priority — more resources to competitive booths, less to safe ones. Track spend vs. impact weekly.',
  },
  socialMediaStrategy: {
    label: 'Social Media',
    low: 'Post daily on Facebook and YouTube — short (60-second) videos of the candidate meeting locals. Boost top-performing posts to reach voters in all wards.',
    high: 'Run a coordinated social media war room: 3 dedicated content creators producing 5 posts per day across platforms, with daily analytics review.',
  },
};

export default function TMCActionPoints({ allCandidates, constituencyName }: Props) {
  const tmc = allCandidates.find(c => c.party === 'TMC');
  if (!tmc) return null;

  const leader = allCandidates[0]; // highest scorer

  // Score each factor by improvement potential: weight × (100 - score) — highest = most impactful to fix
  const factorEntries = Object.entries(tmc.factorScores).map(([key, { score, weight }]) => {
    const leaderScore = leader.factorScores[key]?.score ?? score;
    const gap = Math.max(0, leaderScore - score);
    const improvementPotential = weight * (100 - score) / 100;
    return { key, score: Math.round(score), weight, gap: Math.round(gap), improvementPotential };
  });

  // Sort by improvement potential descending, take top 10
  const top10 = factorEntries
    .sort((a, b) => b.improvementPotential - a.improvementPotential)
    .slice(0, 10);

  const isWinning = tmc.party === leader.party;

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">
            TMC Action Plan — {tmc.name}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Top 10 priority actions to {isWinning ? 'strengthen the lead' : 'improve the result'} in {constituencyName}
          </p>
        </div>
        <span
          className="shrink-0 text-xs font-bold px-2 py-0.5 rounded text-white"
          style={{ backgroundColor: '#20b2aa' }}
        >
          TMC
        </span>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-4 mb-4 p-3 bg-teal-50 border border-teal-100 rounded-lg">
        <div className="text-center">
          <p className="text-xl font-bold text-teal-700">{Math.round(tmc.totalScore)}</p>
          <p className="text-xs text-gray-500">Overall Score</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-teal-700">{Math.round(tmc.predictedVoteShare * 100)}%</p>
          <p className="text-xs text-gray-500">Projected Vote</p>
        </div>
        <div className="flex-1 text-xs text-gray-600 leading-relaxed">
          {isWinning
            ? `TMC is projected to win ${constituencyName}. These actions will consolidate the lead and protect against last-minute swing.`
            : `TMC trails in ${constituencyName}. Executing these 10 actions in priority order can close the gap before polling day.`}
        </div>
      </div>

      {/* Action list */}
      <div className="space-y-2">
        {top10.map((f, i) => {
          const playbook = FACTOR_PLAYBOOK[f.key];
          const actionText = playbook
            ? (f.score < 50 ? playbook.low : playbook.high)
            : `Improve ${f.key.replace(/([A-Z])/g, ' $1').trim()} score through targeted campaign activities.`;

          const priorityLabel = i < 3 ? 'CRITICAL' : i < 6 ? 'HIGH' : 'MEDIUM';
          const priorityStyle = i < 3
            ? 'bg-red-100 text-red-800 border-red-200'
            : i < 6
            ? 'bg-amber-100 text-amber-800 border-amber-200'
            : 'bg-blue-100 text-blue-700 border-blue-200';

          return (
            <div key={f.key} className="flex gap-3 border border-gray-100 rounded-lg p-3 bg-white">
              {/* Number */}
              <div className="shrink-0 w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-xs px-1.5 py-0.5 rounded border font-bold ${priorityStyle}`}>
                    {priorityLabel}
                  </span>
                  <span className="text-xs font-semibold text-gray-800">
                    {playbook?.label ?? f.key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="text-xs text-gray-400 ml-auto">
                    Score: <span className={f.score < 50 ? 'text-red-600 font-bold' : 'text-amber-600 font-bold'}>{f.score}/100</span>
                    {f.gap > 5 && <span className="text-gray-400 ml-1">(gap: −{f.gap} vs leader)</span>}
                  </span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">{actionText}</p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 mt-3 text-center">
        Actions ranked by weighted improvement potential (factor weight × score gap). Execute in order for maximum impact.
      </p>
    </div>
  );
}
