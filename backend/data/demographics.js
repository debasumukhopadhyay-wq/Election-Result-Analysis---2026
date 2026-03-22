// West Bengal Assembly Election 2026 - Demographics Data
// All 294 constituencies with realistic demographic profiles

const seed = (n) => {
  const x = Math.sin(n + 1) * 10000;
  return x - Math.floor(x);
};

const seededRandFloat = (n, min, max) =>
  parseFloat((seed(n) * (max - min) + min).toFixed(3));

// District-level demographic baselines
const DISTRICT_PROFILES = {
  "Cooch Behar": {
    muslimBase: 0.12, hinduBase: 0.84, christianBase: 0.01,
    scBase: 0.22, stBase: 0.04, obcBase: 0.30,
    urbanBase: 0.22, literacyBase: 0.74,
    primaryOccupation: "agriculture",
  },
  "Alipurduar": {
    muslimBase: 0.08, hinduBase: 0.82, christianBase: 0.06,
    scBase: 0.10, stBase: 0.30, obcBase: 0.28,
    urbanBase: 0.16, literacyBase: 0.68,
    primaryOccupation: "tea cultivation",
  },
  "Jalpaiguri": {
    muslimBase: 0.10, hinduBase: 0.82, christianBase: 0.04,
    scBase: 0.18, stBase: 0.18, obcBase: 0.30,
    urbanBase: 0.26, literacyBase: 0.72,
    primaryOccupation: "tea cultivation",
  },
  "Darjeeling": {
    muslimBase: 0.05, hinduBase: 0.70, christianBase: 0.12,
    scBase: 0.08, stBase: 0.28, obcBase: 0.22,
    urbanBase: 0.48, literacyBase: 0.78,
    primaryOccupation: "tea cultivation",
  },
  "Uttar Dinajpur": {
    muslimBase: 0.48, hinduBase: 0.50, christianBase: 0.01,
    scBase: 0.20, stBase: 0.06, obcBase: 0.28,
    urbanBase: 0.18, literacyBase: 0.62,
    primaryOccupation: "agriculture",
  },
  "Dakshin Dinajpur": {
    muslimBase: 0.28, hinduBase: 0.70, christianBase: 0.01,
    scBase: 0.28, stBase: 0.10, obcBase: 0.26,
    urbanBase: 0.18, literacyBase: 0.66,
    primaryOccupation: "agriculture",
  },
  "Malda": {
    muslimBase: 0.50, hinduBase: 0.48, christianBase: 0.01,
    scBase: 0.14, stBase: 0.08, obcBase: 0.30,
    urbanBase: 0.20, literacyBase: 0.62,
    primaryOccupation: "agriculture",
  },
  "Murshidabad": {
    muslimBase: 0.63, hinduBase: 0.35, christianBase: 0.01,
    scBase: 0.10, stBase: 0.02, obcBase: 0.32,
    urbanBase: 0.16, literacyBase: 0.64,
    primaryOccupation: "agriculture",
  },
  "Nadia": {
    muslimBase: 0.26, hinduBase: 0.72, christianBase: 0.01,
    scBase: 0.24, stBase: 0.02, obcBase: 0.28,
    urbanBase: 0.30, literacyBase: 0.74,
    primaryOccupation: "agriculture",
  },
  "North 24 Parganas": {
    muslimBase: 0.28, hinduBase: 0.70, christianBase: 0.01,
    scBase: 0.18, stBase: 0.02, obcBase: 0.26,
    urbanBase: 0.64, literacyBase: 0.80,
    primaryOccupation: "trade & services",
  },
  "Kolkata": {
    muslimBase: 0.22, hinduBase: 0.75, christianBase: 0.02,
    scBase: 0.12, stBase: 0.01, obcBase: 0.18,
    urbanBase: 1.00, literacyBase: 0.87,
    primaryOccupation: "trade & services",
  },
  "South 24 Parganas": {
    muslimBase: 0.32, hinduBase: 0.66, christianBase: 0.01,
    scBase: 0.20, stBase: 0.04, obcBase: 0.28,
    urbanBase: 0.32, literacyBase: 0.74,
    primaryOccupation: "agriculture",
  },
  "Hooghly": {
    muslimBase: 0.14, hinduBase: 0.84, christianBase: 0.01,
    scBase: 0.22, stBase: 0.02, obcBase: 0.28,
    urbanBase: 0.42, literacyBase: 0.78,
    primaryOccupation: "industry",
  },
  "Howrah": {
    muslimBase: 0.18, hinduBase: 0.80, christianBase: 0.01,
    scBase: 0.16, stBase: 0.02, obcBase: 0.24,
    urbanBase: 0.68, literacyBase: 0.80,
    primaryOccupation: "industry",
  },
  "Purba Medinipur": {
    muslimBase: 0.12, hinduBase: 0.86, christianBase: 0.01,
    scBase: 0.18, stBase: 0.04, obcBase: 0.30,
    urbanBase: 0.24, literacyBase: 0.76,
    primaryOccupation: "agriculture",
  },
  "Paschim Medinipur": {
    muslimBase: 0.10, hinduBase: 0.84, christianBase: 0.02,
    scBase: 0.20, stBase: 0.16, obcBase: 0.28,
    urbanBase: 0.24, literacyBase: 0.74,
    primaryOccupation: "agriculture",
  },
  "Jhargram": {
    muslimBase: 0.06, hinduBase: 0.84, christianBase: 0.04,
    scBase: 0.14, stBase: 0.40, obcBase: 0.22,
    urbanBase: 0.18, literacyBase: 0.66,
    primaryOccupation: "forest-based",
  },
  "Bankura": {
    muslimBase: 0.08, hinduBase: 0.88, christianBase: 0.01,
    scBase: 0.22, stBase: 0.18, obcBase: 0.26,
    urbanBase: 0.20, literacyBase: 0.70,
    primaryOccupation: "agriculture",
  },
  "Purulia": {
    muslimBase: 0.08, hinduBase: 0.86, christianBase: 0.03,
    scBase: 0.18, stBase: 0.34, obcBase: 0.22,
    urbanBase: 0.20, literacyBase: 0.65,
    primaryOccupation: "agriculture",
  },
  "Purba Bardhaman": {
    muslimBase: 0.16, hinduBase: 0.82, christianBase: 0.01,
    scBase: 0.24, stBase: 0.04, obcBase: 0.28,
    urbanBase: 0.36, literacyBase: 0.76,
    primaryOccupation: "agriculture",
  },
  "Paschim Bardhaman": {
    muslimBase: 0.18, hinduBase: 0.80, christianBase: 0.01,
    scBase: 0.20, stBase: 0.04, obcBase: 0.26,
    urbanBase: 0.68, literacyBase: 0.78,
    primaryOccupation: "mining & industry",
  },
  "Birbhum": {
    muslimBase: 0.36, hinduBase: 0.62, christianBase: 0.01,
    scBase: 0.24, stBase: 0.08, obcBase: 0.28,
    urbanBase: 0.18, literacyBase: 0.68,
    primaryOccupation: "agriculture",
  },
};

