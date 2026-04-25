# Frontend Component Architecture

## React Component Hierarchy & Data Flow

---

## 1. Component Tree Structure

```mermaid
graph TD
    App["App<br/>Root Component"]
    
    Layout["Layout<br/>Header + Router"]
    
    Header["Header<br/>Navigation<br/>Logo"]
    
    Routes["Routes<br/>React Router"]
    
    Layout --> Header
    App --> Layout
    Layout --> Routes
    
    Routes --> Home["HomePage"]
    Routes --> Const["ConstituencyPage"]
    Routes --> Dashboard["DashboardPage"]
    Routes --> Assembly["AssemblyResultsPage"]
    
    Home --> HomeContent["Homepage Content<br/>Hero Section<br/>Quick Links"]
    
    Const --> ConstLayout["Constituency Layout"]
    
    ConstLayout --> Input["Input Section"]
    ConstLayout --> Results["Results Section"]
    ConstLayout --> Booth["Booth Section"]
    
    Input --> Selector["ConstituencySelector"]
    Input --> Context["ContextInput"]
    Input --> Influence["ContextInfluencePanel"]
    Input --> Weight["WeightAdjuster"]
    
    Results --> Winner["WinnerCard"]
    Results --> Factor["FactorBreakdown"]
    Results --> VoteShare["VoteShareChart"]
    Results --> Party["PartyChangePanel"]
    Results --> Election["Election2021Panel"]
    Results --> Demo["DemographicsPanel"]
    Results --> Swing["SwingRiskPanel"]
    Results --> AI["AIReasoningPanel"]
    Results --> TMC["TMCActionPoints"]
    
    Booth --> Heatmap["BoothHeatmap"]
    Booth --> SwingGraph["SwingGraph"]
    
    Dashboard --> Filter["DistrictFilter"]
    Dashboard --> Summary["Dashboard Summary"]
    Assembly --> Tally["PartyTallyChart"]
    Assembly --> Majority["MajorityMeter"]
    Assembly --> Action["TMCStateActionPoints"]
    
    Winner --> Shared1["Confidence Badge"]
    Factor --> Shared2["Data Quality"]
    VoteShare --> Shared3["Loading Spinner"]
    Party --> Shared4["PDF Download"]
```

---

## 2. Data Flow Architecture

```mermaid
graph TB
    subgraph "Store Layer"
        PredStore["PredictionStore<br/>- Current Prediction<br/>- Prediction History<br/>- Confidence"]
        ConstStore["ConstituencyStore<br/>- Selected Constituency<br/>- All Constituencies<br/>- Filters"]
        DashStore["DashboardStore<br/>- State Summary<br/>- Party Tally<br/>- All Results"]
    end
    
    subgraph "API Layer"
        Client["API Client<br/>Base Configuration"]
        PredAPI["PredictionAPI<br/>POST /predict"]
        ConstAPI["ConstituencyAPI<br/>GET /constituencies"]
        SummaryAPI["SummaryAPI<br/>GET /state-summary"]
    end
    
    subgraph "Components"
        Pages["Pages"]
        Inputs["Input Components"]
        Panels["Result Panels"]
        Charts["Chart Components"]
    end
    
    Pages --> PredStore
    Pages --> ConstStore
    Pages --> DashStore
    
    PredStore --> PredAPI
    ConstStore --> ConstAPI
    DashStore --> SummaryAPI
    
    Client -.->|HTTP| Backend["Backend API"]
    PredAPI -.->|HTTP| Backend
    ConstAPI -.->|HTTP| Backend
    SummaryAPI -.->|HTTP| Backend
    
    Inputs --> PredStore
    Inputs --> ConstStore
    
    Panels --> PredStore
    Charts --> DashStore
```

---

## 3. ConstituencyPage Data Flow

```mermaid
sequenceDiagram
    participant User
    participant React as React Component
    participant Store as Zustand Store
    participant API as API Client
    participant Backend as Backend
    
    User ->> React: Navigate to Constituency
    
    React ->> Store: Subscribe to Store
    Store -->> React: Initial State
    
    React ->> React: Load Selector Component
    
    User ->> React: Select Constituency
    React ->> Store: Update Selected Constituency
    Store -->> React: State Updated
    
    User ->> React: Enter Context (Optional)
    React ->> Store: Update Context
    
    User ->> React: Adjust Weights (Optional)
    React ->> Store: Update Weights
    
    User ->> React: Click Predict
    
    React ->> API: POST /predict<br/>{constituency, context, weights}
    API ->> Backend: Make Request
    Backend -->> API: Prediction Response
    API -->> React: Response Data
    
    React ->> Store: Update Prediction
    Store -->> React: New State
    
    React ->> React: Render Result Panels
    React -->> User: Display Prediction
```

