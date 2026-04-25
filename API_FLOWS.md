# API Flows & Endpoint Documentation

## West Bengal Assembly Election 2026 - API Specification

---

## 1. API Flow Overview

```mermaid
graph TB
    subgraph "Client Requests"
        R1["Fetch Constituencies"]
        R2["Make Prediction"]
        R3["Get Candidate Details"]
        R4["Get State Summary"]
        R5["Get Improvement Strategy"]
    end
    
    subgraph "API Routes"
        RT1["GET /constituencies"]
        RT2["POST /predict"]
        RT3["GET /candidate/:id"]
        RT4["GET /state-summary"]
        RT5["POST /improve"]
    end
    
    subgraph "Services"
        S1["Constituencies Service"]
        S2["Prediction Service"]
        S3["Candidate Service"]
        S4["Summary Service"]
        S5["Improvement Service"]
    end
    
    subgraph "Data & Cache"
        D1["Constituencies Data"]
        D2["Scoring Engine"]
        D3["Candidate Data"]
        D4["Cache Layer"]
    end
    
    R1 --> RT1 --> S1 --> D1
    R2 --> RT2 --> S2 --> D2
    R3 --> RT3 --> S3 --> D3
    R4 --> RT4 --> S4 --> D4
    R5 --> RT5 --> S5 --> D2
```

---

## 2. Constituencies Endpoint Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Service
    participant Data
    participant Cache
    
    Client ->> API: GET /constituencies
    API ->> Cache: Check Cache
    Cache -->> API: Cache Miss
    
    API ->> Data: Load All Constituencies
    Data -->> API: 294 Constituencies
    
    API ->> API: Format Response
    API ->> Cache: Store (TTL: 24h)
    
    API -->> Client: {<br/>data: [...],<br/>count: 294,<br/>timestamp: <br/>}
    
    Note over Cache: Next request will hit cache
```

### Request/Response Example

```json
// GET /constituencies
{
  "data": [
    {
      "id": 1,
      "name": "Dum Dum",
      "district": "North 24 Parganas",
      "state": "West Bengal",
      "reservedCategory": "SC",
      "population": 450000,
      "literacyRate": 78
    },
    {
      "id": 2,
      "name": "Barrackpur",
      "district": "North 24 Parganas",
      ...
    }
  ],
  "count": 294,
  "timestamp": "2026-04-25T10:30:00Z"
}
```

---

## 3. Prediction Endpoint Flow

```mermaid
sequenceDiagram
    participant Client as Client
    participant API as API/Validation
    participant Cache as Cache Check
    participant Engine as Scoring Engine
    participant Claude as Claude AI
    participant Simulator as Booth Simulator
    
    Client ->> API: POST /predict<br/>{constituencyId, context}
    
    API ->> API: Validate Input
    
    alt Validation Error
        API -->> Client: 400 Bad Request
    end
    
    API ->> Cache: Check Constituency Cache
    Cache -->> API: Cache Result
    
    alt Cache Hit & No Context
        Cache ->> API: Return Cached Prediction
    else Cache Miss or Context
        API ->> Engine: Get Candidate List
        Engine -->> API: 3-4 Candidates
        
        loop Score Each Candidate
            API ->> Engine: Calculate Scores
            Engine ->> Engine: Image, Brand, Anti-Inc, etc.
            Engine -->> API: Score 0-100
        end
        
        API ->> Simulator: Get Booth Predictions
        Simulator ->> Simulator: Aggregate Booth Votes
        Simulator -->> API: Constituency Result
        
        API ->> Claude: Generate Explanation
        Claude -->> API: Analysis Report
        
        API ->> Engine: Sort Candidates
        Engine -->> API: Winner + Probabilities
        
        API ->> Cache: Store Prediction (TTL: 1h)
    end
    
    API -->> Client: {<br/>winner,<br/>candidates,<br/>explanation,<br/>confidence<br/>}
