# Business Process Flows

## West Bengal Assembly Election 2026 - Process Documentation

---

## 1. Overall System Flow

```mermaid
flowchart TD
    Start([User Accesses System])
    
    Start --> Home{Home or<br/>Dashboard?}
    
    Home -->|Single Prediction| SelectConst["Select Constituency"]
    Home -->|State Overview| StateDash["View Dashboard"]
    
    SelectConst --> AddContext{Add Context?}
    AddContext -->|No| Predict["Run Prediction"]
    AddContext -->|Yes| InputContext["Input Context<br/>Recent events, incidents"]
    InputContext --> AdjustWeights{Adjust<br/>Weights?}
    AdjustWeights -->|Yes| WeightPanel["Adjust Factor Weights"]
    AdjustWeights -->|No| Predict
    WeightPanel --> Predict
    
    Predict --> ProcessPred["Process Prediction<br/>Score candidates"]
    
    ProcessPred --> AIAnalysis["AI Analysis<br/>Claude Reasoning"]
    
    AIAnalysis --> Results["Display Results"]
    
    Results --> ViewDetails{View Details?}
    ViewDetails -->|Booth Analysis| BoothView["Booth Heatmap<br/>& Swings"]
    ViewDetails -->|Improvement Path| ImprovePath["Improvement Strategy"]
    ViewDetails -->|No| Results
    
    BoothView --> Export{Export?}
    ImprovePath --> Export
    
    Export -->|Yes| PDF["Generate PDF<br/>Export"]
    Export -->|No| Done([End])
    
    PDF --> Done
    
    StateDash --> StateSummary["Load State Summary<br/>294 Seats"]
    StateSummary --> PartyTally["Show Party Tally<br/>Seat Projection"]
    PartyTally --> DrillDown{Drill Down?}
    DrillDown -->|Yes| SelectConst
    DrillDown -->|No| Done
```

---

## 2. Prediction Engine Process

```mermaid
flowchart TD
    Input["Input: Constituency<br/>& Context"]
    
    Input --> LoadData["Load Data<br/>- Candidates<br/>- Demographics<br/>- Historical Results<br/>- Booth Data"]
    
    LoadData --> CheckCache{Cache<br/>Available?}
    
    CheckCache -->|Yes| UseCached["Use Cached Data"]
    CheckCache -->|No| ProcessData["Process Data"]
    
    UseCached --> ScoreLoop["For Each Candidate"]
    ProcessData --> ScoreLoop
    
    ScoreLoop --> ScoreImage["Score Candidate Image<br/>- Local Presence<br/>- Personal Quality<br/>- Criminal Record<br/>- Education"]
    
    ScoreImage --> ScoreBrand["Score Party Brand<br/>- State Popularity<br/>- Local Strength<br/>- Media Presence"]
    
    ScoreBrand --> ScoreAnti["Score Anti-Incumbency<br/>- Ruling Party Fatigue<br/>- Personal Incumbency<br/>- Local Grievances"]
    
    ScoreAnti --> ScoreCaste["Score Caste Equation<br/>- Category Match<br/>- Community Support<br/>- Reserved Status"]
    
    ScoreCaste --> ScoreLocal["Score Local Leadership<br/>- Block President<br/>- Pradhan Alignment<br/>- Cadre Strength"]
    
    ScoreLocal --> ScoreEvents["Score Recent Events<br/>- News Analysis<br/>- Incident Impact<br/>- Context Input"]
    
    ScoreEvents --> CalculateComposite["Calculate Composite Score<br/>Weighted Sum"]
    
    CalculateComposite --> BoothSim["Run Booth Simulation<br/>Aggregate Votes"]
    
    BoothSim --> DetermineWinner["Determine Winner<br/>Highest Votes"]
    
    DetermineWinner --> CalcProbability["Calculate Winning<br/>Probability<br/>Confidence %"]
    
    CalcProbability --> AINarrative["Generate AI Narrative<br/>Claude Analysis"]
    
    AINarrative --> Output["Output: Prediction<br/>- Winner<br/>- Vote Shares<br/>- Probability<br/>- Explanation"]
    
    Output --> CacheResult["Cache Result<br/>TTL: 1 hour"]
    
    CacheResult --> End([End])
```

---

## 3. Candidate Scoring Detail

