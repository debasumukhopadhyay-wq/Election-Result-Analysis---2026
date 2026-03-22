/**
 * Booth-level simulation using seeded pseudo-random generation
 * Seed based on constituency ID ensures reproducible results
 */

function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function simulateBooths({ constituency, candidateScores }) {
  const seed = parseInt(constituency.id.replace('WB-', '')) * 12345;
  const rand = seededRandom(seed);

  const numBooths = constituency.totalBooths;
  const booths = [];

  // Generate booth-level scores
  for (let i = 0; i < numBooths; i++) {
    const boothId = `${constituency.id}-B${String(i + 1).padStart(3, '0')}`;
    const estimatedVoters = Math.round(constituency.totalVoters / numBooths * (0.8 + rand() * 0.4));

    // Apply ±15% variance to constituency-level vote shares
    const boothShares = {};
    let totalShare = 0;

    candidateScores.forEach(candidate => {
      const variance = (rand() - 0.5) * 0.3; // ±15%
      const share = Math.max(0.02, candidate.predictedVoteShare + variance * candidate.predictedVoteShare);
      boothShares[candidate.party] = share;
      totalShare += share;
    });

    // Normalize
    for (const party in boothShares) {
      boothShares[party] = Math.round((boothShares[party] / totalShare) * 1000) / 1000;
    }

    // Determine leading party
    const leadingParty = Object.entries(boothShares).sort((a, b) => b[1] - a[1])[0][0];
    const secondParty = Object.entries(boothShares).sort((a, b) => b[1] - a[1])[1];

    // Swing risk (how close is the race)
    const margin = boothShares[leadingParty] - (secondParty ? secondParty[1] : 0);
    const swingRisk = margin < 0.08 ? 'high' : margin < 0.15 ? 'medium' : 'low';

    booths.push({
      boothId,
      boothNumber: i + 1,
      estimatedVoters,
      leadingParty,
      swingRisk,
      margin: Math.round(margin * 100) / 100,
      shares: boothShares
    });
  }

  // Swing scenarios
  const winner = candidateScores[0];
  const runnerUp = candidateScores[1];

  const swingScenarios = {
    base: {},
    highTurnout: {},  // Higher turnout typically favors BJP
    lowTurnout: {}    // Lower turnout typically favors TMC
  };

  candidateScores.forEach(c => {
    swingScenarios.base[c.party] = c.predictedVoteShare;

    // High turnout: slight shift towards opposition
    if (c.party === 'TMC') {
      swingScenarios.highTurnout[c.party] = Math.round((c.predictedVoteShare - 0.02) * 1000) / 1000;
    } else if (c.party === 'BJP') {
      swingScenarios.highTurnout[c.party] = Math.round((c.predictedVoteShare + 0.02) * 1000) / 1000;
    } else {
      swingScenarios.highTurnout[c.party] = c.predictedVoteShare;
    }

    // Low turnout: opposite effect
    if (c.party === 'TMC') {
      swingScenarios.lowTurnout[c.party] = Math.round((c.predictedVoteShare + 0.02) * 1000) / 1000;
    } else if (c.party === 'BJP') {
      swingScenarios.lowTurnout[c.party] = Math.round((c.predictedVoteShare - 0.02) * 1000) / 1000;
    } else {
      swingScenarios.lowTurnout[c.party] = c.predictedVoteShare;
    }
  });

  // Summary stats
  const highSwingBooths = booths.filter(b => b.swingRisk === 'high').length;
  const partyBoothCounts = {};
  booths.forEach(b => {
    partyBoothCounts[b.leadingParty] = (partyBoothCounts[b.leadingParty] || 0) + 1;
  });

  return {
    totalBooths: numBooths,
    booths: booths.slice(0, 50), // Return first 50 booths for display
    swingScenarios,
    summary: {
      highSwingBooths,
      partyBoothCounts,
      swingSensitivePercent: Math.round((highSwingBooths / numBooths) * 100)
    }
  };
}

module.exports = { simulateBooths };
