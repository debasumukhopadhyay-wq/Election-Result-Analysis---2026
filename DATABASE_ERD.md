# Database Entity Relationship Diagram (ERD)

## West Bengal Assembly Election 2026 - Data Schema

---

## 1. Main ERD

```mermaid
erDiagram
    CONSTITUENCY ||--o{ CANDIDATE : has
    CONSTITUENCY ||--o{ BOOTH : contains
    CONSTITUENCY ||--o{ DEMOGRAPHICS : describes
    CONSTITUENCY ||--o{ HISTORICAL_RESULT : has
    CANDIDATE ||--o{ BOOTH_PREDICTION : contests
    BOOTH ||--o{ BOOTH_PREDICTION : produces
    
    CANDIDATE ||--o{ CANDIDATE_STRENGTH : determines
    PARTY ||--o{ CANDIDATE_STRENGTH : rates
    
    HISTORICAL_RESULT }o--|| PARTY : by
    HISTORICAL_RESULT }o--|| CANDIDATE : won_by
    
    BOOTH }o--|| CONSTITUENCY : belongs_to
    
    STATE_SUMMARY }o--|| PARTY : counts
    
    PREDICTION_CACHE ||--o{ CONSTITUENCY : caches
    USER_CONTEXT ||--|| CONSTITUENCY : for
    
    CONSTITUENCY {
        int constituency_id PK
        string name UK
        string district
        string state
        string reserved_category
        float area_sqkm
        int population
        int literacy_rate
        string created_at
    }
    
    CANDIDATE {
        int candidate_id PK
        int constituency_id FK
        string name
        string party
        int age
        string education_level
        int criminal_cases
        float popularity_index
        boolean is_local_resident
        int term_count
        string caste
        string religion
        string created_at
    }
    
    PARTY {
        int party_id PK
        string party_code UK
        string party_name
        float state_popularity
        float cadre_strength
        float media_presence
        float digital_reach
        string created_at
    }
    
    BOOTH {
        int booth_id PK
        int constituency_id FK
        int booth_number
        string location_name
        int total_voters
        float urban_ratio
        string created_at
    }
    
    DEMOGRAPHICS {
        int demographic_id PK
        int constituency_id FK
        float hindu_percent
        float muslim_percent
        float christian_percent
        float sikh_percent
        float sc_percent
        float st_percent
        float obc_percent
        float urban_ratio
        float literacy_rate
        string created_at
    }
    
    HISTORICAL_RESULT {
        int result_id PK
        int constituency_id FK
        int candidate_id FK
        int party_id FK
        int year
        int votes_received
        int total_votes_polled
        float vote_share
        float turnout
        boolean winner
        int margin
        string created_at
    }
    
    BOOTH_PREDICTION {
        int booth_prediction_id PK
        int booth_id FK
        int candidate_id FK
        int constituency_id FK
        float predicted_vote_share
        float confidence_score
        int predicted_votes
        string created_at
    }
    
    CANDIDATE_STRENGTH {
        int strength_id PK
        int candidate_id FK
        int party_id FK
        float candidate_image_score
        float party_brand_score
        float anti_incumbency_score
        float caste_equation_score
        float local_leadership_score
        float recent_events_score
        float final_composite_score
        float winning_probability
        string created_at
    }
    
    STATE_SUMMARY {
        int summary_id PK
        int party_id FK
        int predicted_seats
        int projected_seats
        float party_vote_share
        float majority_probability
        int created_at
    }
    
    PREDICTION_CACHE {
        int cache_id PK
        int constituency_id FK
        json prediction_data
        json booth_data
        float cache_timestamp
        int ttl_seconds
        string created_at
    }
    
    USER_CONTEXT {
        int context_id PK
        int constituency_id FK
        string user_id
        json context_input
        json weight_adjustments
        string created_at
    }
```

---

## 2. Core Entities Description

### CONSTITUENCY
- **Purpose**: Core unit of prediction
- **Key Fields**: constituency_id, name, district, reserved_category, population
- **Relationships**: One to Many with Candidates, Booths, Demographics, Historical Results

### CANDIDATE
- **Purpose**: Political candidates contesting from constituencies
- **Key Fields**: candidate_id, name, party, education_level, criminal_cases, popularity_index
- **Relationships**: Many to One with Constituency, One to Many with Booth Predictions

### PARTY
- **Purpose**: Political party master data
- **Key Fields**: party_code, party_name, state_popularity, cadre_strength, media_presence
- **Relationships**: Many to One with Historical Results and Candidate Strength