```mermaid
flowchart LR
    Candidate["Candidate Profile"]
    
    Candidate --> Image["Candidate Image<br/>Weight: 15%"]
    Candidate --> Brand["Party Brand<br/>Weight: 20%"]
    Candidate --> Anti["Anti-Incumbency<br/>Weight: 18%"]
    Candidate --> Caste["Caste Equation<br/>Weight: 22%"]
    Candidate --> Local["Local Leadership<br/>Weight: 12%"]
    Candidate --> Events["Recent Events<br/>Weight: 13%"]
    
    Image --> ImageCalc["Local: +50<br/>Quality: +45<br/>Criminal: -12<br/>Education: +7<br/>Local Res: +5<br/>Total: 0-100"]
    
    Brand --> BrandCalc["Local Strength: 60%<br/>State Brand: 40%<br/>Total: 0-100"]
    
    Anti --> AntiCalc["No Incumbent: 70<br/>-Terms *10<br/>-Risk *40<br/>-Ruling Party: -18<br/>Total: 0-100"]
    
    Caste --> CasteCalc["Base: 45<br/>+SC/ST bonus<br/>+Religion match<br/>+Caste appeal<br/>Total: 0-100"]
    
    Local --> LocalCalc["Block Alignment<br/>Pradhan Support<br/>Cadre Strength<br/>Total: 0-100"]
    
    Events --> EventsCalc["News Sentiment<br/>Context Impact<br/>Incident Effect<br/>Total: 0-100"]
    
    ImageCalc --> Aggregate["Aggregate Scores"]
    BrandCalc --> Aggregate
    AntiCalc --> Aggregate
    CasteCalc --> Aggregate
    LocalCalc --> Aggregate
    EventsCalc --> Aggregate
    
    Aggregate --> Weighted["Apply Weights<br/>F1*15% + F2*20% + ...<br/>F6*13%"]
    
    Weighted --> Final["Final Score<br/>0-100"]
```

---

## 4. Booth Simulation Process

```mermaid
flowchart TD
    StartBooth["Start Booth Simulation"]
    
    LoadBooths["Load Booths<br/>for Constituency"]
    
    LoadBooths --> BoothtLoop["For Each Booth"]
    
    BoothtLoop --> BootthData["Get Booth Data<br/>- Total Voters<br/>- Urban Ratio<br/>- Location"]
    
    BootthData --> BootthDem["Apply Demographics<br/>- Religion Mix<br/>- Caste Mix<br/>- Urban/Rural"]
    
    BootthDem --> BootthScore["For Each Candidate"]
    
    BootthScore --> CalcBootthVotes["Calculate Booth Votes<br/>Candidate Score *<br/>Demographic Match *<br/>Voter Turnout"]
    
    CalcBootthVotes --> StoreBootthResult["Store Booth Result"]
    
    StoreBootthResult --> BoothtEnd{More<br/>Booths?}
    
    BoothtEnd -->|Yes| BoothtLoop
    BoothtEnd -->|No| Aggregate["Aggregate All<br/>Booth Results"]
    
    Aggregate --> ConstituencyResult["Constituency Result<br/>Total Votes per Candidate"]
    
    ConstituencyResult --> DetermineWinner["Determine Winner<br/>Highest Votes"]
    
    DetermineWinner --> BoothtSimEnd([End Simulation])
```

---

## 5. State-Wide Election Simulation

```mermaid
flowchart TD
    Start["Start State Simulation"]
    
    LoadConst["Load All 294<br/>Constituencies"]
    
    LoadConst --> ConstLoop["For Each Constituency"]
    
    ConstLoop --> GetCand["Get Candidates"]
    
    GetCand --> RunPred["Run Prediction<br/>Get Winner"]
    
    RunPred --> StoreWinner["Store Winner<br/>& Party"]
    
    StoreWinner --> ConstEnd{More<br/>Const?}
    
    ConstEnd -->|Yes| ConstLoop
    ConstEnd -->|No| CountSeats["Count Seats<br/>by Party"]
    
    CountSeats --> CalcMajority["Calculate<br/>Majority<br/>Probability"]
    
    CalcMajority --> CreateScenarios["Create Scenarios<br/>- Base Case<br/>- Optimistic<br/>- Pessimistic"]
    
    CreateScenarios --> Dashboard["Generate Dashboard<br/>- Party Tally<br/>- Seat Range<br/>- Probability"]
    
    Dashboard --> End([End Simulation])
```

---

## 6. AI Reasoning Process

```mermaid
flowchart TD
    Input["Input:<br/>- Scores<br/>- Data<br/>- Context"]
    
    Input --> BuildPrompt["Build Claude Prompt<br/>- Candidate Info<br/>- All Scores<br/>- Demographics<br/>- Historical Data<br/>- Context"]
    
    BuildPrompt --> CheckToken["Check Token<br/>Count"]
    
    CheckToken --> SendClaude["Send to Claude API<br/>Anthropic"]
    
    SendClaude --> Wait["Wait for Response"]
    
    Wait --> Parse["Parse Response<br/>- Explanation<br/>- Risk Factors<br/>- Insights"]
    
    Parse --> Validate["Validate Output<br/>- Length<br/>- Format<br/>- Coherence"]
    
    Validate --> Integrate["Integrate into<br/>Prediction Report"]
    
    Integrate --> End([Return with<br/>AI Analysis])
```