// District lookup for each constituency number (1-294)
const CONST_DISTRICT_MAP = [
  null, // index 0 unused
  "Cooch Behar","Cooch Behar","Cooch Behar","Cooch Behar","Cooch Behar",
  "Cooch Behar","Cooch Behar","Cooch Behar","Cooch Behar",
  "Alipurduar","Alipurduar","Alipurduar","Alipurduar","Alipurduar","Jalpaiguri",
  "Jalpaiguri","Jalpaiguri","Jalpaiguri","Jalpaiguri","Jalpaiguri","Jalpaiguri",
  "Darjeeling","Darjeeling","Darjeeling","Darjeeling","Darjeeling","Darjeeling",
  "Uttar Dinajpur","Uttar Dinajpur","Uttar Dinajpur","Uttar Dinajpur","Uttar Dinajpur",
  "Uttar Dinajpur","Uttar Dinajpur","Uttar Dinajpur","Uttar Dinajpur",
  "Dakshin Dinajpur","Dakshin Dinajpur","Dakshin Dinajpur","Dakshin Dinajpur","Dakshin Dinajpur","Dakshin Dinajpur",
  "Malda","Malda","Malda","Malda","Malda","Malda","Malda","Malda","Malda","Malda","Murshidabad","Malda",
  "Murshidabad","Murshidabad","Murshidabad","Murshidabad","Murshidabad","Murshidabad",
  "Murshidabad","Murshidabad","Murshidabad","Murshidabad","Murshidabad","Murshidabad",
  "Murshidabad","Murshidabad","Murshidabad","Murshidabad","Murshidabad","Murshidabad",
  "Murshidabad","Murshidabad","Murshidabad","Murshidabad",
  "Nadia","Nadia","Nadia","Nadia","Nadia","Nadia","Nadia","Nadia","Nadia",
  "Nadia","Nadia","Nadia","Nadia","Nadia","Nadia","Nadia","North 24 Parganas",
  "North 24 Parganas","North 24 Parganas","North 24 Parganas","North 24 Parganas",
  "North 24 Parganas","North 24 Parganas","North 24 Parganas","North 24 Parganas",
  "North 24 Parganas","North 24 Parganas","North 24 Parganas","North 24 Parganas",
  "North 24 Parganas","North 24 Parganas","North 24 Parganas","North 24 Parganas",
  "North 24 Parganas","North 24 Parganas","North 24 Parganas","North 24 Parganas",
  "North 24 Parganas","North 24 Parganas","North 24 Parganas","North 24 Parganas",
  "North 24 Parganas","North 24 Parganas","North 24 Parganas","North 24 Parganas",
  "North 24 Parganas","North 24 Parganas","North 24 Parganas","North 24 Parganas","North 24 Parganas",
  "Kolkata","Kolkata","Kolkata","Kolkata","Kolkata","Kolkata","Kolkata","Kolkata",
  "Kolkata","Kolkata","Kolkata","Kolkata","Kolkata","Kolkata","Kolkata","Kolkata","Kolkata",
  "South 24 Parganas","South 24 Parganas","South 24 Parganas","South 24 Parganas",
  "South 24 Parganas","South 24 Parganas","South 24 Parganas","South 24 Parganas",
  "South 24 Parganas","South 24 Parganas","South 24 Parganas","South 24 Parganas",
  "South 24 Parganas","South 24 Parganas","South 24 Parganas","South 24 Parganas",
  "South 24 Parganas","South 24 Parganas","South 24 Parganas","South 24 Parganas",
  "South 24 Parganas","South 24 Parganas","South 24 Parganas","South 24 Parganas",
  "South 24 Parganas","South 24 Parganas","South 24 Parganas","South 24 Parganas","South 24 Parganas",
  "Hooghly","Howrah","Hooghly","Hooghly","Hooghly","Hooghly","Hooghly","Hooghly",
  "Hooghly","Hooghly","Hooghly","Hooghly","Hooghly","Hooghly","Hooghly","Hooghly","Hooghly","Hooghly",
  "Howrah","Howrah","Howrah","Howrah","Howrah","Howrah","Howrah","Howrah",
  "Howrah","Howrah","Howrah","Howrah","Howrah","Howrah","Howrah","Howrah",
  "Purba Medinipur","Purba Medinipur","Purba Medinipur","Purba Medinipur",
  "Purba Medinipur","Purba Medinipur","Purba Medinipur","Purba Medinipur",
  "Purba Medinipur","Purba Medinipur","Purba Medinipur","Purba Medinipur",
  "Purba Medinipur","Purba Medinipur","Purba Medinipur","Purba Medinipur",
  "Jhargram","Jhargram","Jhargram","Jhargram",
  "Paschim Medinipur","Paschim Medinipur","Paschim Medinipur","Paschim Medinipur","Paschim Medinipur",
  "Paschim Medinipur","Paschim Medinipur","Paschim Medinipur","Paschim Medinipur","Paschim Medinipur","Paschim Medinipur",
  "Bankura","Bankura","Bankura","Bankura","Bankura","Bankura",
  "Bankura","Bankura","Bankura","Bankura","Bankura","Bankura",
  "Purulia","Purulia","Purulia","Purulia","Purulia","Purulia","Purulia","Purulia","Purulia",
  "Purba Bardhaman","Purba Bardhaman","Purba Bardhaman","Purba Bardhaman",
  "Purba Bardhaman","Purba Bardhaman","Purba Bardhaman","Purba Bardhaman",
  "Purba Bardhaman","Purba Bardhaman","Purba Bardhaman","Purba Bardhaman",
  "Paschim Bardhaman","Paschim Bardhaman","Paschim Bardhaman","Paschim Bardhaman",
  "Paschim Bardhaman","Paschim Bardhaman","Paschim Bardhaman","Paschim Bardhaman","Paschim Bardhaman",
  "Birbhum","Birbhum","Birbhum","Birbhum","Birbhum",
  "Birbhum","Birbhum","Birbhum","Birbhum","Birbhum","Birbhum",
  "Murshidabad","Murshidabad","Murshidabad","Murshidabad",
];