```

### Request Body
```json
POST /predict
{
  "constituencyId": 1,
  "context": "Recent local incidents affecting voter sentiment",
  "weightAdjustments": {
    "demographyMatch": 20,
    "historicalResults": 25,
    "candidateQuality": 18,
    "localLeadership": 12,
    "recentEvents": 10,
    "partyPopularity": 15
  }
}
```

### Response Body
```json
{
  "constituencyId": 1,
  "constituencyName": "Dum Dum",
  "prediction": {
    "winner": {
      "candidateId": 101,
      "name": "Candidate A",
      "party": "TMC",
      "predictedVoteShare": 42.5,
      "predictedVotes": 185000,
      "winningProbability": 78
    },
    "runners": [
      {
        "candidateId": 102,
        "name": "Candidate B",
        "party": "CPM",
        "predictedVoteShare": 35.2,
        "predictedVotes": 154000,
        "winningProbability": 18
      }
    ],
    "thirdPlace": {
      "candidateId": 103,
      "name": "Candidate C",
      "party": "BJP",
      "predictedVoteShare": 18.3,
      "predictedVotes": 80000,
      "winningProbability": 3
    }
  },
  "factors": {
    "demographyMatch": { "score": 75, "weight": 20 },
    "historicalResults": { "score": 82, "weight": 25 },
    "candidateQuality": { "score": 68, "weight": 18 },
    "localLeadership": { "score": 71, "weight": 12 },
    "recentEvents": { "score": 55, "weight": 10 },
    "partyPopularity": { "score": 79, "weight": 15 }
  },
  "aiReasoning": "Based on analysis, TMC candidate has stronger demographic appeal due to SC category reservation and improved cadre presence in urban booths. However, CPM retains significant support in rural areas.",
  "confidence": {
    "dataQuality": 85,
    "modelAccuracy": 72,
    "overallConfidence": 78
  },
  "timestamp": "2026-04-25T10:35:00Z",
  "cached": false
}
```

---

## 4. Candidate Details Endpoint Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Cache
    participant DB
    participant Engine
    
    Client ->> API: GET /candidate/{candidateId}
    
    API ->> Cache: Check Candidate Cache
    Cache -->> API: Cache Status
    
    alt Cache Miss
        API ->> DB: Query Candidate Data
        DB -->> API: Candidate Details
        
        API ->> DB: Get Historical Performance
        DB -->> API: Past Results
        
        API ->> Engine: Get Current Scores
        Engine -->> API: Scoring Details
        
        API ->> Cache: Store (TTL: 6h)
    end
    
    API -->> Client: Candidate Profile
```

### Response Example
```json
{
  "candidateId": 101,
  "name": "Candidate A",
  "party": "TMC",
  "age": 45,
  "education": "Post-Graduate",
  "criminalCases": 0,
  "popularityIndex": 8.2,
  "isLocalResident": true,
  "termCount": 2,
  "caste": "SC",
  "currentScores": {
    "candidateImage": 78,
    "partyBrand": 75,
    "antiIncumbency": 45,
    "casteEquation": 92,
    "localLeadership": 68,
    "recentEvents": 55,
    "composite": 72,
    "winningProbability": 78
  },
  "historicalPerformance": [
    { "year": 2021, "votes": 142000, "voteShare": 38.2, "position": 1 },
    { "year": 2016, "votes": 128000, "voteShare": 35.1, "position": 1 }
  ],
  "strengths": [
    "Strong SC category appeal",
    "Established local network",
    "Previous electoral success"
  ],
  "weaknesses": [
    "Anti-incumbency sentiment",
    "Urban vote erosion"
  ],
  "improvementPaths": [
    "Strengthen urban campaign",
    "Address local grievances"
  ]
}
```

---

## 5. State Summary Endpoint Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Cache as Cache/State
    participant Engine
    participant Simulator
    
    Client ->> API: GET /state-summary
    
    API ->> Cache: Check State Cache
    Cache -->> API: Cache Status
    
    alt Cache Hit & Fresh
        Cache ->> API: Return Cached Summary
    else Cache Miss or Stale
        API ->> API: Loop 294 Constituencies
        
        loop For Each Constituency
            API ->> Engine: Run Prediction
            Engine -->> API: Winner + Party
        end
        
        API ->> Simulator: Aggregate Results
        Simulator ->> Simulator: Count Seats/Party
        Simulator ->> Simulator: Calculate Majority
        Simulator -->> API: State Summary
        
        API ->> Cache: Store (TTL: 4h)
    end
    
    API -->> Client: State Dashboard
