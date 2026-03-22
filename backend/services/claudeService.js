const Anthropic = require('@anthropic-ai/sdk');

let client = null;

function getClient() {
  if (!client && process.env.ANTHROPIC_API_KEY) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

const SYSTEM_PROMPT = `You are an expert political analyst specializing in West Bengal Assembly Elections.
You analyze structured election prediction data and provide expert political insights.

You will receive JSON data with constituency information, candidate scores across 25 factors, and historical data.
You must respond with a valid JSON object matching this exact schema:
{
  "narrative": "3-paragraph string explaining the prediction in detail",
  "keyFactors": ["array of 3-5 key influencing factors as strings"],
  "candidateInsights": {
    "<candidateId>": {
      "strengths": ["array of 2-4 strength strings"],
      "weaknesses": ["array of 2-4 weakness strings"],
      "improvementStrategy": "single string with tactical advice"
    }
  },
  "confidenceAdjustment": <integer -10 to +10>,
  "dataQuality": "high" | "medium" | "low",
  "missingDataIndicators": ["array of strings listing what data is missing or uncertain"]
}

Important: Always respond with ONLY valid JSON. No markdown, no explanation outside JSON.`;

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

  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Claude API timeout')), 25000)
    );

    const claudePromise = anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      temperature: 0.3,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Analyze this West Bengal constituency prediction data and provide expert political insights:

PREDICTION_DATA: ${JSON.stringify(promptData)}

Generate the aiReasoning JSON object with narrative, keyFactors, candidateInsights, confidenceAdjustment, dataQuality, and missingDataIndicators.`
        }
      ]
    });

    const message = await Promise.race([claudePromise, timeoutPromise]);

    const responseText = message.content[0].text;

    // Parse JSON response
    try {
      const parsed = JSON.parse(responseText);
      return parsed;
    } catch (parseError) {
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      console.error('Failed to parse Claude response as JSON, using fallback');
      return generateFallbackReasoning({ constituencyName: constituency.name, candidateScores, historicalData });
    }
  } catch (error) {
    if (error.status === 429) {
      console.log('Rate limited by Claude API, waiting 2s...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      try {
        // One retry
        const retryMessage = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 1500,
          temperature: 0.3,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: `Analyze: ${JSON.stringify(promptData)}` }]
        });
        return JSON.parse(retryMessage.content[0].text);
      } catch (retryError) {
        return generateFallbackReasoning({ constituencyName: constituency.name, candidateScores, historicalData });
      }
    }

    console.error('Claude API error:', error.message);
    return generateFallbackReasoning({ constituencyName: constituency.name, candidateScores, historicalData });
  }
}

module.exports = { generateAIReasoning };
