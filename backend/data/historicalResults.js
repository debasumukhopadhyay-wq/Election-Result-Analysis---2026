// West Bengal Assembly Election - Historical Results
// Covers 2011, 2016, 2021 elections for all 294 constituencies
// Generator-based approach for realistic data at scale

const seed = (n) => {
  const x = Math.sin(n + 1) * 10000;
  return x - Math.floor(x);
};

const seededRandFloat = (n, min, max) =>
  parseFloat((seed(n) * (max - min) + min).toFixed(3));

const seededRandInt = (n, min, max) =>
  Math.floor(seed(n) * (max - min + 1)) + min;

// Candidate name pools per party for historical records
const HIST_CANDIDATES = {
  TMC:  ["Mamata Das","Sudipto Roy","Tapas Mondal","Anup Ghosh","Partha Chatterjee",
          "Firhad Ali","Sonali Roy","Debasish Mondal","Mithun Das","Kakoli Sen",
          "Arjun Mondal","Dipali Biswas","Sourav Roy","Rakesh Ghosh","Sabita Mondal"],
  BJP:  ["Suvendu Roy","Dilip Sarkar","Locket Ghosh","Arjun Biswas","Tapan Chakraborty",
          "Manas Bhuiyan","Jagannath Sarkar","Nishith Pramanik","Anirban Roy","Sabita Sen",
          "Rahul Mondal","Bikash Ghosh","Priya Das","Shankar Chakraborty","Vishwa Biswas"],
  CPM:  ["Suryakanta Misra","Mohammed Salim","Biman Bose","Asim Dasgupta","Anil Biswas",
          "Tanmay Bhattacharya","Rekha Goswami","Dipak Das","Anita Roy","Swapan Mondal",
          "Rabindranath Sen","Subhash Ghosh","Jatin Sarkar","Sanat Mondal","Prabir Biswas"],
  INC:  ["Adhir Chowdhury","Abhijit Mukherjee","Abdul Mannan","Pradip Bhattacharya",
          "Somen Mitra","Deepa Das Munshi","Anu Tanvir","Ranjit Sarkar","Minakshi Roy","Mahfuz Alam"],
  ISF:  ["Abbas Siddiqui","Naushad Siddiqui","Pirzada Siddiqui","Aminul Islam",
          "Firoz Khan","Sahidul Islam","Mofizul Haque","Rezaul Karim"],
  IND:  ["Subhas Mondal","Uttam Roy","Prabir Ghosh","Santu Das","Bapi Halder"],
};

const getHistCandName = (party, n) => {
  const pool = HIST_CANDIDATES[party] || HIST_CANDIDATES.IND;
  return pool[n % pool.length];
};

// Muslim-majority districts
const MUSLIM_MAJORITY_DISTRICTS = new Set(["Murshidabad", "Uttar Dinajpur", "Malda"]);
// Darjeeling/hill districts - Gorkha influence, BJP stronghold
const HILL_DISTRICTS = new Set(["Darjeeling"]);
// Tribal-heavy districts
const TRIBAL_DISTRICTS = new Set(["Jhargram", "Purulia", "Bankura"]);

/**
 * Generate results for a single constituency and year.
 * Returns an array of party results + turnout.
 */