---

## 4. Component Interaction Map

```mermaid
graph TB
    subgraph "Input Layer"
        Selector["ConstituencySelector<br/>Dropdown of 294"]
        ContextInput["ContextInput<br/>Text Area"]
        ContextPanel["ContextInfluencePanel<br/>Shows Impact"]
        Weight["WeightAdjuster<br/>Slider Controls"]
    end
    
    subgraph "Processing"
        State["State Management<br/>Zustand"]
        Validation["Input Validation"]
        API["API Request"]
    end
    
    subgraph "Output Layer"
        Winner["WinnerCard<br/>Winner Display"]
        Factor["FactorBreakdown<br/>Score Chart"]
        VoteShare["VoteShareChart<br/>Vote %"]
        Panels["Other Panels<br/>Demographics,<br/>2021, etc."]
        Booth["Booth Analysis"]
    end
    
    subgraph "Shared Components"
        Badge["Confidence Badge"]
        Quality["Data Quality"]
        Spinner["Loading Spinner"]
        PDF["PDF Download"]
    end
    
    Selector --> State
    ContextInput --> ContextPanel
    ContextPanel --> State
    Weight --> State
    
    State --> Validation
    Validation --> API
    API --> State
    
    State --> Winner
    State --> Factor
    State --> VoteShare
    State --> Panels
    State --> Booth
    
    Winner --> Badge
    Factor --> Quality
    VoteShare --> Badge
    Panels --> Spinner
    Booth --> PDF
```

---

## 5. Store Structure (Zustand)

```mermaid
graph LR
    subgraph "PredictionStore"
        PS1["State"]
        PS1 -->|currentPrediction| CurrPred["Prediction Object"]
        PS1 -->|selectedConstituency| SelConst["Constituency ID"]
        PS1 -->|context| Ctx["Context String"]
        PS1 -->|weights| Wts["Weight Adjustments"]
        PS1 -->|loading| Ld["Boolean"]
        PS1 -->|error| Err["Error Message"]
        
        PS2["Actions"]
        PS2 -->|setPrediction| SetPred["Update Prediction"]
        PS2 -->|setConstituency| SetConst["Select Constituency"]
        PS2 -->|setContext| SetCtx["Update Context"]
        PS2 -->|setWeights| SetWts["Update Weights"]
        PS2 -->|setLoading| SetLd["Toggle Loading"]
        PS2 -->|setError| SetErr["Set Error"]
    end
    
    subgraph "ConstituencyStore"
        CS1["State"]
        CS1 -->|constituencies| AllConst["Array of 294"]
        CS1 -->|selected| Sel["Selected ID"]
        CS1 -->|loading| Ld2["Boolean"]
        
        CS2["Actions"]
        CS2 -->|loadConstituencies| Load["Fetch from API"]
        CS2 -->|setSelected| SetSel["Set Selected"]
    end
    
    subgraph "DashboardStore"
        DS1["State"]
        DS1 -->|stateSummary| Summary["State Data"]
        DS1 -->|partyTally| Tally["Party Seats"]
        
        DS2["Actions"]
        DS2 -->|loadSummary| LoadSum["Fetch Summary"]
    end
```

---

## 6. Hooks Usage

```mermaid
graph TB
    subgraph "Custom Hooks"
        PDF["usePdfExport<br/>- Generate PDF<br/>- Handle Export<br/>- Trigger Download"]
        Fetch["useApiCall<br/>(Conceptual)<br/>- Manage Loading<br/>- Handle Errors<br/>- Cache Responses"]
        Store["useStore<br/>(Zustand)<br/>- Consume Store<br/>- Trigger Actions"]
    end
    
    subgraph "React Hooks"
        UseEffect["useEffect<br/>- Fetch on Mount<br/>- Handle Dependencies"]
        UseState["useState<br/>- Local Component State"]
        UseCallback["useCallback<br/>- Memoize Handlers"]
        UseMemo["useMemo<br/>- Memoize Computed"]
    end
    
    subgraph "Components Using Hooks"
        PredPage["PredictionPage"]
        Dashboard["Dashboard"]
        Winner["WinnerCard"]
        Charts["Chart Components"]
    end
    
    PDF --> PredPage
    Store --> PredPage
    Store --> Dashboard
    
    UseEffect --> PredPage
    UseEffect --> Dashboard
    UseCallback --> Winner
    UseMemo --> Charts
```