---

## 7. PDF Export Process

```mermaid
flowchart TD
    ExportRequest["User Requests Export"]
    
    ExportRequest --> GatherData["Gather All Report Data<br/>- Prediction<br/>- Charts<br/>- Analysis<br/>- Metadata"]
    
    GatherData --> GenerateHTML["Generate HTML<br/>Template"]
    
    GenerateHTML --> RenderCharts["Render Charts<br/>- Vote Share<br/>- Booth Heatmap<br/>- Swing Analysis"]
    
    RenderCharts --> ConvertPDF["Convert HTML to PDF<br/>via Puppeteer"]
    
    ConvertPDF --> AddMetadata["Add Metadata<br/>- Date<br/>- Constituency<br/>- Disclaimer"]
    
    AddMetadata --> Sign["Add Digital<br/>Signature/Hash"]
    
    Sign --> ReturnFile["Return PDF File<br/>to Browser"]
    
    ReturnFile --> Download["User Downloads<br/>PDF"]
```

---

## 8. Data Refresh & Cache Invalidation

```mermaid
flowchart TD
    Start["System Running"]
    
    Monitor["Monitor Cache<br/>Expiry"]
    
    Monitor --> Check{Cache<br/>TTL<br/>Expired?}
    
    Check -->|No| Wait["Wait Next Cycle"]
    Wait --> Monitor
    
    Check -->|Yes| Invalidate["Invalidate Cache<br/>Entry"]
    
    Invalidate --> Refresh{Automatic<br/>Refresh?}
    
    Refresh -->|Yes| RecompPred["Recompute<br/>Prediction"]
    Refresh -->|No| Ready["Mark as<br/>Expired"]
    
    RecompPred --> CacheNew["Cache New Result<br/>New TTL"]
    Ready --> WaitUser["Wait for<br/>User Request"]
    
    CacheNew --> Monitor
    WaitUser --> Monitor
```

---

## 9. Error Recovery Process

```mermaid
flowchart TD
    Error["Error Occurs<br/>in Process"]
    
    Error --> Log["Log Error<br/>- Type<br/>- Stack<br/>- Context"]
    
    Log --> Classify["Classify Error"]
    
    Classify --> IsRetryable{Retryable?}
    
    IsRetryable -->|Yes| Retry["Retry Logic<br/>Exponential Backoff"]
    IsRetryable -->|No| Fallback["Use Fallback<br/>- Cached Data<br/>- Previous Result"]
    
    Retry --> RetrySuccess{Success?}
    
    RetrySuccess -->|Yes| Complete["Complete<br/>Process"]
    RetrySuccess -->|No| Fallback
    
    Fallback --> Notify["Notify User<br/>- Degraded Service<br/>- Try Later"]
    
    Notify --> End([Return Limited<br/>Result])
```

---

## 10. User Workflow - Prediction Journey

```mermaid
graph TD
    A["👤 User Opens App"]
    
    A --> B{Select<br/>Page}
    
    B -->|Home| C["Enter Constituency"]
    B -->|Dashboard| J["View State Results"]
    
    C --> D{Add Context?}
    
    D -->|Yes| E["Input Context<br/>- Incidents<br/>- Recent News<br/>- Local Events"]
    D -->|No| F["Skip Context"]
    
    E --> G{Adjust<br/>Weights?}
    F --> G
    
    G -->|Yes| H["Configure Factors<br/>- Demography<br/>- History<br/>- Candidate<br/>- etc."]
    G -->|No| I["Use Default<br/>Weights"]
    
    H --> K["Click Predict"]
    I --> K
    
    K --> L["⏳ Processing"]
    
    L --> M["📊 View Results<br/>- Winner<br/>- Probabilities<br/>- Factors"]
    
    M --> N{Explore<br/>More?}
    
    N -->|Booth Details| O["View Heatmap<br/>& Swings"]
    N -->|Improvements| P["Strategy Report"]
    N -->|Compare| Q["Compare Scenarios"]
    N -->|Export| R["Download PDF"]
    N -->|No| S["Back to Home"]
    
    O --> M
    P --> M
    Q --> M
    R --> M
    
    S --> End["Logout"]
    
    J --> T["View 294 Seats<br/>Party Tally"]
    T --> U["Filter by District"]
    U --> V{Drill Down?}
    V -->|Yes| C
    V -->|No| End
```