```

### Response Example
```json
{
  "statewide": {
    "totalSeats": 294,
    "resultsGenerated": 294,
    "timestamp": "2026-04-25T11:00:00Z"
  },
  "partyProjection": [
    {
      "party": "TMC",
      "predictedSeats": 156,
      "projectionRange": "140-170",
      "voteShare": 42.3,
      "majoritySeatCount": 148,
      "probabilityOfMajority": 85
    },
    {
      "party": "INDIA",
      "predictedSeats": 95,
      "projectionRange": "80-110",
      "voteShare": 35.8,
      "probabilityOfMajority": 12
    },
    {
      "party": "BJP",
      "predictedSeats": 38,
      "projectionRange": "25-50",
      "voteShare": 18.2,
      "probabilityOfMajority": 2
    },
    {
      "party": "Others",
      "predictedSeats": 5,
      "voteShare": 3.7
    }
  ],
  "scenarioAnalysis": {
    "baseCase": { "tmc": 156, "india": 95, "bjp": 38 },
    "optimisticTMC": { "tmc": 170, "india": 80, "bjp": 38 },
    "pessimisticTMC": { "tmc": 140, "india": 110, "bjp": 38 }
  },
  "majorityProbability": 0.85,
  "expectedWinner": "TMC"
}
```

---

## 6. Improvement Strategy Endpoint Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Engine
    participant Claude
    participant Simulator
    
    Client ->> API: POST /improve<br/>{candidateId, targetVotes}
    
    API ->> API: Validate Input
    
    alt Validation Error
        API -->> Client: 400 Bad Request
    end
    
    API ->> Engine: Get Current Scores
    Engine -->> API: Baseline Metrics
    
    API ->> API: Calculate Gap
    
    loop Test Improvement Scenarios
        API ->> Engine: Adjust Factor
        Engine ->> Simulator: Recalculate Booth Votes
        Simulator -->> Engine: New Vote Share
        Engine -->> API: New Winning Probability
    end
    
    API ->> Claude: Generate Strategy
    Claude -->> API: Improvement Report
    
    API -->> Client: Improvement Paths
```

### Request/Response
```json
POST /improve
{
  "candidateId": 101,
  "targetVotes": 200000
}

Response:
{
  "candidateId": 101,
  "currentPrediction": {
    "predictedVotes": 185000,
    "winningProbability": 78
  },
  "targetVotes": 200000,
  "improvementNeeded": 15000,
  "strategies": [
    {
      "factor": "candidateQuality",
      "currentScore": 68,
      "improvement": 10,
      "newProbability": 82,
      "actions": [
        "Increase media appearances",
        "Strengthen grassroots campaigning"
      ]
    },
    {
      "factor": "localLeadership",
      "currentScore": 71,
      "improvement": 8,
      "newProbability": 79,
      "actions": [
        "Build alliance with local leaders",
        "Address block-level grievances"
      ]
    }
  ]
}
```

---

## 7. Error Handling Flows

```mermaid
sequenceDiagram
    participant Client
    participant Middleware as Validation Middleware
    participant RateLimit as Rate Limiter
    participant ErrorHandler
    participant Response
    
    Client ->> Middleware: API Request
    
    alt Invalid JSON
        Middleware ->> ErrorHandler: Parse Error
    else Missing Required Fields
        Middleware ->> ErrorHandler: Validation Error
    else Unauthorized
        Middleware ->> ErrorHandler: Auth Error
    end
    
    alt Rate Limit Exceeded
        RateLimit ->> ErrorHandler: 429 Too Many Requests
    end
    
    ErrorHandler ->> Response: Format Error
    Response -->> Client: Error Response
```

### Error Response Format
```json
{
  "error": true,
  "message": "Validation Error",
  "code": "INVALID_INPUT",
  "statusCode": 400,
  "details": {
    "field": "constituencyId",
    "issue": "Required field missing"
  },
  "timestamp": "2026-04-25T10:35:00Z"
}
```

---

## 8. Caching Strategy by Endpoint

| Endpoint | Cache Key | TTL | Invalidation |
|----------|-----------|-----|--------------|
| GET /constituencies | `all_constituencies` | 24h | Manual |
| POST /predict | `prediction_{constituency}_{context_hash}` | 1h | Context change |
| GET /candidate/:id | `candidate_{candidateId}` | 6h | Manual |
| GET /state-summary | `state_summary` | 4h | Hourly refresh |
| POST /improve | `not_cached` | - | Real-time compute |

---

## 9. Rate Limiting Configuration

```mermaid
graph LR
    Request["Incoming Request"]
    Check["Check Rate Limit<br/>IP-based"]
    
    Allowed["Within Limit"]
    Exceeded["Limit Exceeded"]
    
    Process["Process Request"]
    Reject["429 Response"]
    
    Request --> Check
    Check --> Allowed
    Check --> Exceeded
    
    Allowed --> Process
    Exceeded --> Reject
    
    Process --> Response["Send Response"]
    Reject --> Response
```

**Configuration:**
- General Limit: 100 requests/minute per IP
- Prediction Endpoint: 30 requests/minute
- State Summary: 10 requests/minute
- Other Endpoints: 100 requests/minute