const generateYearResult = (constNum, district, year) => {
  const isMuslim = MUSLIM_MAJORITY_DISTRICTS.has(district);
  const isHill   = HILL_DISTRICTS.has(district);
  const isTribal = TRIBAL_DISTRICTS.has(district);

  // Base random seeds unique per constituency+year
  const base = constNum * 1000 + year;
  const r    = seed(base + 1);
  const r2   = seed(base + 3);
  const r3   = seed(base + 5);
  const r4   = seed(base + 7);

  let winner, parties;
  let tmcShare, bjpShare, cpmShare, incShare, isfShare;

  if (year === 2021) {
    // TMC won 213; BJP won ~77; CPM/INC won a handful
    if (isMuslim) {
      // Muslim belt: TMC dominant; ISF took a few seats
      if (r > 0.88) {
        winner = "ISF";
        isfShare = seededRandFloat(base + 10, 0.40, 0.50);
        tmcShare = seededRandFloat(base + 11, 0.28, 0.38);
        bjpShare = seededRandFloat(base + 12, 0.06, 0.12);
        cpmShare = seededRandFloat(base + 13, 0.04, 0.08);
        incShare = parseFloat((1 - tmcShare - bjpShare - cpmShare - isfShare).toFixed(3));
      } else {
        winner = "TMC";
        tmcShare = seededRandFloat(base + 11, 0.46, 0.62);
        bjpShare = seededRandFloat(base + 12, 0.06, 0.14);
        cpmShare = seededRandFloat(base + 13, 0.04, 0.09);
        isfShare = seededRandFloat(base + 14, 0.06, 0.18);
        incShare = parseFloat((1 - tmcShare - bjpShare - cpmShare - isfShare).toFixed(3));
      }
    } else if (isHill) {
      // Darjeeling hills: BJP dominant
      if (r > 0.45) {
        winner = "BJP";
        bjpShare = seededRandFloat(base + 12, 0.44, 0.58);
        tmcShare = seededRandFloat(base + 11, 0.24, 0.36);
        cpmShare = seededRandFloat(base + 13, 0.06, 0.12);
        incShare = seededRandFloat(base + 14, 0.04, 0.08);
        isfShare = 0.01;
      } else {
        winner = "TMC";
        tmcShare = seededRandFloat(base + 11, 0.42, 0.52);
        bjpShare = seededRandFloat(base + 12, 0.30, 0.42);
        cpmShare = seededRandFloat(base + 13, 0.05, 0.10);
        incShare = seededRandFloat(base + 14, 0.03, 0.07);
        isfShare = 0.01;
      }
    } else {
      // General: ~73% TMC, ~27% BJP
      if (r > 0.735) {
        winner = "BJP";
        bjpShare = seededRandFloat(base + 12, 0.42, 0.54);
        tmcShare = seededRandFloat(base + 11, 0.34, 0.46);
        cpmShare = seededRandFloat(base + 13, 0.04, 0.10);
        incShare = seededRandFloat(base + 14, 0.02, 0.06);
        isfShare = 0.01;
      } else {
        winner = "TMC";
        tmcShare = seededRandFloat(base + 11, 0.46, 0.60);
        bjpShare = seededRandFloat(base + 12, 0.26, 0.40);
        cpmShare = seededRandFloat(base + 13, 0.04, 0.09);
        incShare = seededRandFloat(base + 14, 0.02, 0.05);
        isfShare = 0.01;
      }
    }

  } else if (year === 2016) {
    // TMC won 211; CPM+INC 77; BJP 3
    bjpShare = seededRandFloat(base + 12, 0.06, 0.15);  // BJP very weak
    isfShare = isMuslim ? seededRandFloat(base + 14, 0.02, 0.06) : 0.01;

    if (isMuslim) {
      if (r > 0.78) {
        winner = "INC";
        incShare = seededRandFloat(base + 14, 0.36, 0.48);
        tmcShare = seededRandFloat(base + 11, 0.32, 0.44);
        cpmShare = seededRandFloat(base + 13, 0.08, 0.14);
        isfShare = parseFloat((1 - tmcShare - bjpShare - cpmShare - incShare).toFixed(3));
      } else {
        winner = "TMC";
        tmcShare = seededRandFloat(base + 11, 0.44, 0.58);
        incShare = seededRandFloat(base + 14, 0.12, 0.24);
        cpmShare = seededRandFloat(base + 13, 0.08, 0.16);
        isfShare = parseFloat((1 - tmcShare - bjpShare - cpmShare - incShare).toFixed(3));
      }
    } else if (isHill) {
      winner = r > 0.40 ? "BJP" : "TMC";
      if (winner === "BJP") {
        bjpShare = seededRandFloat(base + 12, 0.38, 0.50);
        tmcShare = seededRandFloat(base + 11, 0.26, 0.36);
        cpmShare = seededRandFloat(base + 13, 0.12, 0.20);
        incShare = parseFloat((1 - tmcShare - bjpShare - cpmShare - isfShare).toFixed(3));
      } else {
        tmcShare = seededRandFloat(base + 11, 0.40, 0.52);
        bjpShare = seededRandFloat(base + 12, 0.22, 0.34);
        cpmShare = seededRandFloat(base + 13, 0.12, 0.22);
        incShare = parseFloat((1 - tmcShare - bjpShare - cpmShare - isfShare).toFixed(3));
      }
    } else {
      if (r > 0.72) {
        winner = r2 > 0.55 ? "CPM" : "INC";
        cpmShare = winner === "CPM" ? seededRandFloat(base + 13, 0.36, 0.48) : seededRandFloat(base + 13, 0.20, 0.30);
        incShare = winner === "INC" ? seededRandFloat(base + 14, 0.34, 0.46) : seededRandFloat(base + 14, 0.12, 0.22);
        tmcShare = seededRandFloat(base + 11, 0.28, 0.40);
      } else {
        winner = "TMC";
        tmcShare = seededRandFloat(base + 11, 0.44, 0.58);
        cpmShare = seededRandFloat(base + 13, 0.18, 0.30);
        incShare = seededRandFloat(base + 14, 0.08, 0.16);
      }
    }

  } else {
    // 2011: TMC won 184; CPM 62; INC 42; Others 6
    bjpShare = seededRandFloat(base + 12, 0.04, 0.10);  // BJP barely present
    isfShare = 0.01;

    if (isMuslim) {
      if (r > 0.55) {
        winner = "TMC";
        tmcShare = seededRandFloat(base + 11, 0.38, 0.50);
        cpmShare = seededRandFloat(base + 13, 0.22, 0.34);
        incShare = seededRandFloat(base + 14, 0.14, 0.26);
      } else if (r > 0.30) {
        winner = "CPM";
        cpmShare = seededRandFloat(base + 13, 0.38, 0.50);
        tmcShare = seededRandFloat(base + 11, 0.26, 0.38);
        incShare = seededRandFloat(base + 14, 0.12, 0.22);
      } else {
        winner = "INC";
        incShare = seededRandFloat(base + 14, 0.36, 0.48);
        tmcShare = seededRandFloat(base + 11, 0.28, 0.40);
        cpmShare = seededRandFloat(base + 13, 0.16, 0.28);
      }
    } else if (isHill) {
      if (r > 0.55) {
        winner = "TMC";
        tmcShare = seededRandFloat(base + 11, 0.36, 0.48);
        cpmShare = seededRandFloat(base + 13, 0.24, 0.36);
        incShare = seededRandFloat(base + 14, 0.10, 0.18);
      } else {
        winner = r2 > 0.5 ? "CPM" : "INC";
        cpmShare = winner === "CPM" ? seededRandFloat(base + 13, 0.36, 0.48) : seededRandFloat(base + 13, 0.22, 0.32);
        tmcShare = seededRandFloat(base + 11, 0.28, 0.40);
        incShare = winner === "INC" ? seededRandFloat(base + 14, 0.34, 0.46) : seededRandFloat(base + 14, 0.10, 0.18);
      }
    } else {
      // General 2011
      const rr = seed(base + 9);
      if (rr > 0.37) {
        winner = "TMC";
        tmcShare = seededRandFloat(base + 11, 0.40, 0.54);
        cpmShare = seededRandFloat(base + 13, 0.24, 0.36);
        incShare = seededRandFloat(base + 14, 0.08, 0.18);
      } else if (rr > 0.10) {
        winner = "CPM";
        cpmShare = seededRandFloat(base + 13, 0.38, 0.52);
        tmcShare = seededRandFloat(base + 11, 0.28, 0.40);
        incShare = seededRandFloat(base + 14, 0.08, 0.16);
      } else {
        winner = "INC";
        incShare = seededRandFloat(base + 14, 0.36, 0.48);
        tmcShare = seededRandFloat(base + 11, 0.26, 0.38);
        cpmShare = seededRandFloat(base + 13, 0.18, 0.30);
      }
    }
  }

  // Clamp all shares to [0.01, 0.90] and renormalize
  const raw = {
    TMC: Math.max(0.01, tmcShare || 0.01),
    BJP: Math.max(0.01, bjpShare || 0.01),
    CPM: Math.max(0.01, cpmShare || 0.01),
    INC: Math.max(0.01, incShare || 0.01),
    ISF: Math.max(0.01, isfShare || 0.01),
  };
  const total = Object.values(raw).reduce((a, b) => a + b, 0);
  const normalized = {};
  Object.keys(raw).forEach((p) => {
    normalized[p] = parseFloat((raw[p] / total).toFixed(3));
  });

  const turnout = seededRandFloat(base + 20, 0.78, 0.88);
  const totalVotes = seededRandInt(base + 21, 130000, 210000);

  const results = Object.entries(normalized)
    .map(([party, share]) => ({
      party,
      voteShare: share,
      votes: Math.round(share * totalVotes),
      candidate: getHistCandName(party, constNum + Object.keys(normalized).indexOf(party)),
      winner: party === winner,
    }))
    .sort((a, b) => b.voteShare - a.voteShare);

  // Compute win margin from top two
  const winMargin = results.length >= 2
    ? Math.abs(results[0].votes - results[1].votes)
    : results[0].votes;

  return { year, results, turnout, winMargin };
};