### BOOTH
- **Purpose**: Granular voting unit for simulation
- **Key Fields**: booth_id, booth_number, location_name, total_voters
- **Relationships**: Many to One with Constituency, One to Many with Booth Predictions

### DEMOGRAPHICS
- **Purpose**: Demographic composition for scoring
- **Key Fields**: Religion percentages, SC/ST/OBC percentages, urban_ratio, literacy_rate
- **Relationships**: One to One with Constituency

### HISTORICAL_RESULT
- **Purpose**: Past election results for trend analysis
- **Key Fields**: year (2011, 2016, 2021), votes_received, vote_share, winner flag
- **Relationships**: Many to One with Constituency, Candidate, Party

### BOOTH_PREDICTION
- **Purpose**: Booth-level prediction results
- **Key Fields**: predicted_vote_share, confidence_score, predicted_votes
- **Relationships**: Many to One with Booth, Candidate, Constituency

### CANDIDATE_STRENGTH
- **Purpose**: Composite scoring matrix
- **Key Fields**: candidate_image_score, party_brand_score, anti_incumbency_score, caste_equation_score, final_composite_score, winning_probability
- **Relationships**: One to One with Candidate

### PREDICTION_CACHE
- **Purpose**: Caching layer for performance
- **Key Fields**: prediction_data (JSON), booth_data (JSON), cache_timestamp, ttl_seconds
- **Relationships**: Many to One with Constituency

---

## 3. Detailed Schema - Table Structures

