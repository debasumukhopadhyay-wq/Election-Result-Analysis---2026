# System Architecture Documentation

## West Bengal Assembly Election 2026 Prediction System

---

## 1. System Overview

```mermaid
graph TB
    Client["Frontend Client<br/>React + TypeScript"]
    API["Express.js Backend<br/>API Server"]
    Cache["Redis Cache"]
    Claude["Claude AI<br/>Reasoning Engine"]
    DB[(PostgreSQL<br/>Database)]
    
    Data["Data Services<br/>- Candidates<br/>- Constituencies<br/>- Demographics<br/>- Historical Results"]
    
    Engine["Prediction Engine<br/>Scoring & Simulation"]
    Simulator["Booth Simulator<br/>Booth-Level Analysis"]
    
    Client -->|HTTP/REST| API
    API -->|Query| Cache
    API -->|Check Cache| Cache
    API -->|Query| DB
    API -->|Get Reasoning| Claude
    API -->|Load Data| Data
    API -->|Score Candidates| Engine
    API -->|Simulate Booths| Simulator
    Engine -->|Update Cache| Cache
    Simulator -->|Update Cache| Cache
```

---

## 2. Request Flow Sequence Diagram

### Prediction Request Flow

```mermaid
sequenceDiagram
    participant User as Frontend User
    participant React as React Component
    participant API as Backend API
    participant Cache as Cache Service
    participant Engine as Prediction Engine
    participant Claude as Claude Service
    participant DB as Database
    
    User ->> React: Select Constituency
    React ->> API: POST /predict
    
    API ->> Cache: Check Cache (Constituency)
    Cache -->> API: Cache Hit/Miss
    
    alt Cache Miss
        API ->> DB: Get Constituency Data
        DB -->> API: Constituency Details
        
        API ->> DB: Get Candidates
        DB -->> API: Candidate List
        
        API ->> DB: Get Demographics
        DB -->> API: Demographic Data
        
        API ->> DB: Get Historical Results
        DB -->> API: 2011, 2016, 2021 Results
    else Cache Hit
        API ->> Cache: Retrieve All Data
        Cache -->> API: Complete Dataset
    end
    
    API ->> Engine: Calculate Scores
    Engine -->> API: Candidate Scores
    
    API ->> Claude: Generate Reasoning
    Claude -->> API: Analysis Report
    
    API ->> Cache: Store Results
    Cache -->> API: Cached
    
    API -->> React: Prediction Results
    React -->> User: Display Prediction
```

---

## 3. Candidate Scoring Sequence

```mermaid
sequenceDiagram
    participant Engine as Prediction Engine
    participant Weights as Scoring Weights
    participant Booth as Booth Simulator
    
    Engine ->> Weights: Get Factor Weights
    Weights -->> Engine: Weights Config
    
    loop For Each Candidate
        Engine ->> Engine: Score Candidate Image
        Engine ->> Engine: Score Party Brand
        Engine ->> Engine: Score Anti-Incumbency
        Engine ->> Engine: Score Caste Equation
        Engine ->> Engine: Score Local Leadership
        Engine ->> Engine: Score Recent Events
        
        Engine ->> Booth: Aggregate Booth Scores
        Booth -->> Engine: Constituency Result
        
        Engine ->> Engine: Calculate Final Score
        Engine ->> Engine: Determine Confidence
    end
```

---

## 4. Statewide Simulation Flow

```mermaid
sequenceDiagram
    participant User as User
    participant Dashboard as Dashboard Component
    participant API as Backend API
    participant Engine as Prediction Engine
    participant Simulator as Booth Simulator
    participant Cache as Cache
    
    User ->> Dashboard: Request State Summary
    Dashboard ->> API: GET /state-summary
    
    API ->> Cache: Check State Cache
    Cache -->> API: Cache Status
    
    alt Cache Miss or Outdated
        API ->> API: Loop 294 Constituencies
        
        loop Predict Each Seat
            API ->> Engine: Run Prediction
            Engine -->> API: Winning Candidate
        end
        
        API ->> Engine: Aggregate State Results
        Engine ->> Simulator: Calculate Party Tally
        Simulator -->> Engine: Seat Distribution
        
        Engine ->> Engine: Calculate Probability
        Engine -->> API: State Summary
        
        API ->> Cache: Store Results
        Cache -->> API: Cached
    else Cache Hit
        Cache -->> API: State Summary
    end
    
    API -->> Dashboard: Results
    Dashboard -->> User: Display Dashboard
```

---

## 5. AI Reasoning Integration

```mermaid
graph LR
    Context["Context Input<br/>- Free text<br/>- Recent incidents<br/>- Local news"]
    
    Engine["Prediction Engine<br/>Weighted Scores"]
    
    Claude["Claude AI Service<br/>Sonnet/Opus"]
    
    Prompt["Prompt Builder<br/>- Candidate data<br/>- Scores<br/>- Demographics<br/>- Context"]
    
    Report["Generated Report<br/>- Explanation<br/>- Risk factors<br/>- Improvement paths"]
    
    Context --> Prompt
    Engine --> Prompt
    Prompt --> Claude
    Claude --> Report
```