---

## 7. Props Flow Example: ConstituencyPage

```mermaid
flowchart TD
    ConstPage["ConstituencyPage<br/>Main Page Component"]
    
    ConstPage -->|Pass setSelected| Selector["ConstituencySelector<br/>Props: onSelect, options"]
    
    ConstPage -->|Pass onInput| CtxInput["ContextInput<br/>Props: value, onChange"]
    
    ConstPage -->|Pass onAdjust| WeightAdj["WeightAdjuster<br/>Props: weights, onWeightChange"]
    
    ConstPage -->|Pass prediction| Winner["WinnerCard<br/>Props: winner, probability"]
    
    ConstPage -->|Pass scores| Factor["FactorBreakdown<br/>Props: scores, weights"]
    
    ConstPage -->|Pass data| VoteShare["VoteShareChart<br/>Props: candidates, votes"]
    
    Selector -->|onSelect| Callback1["Update Store<br/>Set Selected Constituency"]
    CtxInput -->|onChange| Callback2["Update Store<br/>Set Context"]
    WeightAdj -->|onWeightChange| Callback3["Update Store<br/>Set Weights"]
    
    Callback1 --> TriggerPred["Trigger Prediction"]
    Callback2 --> TriggerPred
    Callback3 --> TriggerPred
    
    TriggerPred --> API["Call /predict API"]
    API --> Store["Update Store<br/>with Results"]
    Store --> Rerender["Re-render with<br/>New Props"]
    Rerender --> Winner
    Rerender --> Factor
    Rerender --> VoteShare
```

---

## 8. Error Boundary Strategy

```mermaid
graph TD
    App["App"]
    EB1["ErrorBoundary<br/>Top Level"]
    
    App --> EB1
    
    EB1 --> Layout
    
    Layout --> Page["Page Component"]
    
    Page --> Components["Child Components"]
    
    Components -->|Error| EB1
    
    EB1 -->|Catch| Display["Display Error<br/>Fallback UI"]
    
    Display --> Options["Options:<br/>- Reload<br/>- Go Home<br/>- Contact Support"]
```

---

## 9. Performance Optimization Strategies

```mermaid
graph TB
    subgraph "Memoization"
        Memo1["React.memo<br/>PanelComponents"]
        Memo2["useMemo<br/>Expensive Calculations"]
        Memo3["useCallback<br/>Event Handlers"]
    end
    
    subgraph "Code Splitting"
        Split1["Pages<br/>Lazy Loading"]
        Split2["Heavy Components<br/>Async Import"]
    end
    
    subgraph "Caching"
        Cache1["API Response<br/>Local Cache"]
        Cache2["Store State<br/>Persist"]
    end
    
    subgraph "Rendering"
        Render1["Virtual Scrolling<br/>Lists"]
        Render2["Debounced<br/>Input Handlers"]
    end
    
    Performance["Performance<br/>Optimized App"]
    
    Memo1 --> Performance
    Memo2 --> Performance
    Memo3 --> Performance
    Split1 --> Performance
    Split2 --> Performance
    Cache1 --> Performance
    Cache2 --> Performance
    Render1 --> Performance
    Render2 --> Performance
```

---

## 10. Routing Map

```mermaid
graph TB
    Root["/ (Root)"]
    
    Root --> Home["/"]
    Home -->|HomePage| HomeC["Hero + Quick Start<br/>Latest Predictions"]
    
    Root --> Const["/constituency/:id"]
    Const -->|ConstituencyPage| ConstC["Full Prediction<br/>Input + Results<br/>+ Booth Analysis"]
    
    Root --> Dashboard["/dashboard"]
    Dashboard -->|DashboardPage| DashC["State Overview<br/>294 Seats<br/>Party Tally"]
    
    Root --> Assembly["/assembly/:id"]
    Assembly -->|AssemblyResultsPage| AssemC["Assembly Results<br/>Filtered Results"]
    
    HomeC -->|Click Predict| Const
    DashC -->|Drill Down| Const
```