### CONSTITUENCY Table
```sql
CREATE TABLE constituency (
    constituency_id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    district VARCHAR(50) NOT NULL,
    state VARCHAR(30) NOT NULL DEFAULT 'West Bengal',
    reserved_category VARCHAR(10), -- 'SC', 'ST', or NULL
    area_sqkm FLOAT,
    population INTEGER,
    literacy_rate INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### CANDIDATE Table
```sql
CREATE TABLE candidate (
    candidate_id INTEGER PRIMARY KEY,
    constituency_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    party VARCHAR(30) NOT NULL,
    age INTEGER,
    education_level VARCHAR(30), -- 'Post-Graduate', 'Graduate', 'Intermediate', 'Below'
    criminal_cases INTEGER DEFAULT 0,
    popularity_index FLOAT DEFAULT 5,
    is_local_resident BOOLEAN DEFAULT FALSE,
    term_count INTEGER DEFAULT 0,
    caste VARCHAR(30),
    religion VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (constituency_id) REFERENCES constituency(constituency_id)
);
```

### PARTY Table
```sql
CREATE TABLE party (
    party_id INTEGER PRIMARY KEY,
    party_code VARCHAR(10) NOT NULL UNIQUE,
    party_name VARCHAR(50) NOT NULL,
    state_popularity FLOAT DEFAULT 15,
    cadre_strength FLOAT DEFAULT 10,
    media_presence FLOAT DEFAULT 10,
    digital_reach FLOAT DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### BOOTH Table
```sql
CREATE TABLE booth (
    booth_id INTEGER PRIMARY KEY,
    constituency_id INTEGER NOT NULL,
    booth_number INTEGER NOT NULL,
    location_name VARCHAR(100),
    total_voters INTEGER,
    urban_ratio FLOAT, -- 0-100, percentage
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (constituency_id) REFERENCES constituency(constituency_id),
    UNIQUE(constituency_id, booth_number)
);
```

### DEMOGRAPHICS Table
```sql
CREATE TABLE demographics (
    demographic_id INTEGER PRIMARY KEY,
    constituency_id INTEGER NOT NULL UNIQUE,
    hindu_percent FLOAT,
    muslim_percent FLOAT,
    christian_percent FLOAT,
    sikh_percent FLOAT,
    sc_percent FLOAT,
    st_percent FLOAT,
    obc_percent FLOAT,
    urban_ratio FLOAT,
    literacy_rate INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (constituency_id) REFERENCES constituency(constituency_id)
);
```

### HISTORICAL_RESULT Table
```sql
CREATE TABLE historical_result (
    result_id INTEGER PRIMARY KEY,
    constituency_id INTEGER NOT NULL,
    candidate_id INTEGER,
    party_id INTEGER,
    year INTEGER NOT NULL, -- 2011, 2016, 2021
    votes_received INTEGER,
    total_votes_polled INTEGER,
    vote_share FLOAT,
    turnout FLOAT,
    winner BOOLEAN DEFAULT FALSE,
    margin INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (constituency_id) REFERENCES constituency(constituency_id),
    FOREIGN KEY (candidate_id) REFERENCES candidate(candidate_id),
    FOREIGN KEY (party_id) REFERENCES party(party_id)
);
```

### CANDIDATE_STRENGTH Table
```sql
CREATE TABLE candidate_strength (
    strength_id INTEGER PRIMARY KEY,
    candidate_id INTEGER NOT NULL UNIQUE,
    party_id INTEGER NOT NULL,
    candidate_image_score FLOAT, -- 0-100
    party_brand_score FLOAT,
    anti_incumbency_score FLOAT,
    caste_equation_score FLOAT,
    local_leadership_score FLOAT,
    recent_events_score FLOAT,
    final_composite_score FLOAT, -- 0-100
    winning_probability FLOAT, -- 0-100
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_id) REFERENCES candidate(candidate_id),
    FOREIGN KEY (party_id) REFERENCES party(party_id)
);
```

### BOOTH_PREDICTION Table
```sql
CREATE TABLE booth_prediction (
    booth_prediction_id INTEGER PRIMARY KEY,
    booth_id INTEGER NOT NULL,
    candidate_id INTEGER NOT NULL,
    constituency_id INTEGER NOT NULL,
    predicted_vote_share FLOAT, -- percentage
    confidence_score FLOAT, -- 0-100
    predicted_votes INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booth_id) REFERENCES booth(booth_id),
    FOREIGN KEY (candidate_id) REFERENCES candidate(candidate_id),
    FOREIGN KEY (constituency_id) REFERENCES constituency(constituency_id)
);
```

### PREDICTION_CACHE Table
```sql
CREATE TABLE prediction_cache (
    cache_id INTEGER PRIMARY KEY,
    constituency_id INTEGER NOT NULL,
    prediction_data JSONB, -- Full prediction response
    booth_data JSONB,
    cache_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ttl_seconds INTEGER DEFAULT 3600,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (constituency_id) REFERENCES constituency(constituency_id)
);
```

### USER_CONTEXT Table
```sql
CREATE TABLE user_context (
    context_id INTEGER PRIMARY KEY,
    constituency_id INTEGER NOT NULL,
    user_id VARCHAR(100),
    context_input JSONB, -- Free-text and additional context
    weight_adjustments JSONB, -- User's factor weight adjustments
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (constituency_id) REFERENCES constituency(constituency_id)
);
```

---

## 4. Index Strategy

```sql
-- Performance Indexes
CREATE INDEX idx_candidate_constituency ON candidate(constituency_id);
CREATE INDEX idx_candidate_party ON candidate(party);
CREATE INDEX idx_booth_constituency ON booth(constituency_id);
CREATE INDEX idx_historical_constituency ON historical_result(constituency_id);
CREATE INDEX idx_historical_year ON historical_result(year);
CREATE INDEX idx_historical_party ON historical_result(party_id);
CREATE INDEX idx_booth_prediction_candidate ON booth_prediction(candidate_id);
CREATE INDEX idx_booth_prediction_constituency ON booth_prediction(constituency_id);
CREATE INDEX idx_cache_constituency ON prediction_cache(constituency_id);
CREATE INDEX idx_context_constituency ON user_context(constituency_id);
```

---

## 5. Sample Data Model Relationships

```mermaid
graph LR
    C1["Constituency: Dum Dum<br/>Reserved: SC<br/>Population: 450000"]
    
    Ca1["Candidate: ABC<br/>Party: TMC<br/>Education: Graduate"]
    Ca2["Candidate: XYZ<br/>Party: CPM<br/>Education: Post-Grad"]
    
    D1["Demographics:<br/>Hindu: 55%<br/>Muslim: 40%<br/>SC: 25%"]
    
    B1["Booth 1: South Dum Dum<br/>Voters: 3000<br/>Urban: 80%"]
    B2["Booth 2: North Dum Dum<br/>Voters: 2500<br/>Urban: 60%"]
    
    HR1["2021 Result: XYZ (CPM)<br/>Votes: 95000<br/>Vote Share: 42%"]
    
    CS1["Candidate Score: ABC<br/>Composite: 72<br/>Probability: 65%"]
    CS2["Candidate Score: XYZ<br/>Composite: 68<br/>Probability: 35%"]
    
    C1 --> Ca1
    C1 --> Ca2
    C1 --> D1
    C1 --> B1
    C1 --> B2
    C1 --> HR1
    
    Ca1 --> CS1
    Ca2 --> CS2
    
    B1 -.->|Prediction| CS1
    B2 -.->|Prediction| CS1
```