---

## 6. Data Layer Architecture

```mermaid
graph TB
    subgraph "Data Sources"
        DS1["Candidates Data"]
        DS2["Constituencies Data"]
        DS3["Demographics Data"]
        DS4["Historical Results<br/>2011, 2016, 2021"]
        DS5["Real 2021 Results"]
    end
    
    subgraph "Processing Layer"
        Parser["Data Parser"]
        Normalizer["Data Normalizer"]
        Mapper["Candidate Mapper"]
    end
    
    subgraph "Storage"
        Cache["Redis Cache<br/>- Predictions<br/>- Scores<br/>- State Summary"]
        DB[(PostgreSQL<br/>- Persistent Data<br/>- User Context)]
    end
    
    DS1 --> Parser
    DS2 --> Parser
    DS3 --> Parser
    DS4 --> Parser
    DS5 --> Parser
    
    Parser --> Normalizer
    Normalizer --> Mapper
    
    Mapper --> Cache
    Mapper --> DB
```

---

## 7. Component Interaction Flow

```mermaid
graph TB
    subgraph "Frontend"
        Home["Home Page"]
        Const["Constituency Page"]
        Dashboard["Dashboard Page"]
        Assembly["Assembly Results"]
        
        ConstInput["Inputs<br/>- Selector<br/>- Context Panel<br/>- Weight Adjuster"]
        
        Panels["Prediction Panels<br/>- AI Reasoning<br/>- Demographics<br/>- Election 2021<br/>- Factor Breakdown<br/>- Party Change<br/>- Swing Risk<br/>- TMC Actions<br/>- Vote Share"]
        
        Booth["Booth Analysis<br/>- Heatmap<br/>- Swing Graph"]
        
        Shared["Shared Components<br/>- Confidence Badge<br/>- Data Quality<br/>- Loading Spinner<br/>- PDF Export"]
    end
    
    subgraph "Backend Services"
        API["Express API"]
        PredictService["Prediction Service"]
        ConstService["Constituency Service"]
        CandidateService["Candidate Service"]
        SummaryService["Summary Service"]
    end
    
    Home --> ConstInput
    ConstInput --> Const
    Const --> Panels
    Const --> Booth
    Panels --> Shared
    Booth --> Shared
    
    Dashboard --> Assembly
    Assembly --> Shared
    
    ConstInput -.->|API Call| API
    Panels -.->|API Call| PredictService
    Booth -.->|API Call| ConstService
    Assembly -.->|API Call| SummaryService
    
    PredictService --> CandidateService
```

---

## 8. Error Handling Flow

```mermaid
sequenceDiagram
    participant Client as Client Request
    participant Middleware as Middleware
    participant Handler as Error Handler
    participant Logger as Logger
    participant Response as Client Response
    
    Client ->> Middleware: API Request
    
    alt Validation Error
        Middleware ->> Handler: Invalid Input
    else Rate Limit Exceeded
        Middleware ->> Handler: Rate Limit
    else Server Error
        Middleware ->> Handler: Exception
    end
    
    Handler ->> Logger: Log Error
    Logger -->> Handler: Logged
    
    Handler ->> Response: Error Response
    Response -->> Client: HTTP Error
```

---

## 9. Caching Strategy

```mermaid
graph TB
    Request["Incoming Request"]
    
    Check["Check Cache Key"]
    
    Hit["Cache Hit"]
    Miss["Cache Miss"]
    
    Return["Return Cached<br/>Response"]
    
    Compute["Compute Result"]
    Store["Store in Cache<br/>TTL: Config"]
    
    Request --> Check
    Check --> Hit
    Check --> Miss
    
    Hit --> Return
    Miss --> Compute
    Compute --> Store
    Store --> Return
    
    Return --> Client["Client"]
```

---

## 10. Deployment Architecture

```mermaid
graph TB
    subgraph "Development"
        DevFront["React Dev<br/>localhost:3000"]
        DevBack["Node Server<br/>localhost:5000"]
    end
    
    subgraph "Production - Render.com"
        FrontDeploy["Frontend App<br/>*.onrender.com"]
        BackDeploy["Backend API<br/>*.onrender.com"]
        CacheProd["Redis Cache<br/>Render"]
        DBProd[(PostgreSQL<br/>Render)]
    end
    
    subgraph "External Services"
        Claude["Anthropic Claude<br/>API"]
    end
    
    DevFront -.-> DevBack
    DevBack -.-> Claude
    
    FrontDeploy --> BackDeploy
    BackDeploy --> CacheProd
    BackDeploy --> DBProd
    BackDeploy --> Claude
```