/**
 * Compute swing trend across 2011 -> 2021 for a constituency.
 */
const computeSwingTrend = (elections) => {
  const getShare = (year, party) => {
    const el = elections.find((e) => e.year === year);
    if (!el) return 0;
    const r = el.results.find((r) => r.party === party);
    return r ? r.voteShare : 0;
  };

  return {
    TMC: parseFloat((getShare(2021, "TMC") - getShare(2011, "TMC")).toFixed(3)),
    BJP: parseFloat((getShare(2021, "BJP") - getShare(2011, "BJP")).toFixed(3)),
    CPM: parseFloat((getShare(2021, "CPM") - getShare(2011, "CPM")).toFixed(3)),
    INC: parseFloat((getShare(2021, "INC") - getShare(2011, "INC")).toFixed(3)),
    ISF: parseFloat((getShare(2021, "ISF") - getShare(2011, "ISF")).toFixed(3)),
  };
};

// District lookup (same mapping as constituencies.js)
const CONST_DISTRICT_MAP = [
  null, // index 0 unused
  // 1-9 Cooch Behar
  "Cooch Behar","Cooch Behar","Cooch Behar","Cooch Behar","Cooch Behar",
  "Cooch Behar","Cooch Behar","Cooch Behar","Cooch Behar",
  // 10-15 Alipurduar
  "Alipurduar","Alipurduar","Alipurduar","Alipurduar","Alipurduar","Jalpaiguri",
  // 16-21 Jalpaiguri
  "Jalpaiguri","Jalpaiguri","Jalpaiguri","Jalpaiguri","Jalpaiguri","Jalpaiguri",
  // 22-27 Darjeeling
  "Darjeeling","Darjeeling","Darjeeling","Darjeeling","Darjeeling","Darjeeling",
  // 28-36 Uttar Dinajpur
  "Uttar Dinajpur","Uttar Dinajpur","Uttar Dinajpur","Uttar Dinajpur","Uttar Dinajpur",
  "Uttar Dinajpur","Uttar Dinajpur","Uttar Dinajpur","Uttar Dinajpur",
  // 37-42 Dakshin Dinajpur
  "Dakshin Dinajpur","Dakshin Dinajpur","Dakshin Dinajpur","Dakshin Dinajpur","Dakshin Dinajpur","Dakshin Dinajpur",
  // 43-54 Malda (53 = Murshidabad/Farakka)
  "Malda","Malda","Malda","Malda","Malda","Malda","Malda","Malda","Malda","Malda","Murshidabad","Malda",
  // 55-76 Murshidabad
  "Murshidabad","Murshidabad","Murshidabad","Murshidabad","Murshidabad","Murshidabad",
  "Murshidabad","Murshidabad","Murshidabad","Murshidabad","Murshidabad","Murshidabad",
  "Murshidabad","Murshidabad","Murshidabad","Murshidabad","Murshidabad","Murshidabad",
  "Murshidabad","Murshidabad","Murshidabad","Murshidabad",
  // 77-93 Nadia (93 = North 24P)
  "Nadia","Nadia","Nadia","Nadia","Nadia","Nadia","Nadia","Nadia","Nadia",
  "Nadia","Nadia","Nadia","Nadia","Nadia","Nadia","Nadia","North 24 Parganas",
  // 94-126 North 24 Parganas
  "North 24 Parganas","North 24 Parganas","North 24 Parganas","North 24 Parganas",
  "North 24 Parganas","North 24 Parganas","North 24 Parganas","North 24 Parganas",
  "North 24 Parganas","North 24 Parganas","North 24 Parganas","North 24 Parganas",
  "North 24 Parganas","North 24 Parganas","North 24 Parganas","North 24 Parganas",
  "North 24 Parganas","North 24 Parganas","North 24 Parganas","North 24 Parganas",
  "North 24 Parganas","North 24 Parganas","North 24 Parganas","North 24 Parganas",
  "North 24 Parganas","North 24 Parganas","North 24 Parganas","North 24 Parganas",
  "North 24 Parganas","North 24 Parganas","North 24 Parganas","North 24 Parganas","North 24 Parganas",
  // 127-143 Kolkata (142-143 also Kolkata)
  "Kolkata","Kolkata","Kolkata","Kolkata","Kolkata","Kolkata","Kolkata","Kolkata",
  "Kolkata","Kolkata","Kolkata","Kolkata","Kolkata","Kolkata","Kolkata","Kolkata","Kolkata",
  // 144-172 South 24 Parganas
  "South 24 Parganas","South 24 Parganas","South 24 Parganas","South 24 Parganas",
  "South 24 Parganas","South 24 Parganas","South 24 Parganas","South 24 Parganas",
  "South 24 Parganas","South 24 Parganas","South 24 Parganas","South 24 Parganas",
  "South 24 Parganas","South 24 Parganas","South 24 Parganas","South 24 Parganas",
  "South 24 Parganas","South 24 Parganas","South 24 Parganas","South 24 Parganas",
  "South 24 Parganas","South 24 Parganas","South 24 Parganas","South 24 Parganas",
  "South 24 Parganas","South 24 Parganas","South 24 Parganas","South 24 Parganas","South 24 Parganas",
  // 173-190 Hooghly (174 = Howrah/Domjur)
  "Hooghly","Howrah","Hooghly","Hooghly","Hooghly","Hooghly","Hooghly","Hooghly",
  "Hooghly","Hooghly","Hooghly","Hooghly","Hooghly","Hooghly","Hooghly","Hooghly","Hooghly","Hooghly",
  // 191-206 Howrah
  "Howrah","Howrah","Howrah","Howrah","Howrah","Howrah","Howrah","Howrah",
  "Howrah","Howrah","Howrah","Howrah","Howrah","Howrah","Howrah","Howrah",
  // 207-222 Purba Medinipur
  "Purba Medinipur","Purba Medinipur","Purba Medinipur","Purba Medinipur",
  "Purba Medinipur","Purba Medinipur","Purba Medinipur","Purba Medinipur",
  "Purba Medinipur","Purba Medinipur","Purba Medinipur","Purba Medinipur",
  "Purba Medinipur","Purba Medinipur","Purba Medinipur","Purba Medinipur",
  // 223-237 Jhargram + Paschim Medinipur
  "Jhargram","Jhargram","Jhargram","Jhargram",
  "Paschim Medinipur","Paschim Medinipur","Paschim Medinipur","Paschim Medinipur","Paschim Medinipur",
  "Paschim Medinipur","Paschim Medinipur","Paschim Medinipur","Paschim Medinipur","Paschim Medinipur","Paschim Medinipur",
  // 238-249 Bankura
  "Bankura","Bankura","Bankura","Bankura","Bankura","Bankura",
  "Bankura","Bankura","Bankura","Bankura","Bankura","Bankura",
  // 250-258 Purulia
  "Purulia","Purulia","Purulia","Purulia","Purulia","Purulia","Purulia","Purulia","Purulia",
  // 259-270 Purba Bardhaman
  "Purba Bardhaman","Purba Bardhaman","Purba Bardhaman","Purba Bardhaman",
  "Purba Bardhaman","Purba Bardhaman","Purba Bardhaman","Purba Bardhaman",
  "Purba Bardhaman","Purba Bardhaman","Purba Bardhaman","Purba Bardhaman",
  // 271-279 Paschim Bardhaman
  "Paschim Bardhaman","Paschim Bardhaman","Paschim Bardhaman","Paschim Bardhaman",
  "Paschim Bardhaman","Paschim Bardhaman","Paschim Bardhaman","Paschim Bardhaman","Paschim Bardhaman",
  // 280-290 Birbhum
  "Birbhum","Birbhum","Birbhum","Birbhum","Birbhum",
  "Birbhum","Birbhum","Birbhum","Birbhum","Birbhum","Birbhum",
  // 291-294 Murshidabad overflow
  "Murshidabad","Murshidabad","Murshidabad","Murshidabad",
];

// Build the full historical results object
const historicalResults = {};

for (let num = 1; num <= 294; num++) {
  const id = `WB-${String(num).padStart(3, "0")}`;
  const district = CONST_DISTRICT_MAP[num] || "Murshidabad";

  const elections = [
    generateYearResult(num, district, 2021),
    generateYearResult(num, district, 2016),
    generateYearResult(num, district, 2011),
  ];

  historicalResults[id] = {
    elections,
    swingTrend: computeSwingTrend(elections),
  };
}

module.exports = historicalResults;
