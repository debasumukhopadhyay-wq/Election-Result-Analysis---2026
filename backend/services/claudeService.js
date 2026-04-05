const Anthropic = require('@anthropic-ai/sdk');

let client = null;

function getClient() {
  if (!client && process.env.ANTHROPIC_API_KEY) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

function generateFallbackReasoning({ constituencyName, candidateScores, historicalData }) {
  const winner = candidateScores[0];
  const runnerUp = candidateScores[1];

  const narrative = `Based on quantitative analysis of ${constituencyName}, ${winner.name} (${winner.party}) is predicted to win with ${Math.round(winner.predictedVoteShare * 100)}% vote share. ` +
    `The prediction is based on a comprehensive 25-factor model incorporating caste equations, booth network strength, candidate image, alliance strategy, momentum, and more. ` +
    `${runnerUp ? `The closest challenger is ${runnerUp.name} (${runnerUp.party}) with a projected ${Math.round(runnerUp.predictedVoteShare * 100)}% vote share.` : ''} ` +
    `Historical trends in this constituency show strong support for ${winner.party}. ` +
    `The weighted scoring model suggests ${winner.party}'s organizational strength and candidate credibility give them a decisive advantage. ` +
    `Voter turnout and booth-level dynamics will be crucial in determining the final margin.`;

  const candidateInsights = {};
  candidateScores.forEach(candidate => {
    const topFactors = Object.entries(candidate.factorScores)
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, 2)
      .map(([f]) => f);

    const weakFactors = Object.entries(candidate.factorScores)
      .sort((a, b) => a[1].score - b[1].score)
      .slice(0, 2)
      .map(([f]) => f);

    candidateInsights[candidate.candidateId] = {
      strengths: [
        `Strong ${topFactors[0]?.replace(/([A-Z])/g, ' $1').toLowerCase()} score`,
        candidate.termCount > 1 ? `Experienced ${candidate.termCount}-term candidate` : 'Fresh face appeal',
        `${candidate.party} party support base`
      ],
      weaknesses: [
        `Lower ${weakFactors[0]?.replace(/([A-Z])/g, ' $1').toLowerCase()} performance`,
        candidate.antiIncumbencyRisk > 0.3 ? 'Significant anti-incumbency risk' : 'Limited brand recognition',
        candidate.criminalCases > 0 ? `${candidate.criminalCases} criminal case(s) pending` : 'Limited grassroots network'
      ],
      improvementStrategy: `Focus on strengthening booth-level organization and addressing voter concerns on local development to improve chances in ${constituencyName}.`
    };
  });

  return {
    narrative,
    keyFactors: [
      `${winner.party} historical dominance in constituency`,
      'Candidate quality and local standing',
      'Demographic alignment with voter base',
      'Party popularity at state level'
    ],
    candidateInsights,
    confidenceAdjustment: 0,
    dataQuality: 'medium',
    missingDataIndicators: ['Real-time news sentiment not analyzed', 'Booth-level granular data estimated']
  };
}

async function generateAIReasoning({ constituency, candidateScores, historicalData, demographics, contextText }) {
  const anthropic = getClient();

  if (!anthropic) {
    console.log('No Anthropic API key found, using fallback reasoning');
    return generateFallbackReasoning({ constituencyName: constituency.name, candidateScores, historicalData });
  }

  const promptData = {
    constituency: {
      name: constituency.name,
      district: constituency.district,
      region: constituency.region,
      reservedCategory: constituency.reservedCategory,
      totalVoters: constituency.totalVoters
    },
    demographics: demographics || {},
    candidateScores: candidateScores.map(c => ({
      candidateId: c.candidateId,
      name: c.name,
      party: c.party,
      totalScore: Math.round(c.totalScore * 10) / 10,
      predictedVoteShare: c.predictedVoteShare,
      factorHighlights: {
        casteEquation:    Math.round(c.factorScores.casteEquation.score),
        boothNetwork:     Math.round(c.factorScores.boothNetwork.score),
        candidateImage:   Math.round(c.factorScores.candidateImage.score),
        allianceStrategy: Math.round(c.factorScores.allianceStrategy.score),
        momentum:         Math.round(c.factorScores.momentum.score),
      }
    })),
    historicalTrend: historicalData?.swingTrend || {},
    userContext: contextText || 'No additional context provided'
  };

  // Tool schema — forces Claude to return guaranteed-valid JSON via function calling
  const ANALYSIS_TOOL = {
    name: 'provide_election_analysis',
    description: 'Provide structured election analysis for a West Bengal constituency',
    input_schema: {
      type: 'object',
      properties: {
        narrative: { type: 'string', description: '3-paragraph expert analysis of the prediction' },
        keyFactors: { type: 'array', items: { type: 'string' }, description: '3-5 key influencing factors' },
        candidateInsights: {
          type: 'object',
          description: 'Per-candidate insights keyed by candidateId',
          additionalProperties: {
            type: 'object',
            properties: {
              strengths: { type: 'array', items: { type: 'string' } },
              weaknesses: { type: 'array', items: { type: 'string' } },
              improvementStrategy: { type: 'string' }
            },
            required: ['strengths', 'weaknesses', 'improvementStrategy']
          }
        },
        confidenceAdjustment: { type: 'integer', description: 'Adjustment to confidence score (-10 to +10)' },
        dataQuality: { type: 'string', enum: ['high', 'medium', 'low'] },
        missingDataIndicators: { type: 'array', items: { type: 'string' } }
      },
      required: ['narrative', 'keyFactors', 'candidateInsights', 'confidenceAdjustment', 'dataQuality', 'missingDataIndicators']
    }
  };

  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Claude API timeout')), 45000)
    );

    const claudePromise = anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2500,
      temperature: 0.3,
      tools: [ANALYSIS_TOOL],
      tool_choice: { type: 'tool', name: 'provide_election_analysis' },
      messages: [
        {
          role: 'user',
          content: `Analyze this West Bengal constituency prediction data and call provide_election_analysis with your expert insights:

PREDICTION_DATA: ${JSON.stringify(promptData)}`
        }
      ]
    });

    const message = await Promise.race([claudePromise, timeoutPromise]);

    // Tool use response — input is guaranteed valid JSON
    const toolUse = message.content.find(b => b.type === 'tool_use');
    if (toolUse) return toolUse.input;

    console.error('No tool_use block in Claude response');
    return generateFallbackReasoning({ constituencyName: constituency.name, candidateScores, historicalData });
  } catch (error) {
    if (error.status === 429) {
      console.log('Rate limited by Claude API, waiting 2s...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      try {
        // One retry
        const retryMessage = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1500,
          temperature: 0.3,
          tools: [ANALYSIS_TOOL],
          tool_choice: { type: 'tool', name: 'provide_election_analysis' },
          messages: [{ role: 'user', content: `Analyze: ${JSON.stringify(promptData)}` }]
        });
        const retryTool = retryMessage.content.find(b => b.type === 'tool_use');
        if (retryTool) return retryTool.input;
        throw new Error('No tool_use in retry');
      } catch (retryError) {
        return generateFallbackReasoning({ constituencyName: constituency.name, candidateScores, historicalData });
      }
    }

    console.error('Claude API error:', error.message);
    return generateFallbackReasoning({ constituencyName: constituency.name, candidateScores, historicalData });
  }
}

module.exports = { generateAIReasoning };