// Clamp a value to [min, max]
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// Generate demographics for a single constituency
const generateConstituencyDemographics = (num) => {
  const district = CONST_DISTRICT_MAP[num] || "Murshidabad";
  const profile = DISTRICT_PROFILES[district] || DISTRICT_PROFILES["Murshidabad"];

  // Add per-constituency variance (±12% on religious, ±8% on caste proportions)
  const muslimVariance = (seed(num * 41) - 0.5) * 0.14;
  const christianVariance = (seed(num * 43) - 0.5) * 0.04;

  let muslim = clamp(profile.muslimBase + muslimVariance, 0.02, 0.92);
  let christian = clamp(profile.christianBase + christianVariance, 0.005, 0.20);

  // Make sure religion sums to 1.0
  const other = clamp(0.005 + seed(num * 47) * 0.01, 0.005, 0.02);
  let hindu = clamp(1 - muslim - christian - other, 0.05, 0.97);

  // Re-normalize religion
  const relTotal = hindu + muslim + christian + other;
  hindu    = parseFloat((hindu / relTotal).toFixed(3));
  muslim   = parseFloat((muslim / relTotal).toFixed(3));
  christian = parseFloat((christian / relTotal).toFixed(3));
  const otherRel = parseFloat((1 - hindu - muslim - christian).toFixed(3));

  // Caste with variance
  const scVariance = (seed(num * 53) - 0.5) * 0.08;
  const stVariance = (seed(num * 59) - 0.5) * 0.08;
  const obcVariance = (seed(num * 61) - 0.5) * 0.12;

  const sc  = clamp(profile.scBase + scVariance, 0.02, 0.50);
  const st  = clamp(profile.stBase + stVariance, 0.005, 0.60);
  const obc = clamp(profile.obcBase + obcVariance, 0.08, 0.50);
  const general = clamp(1 - sc - st - obc, 0.05, 0.75);

  // Re-normalize caste
  const casteTotal = sc + st + obc + general;

  // Urban/rural with variance
  const urbanVariance = (seed(num * 67) - 0.5) * 0.18;
  const urban = clamp(profile.urbanBase + urbanVariance, 0.02, 1.00);
  const rural = parseFloat((1 - urban).toFixed(3));

  // Age profile (realistic distribution)
  const below30 = parseFloat((0.24 + (seed(num * 71) - 0.5) * 0.08).toFixed(3));
  const above50 = parseFloat((0.26 + (seed(num * 73) - 0.5) * 0.08).toFixed(3));
  const age30to50 = parseFloat(clamp(1 - below30 - above50, 0.30, 0.55).toFixed(3));

  // Literacy with variance
  const literacyVariance = (seed(num * 79) - 0.5) * 0.12;
  const literacyRate = parseFloat(clamp(profile.literacyBase + literacyVariance, 0.40, 0.95).toFixed(3));

  return {
    religion: {
      hindu,
      muslim,
      christian,
      other: parseFloat(Math.max(0, otherRel).toFixed(3)),
    },
    caste: {
      sc:      parseFloat((sc / casteTotal).toFixed(3)),
      st:      parseFloat((st / casteTotal).toFixed(3)),
      obc:     parseFloat((obc / casteTotal).toFixed(3)),
      general: parseFloat((general / casteTotal).toFixed(3)),
    },
    urbanRural: {
      urban: parseFloat(clamp(urban, 0.02, 1.00).toFixed(3)),
      rural: parseFloat(clamp(rural, 0.00, 0.98).toFixed(3)),
    },
    ageProfile: {
      below30,
      age30to50,
      above50,
    },
    literacyRate,
    primaryOccupation: profile.primaryOccupation,
  };
};

// Build the full demographics object for all 294 constituencies
const demographics = {};

for (let num = 1; num <= 294; num++) {
  const id = `WB-${String(num).padStart(3, "0")}`;
  demographics[id] = generateConstituencyDemographics(num);
}

module.exports = demographics;
