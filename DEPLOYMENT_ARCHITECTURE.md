# Deployment & Infrastructure Architecture

## West Bengal Assembly Election 2026 - Deployment Guide

---

## 1. Deployment Architecture Overview

```mermaid
graph TB
    subgraph "Development Environment"
        DevCode["Local Code<br/>- React Dev<br/>- Node Server"]
        DevDB["Local DB<br/>SQLite/<br/>PostgreSQL"]
        DevCache["Local Redis<br/>Port 6379"]
    end
    
    subgraph "Version Control"
        Git["Git Repository<br/>GitHub"]
    end
    
    subgraph "CI/CD Pipeline"
        GHA["GitHub Actions<br/>- Test<br/>- Build<br/>- Deploy"]
    end
    
    subgraph "Production - Render.com"
        FrontWeb["Frontend Web Service<br/>React Build"]
        BackAPI["Backend API Service<br/>Node.js Express"]
        ProdDB[(PostgreSQL<br/>Render Database)]
        ProdCache["Redis<br/>Render Cache"]
    end
    
    subgraph "External Services"
        Claude["Anthropic Claude<br/>API"]
        CDN["CDN<br/>Static Assets"]
    end
    
    subgraph "Monitoring"
        Logs["Render Logs"]
        Monitor["Health Checks"]
    end
    
    DevCode --> Git
    Git --> GHA
    GHA --> FrontWeb
    GHA --> BackAPI
    
    BackAPI --> ProdDB
    BackAPI --> ProdCache
    BackAPI --> Claude
    FrontWeb --> CDN
    FrontWeb --> BackAPI
    
    BackAPI --> Logs
    BackAPI --> Monitor
```

---

## 2. Frontend Deployment Pipeline

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Git as GitHub
    participant GHA as GitHub Actions
    participant Build as Build Process
    participant Test as Test Suite
    participant Deploy as Render Deploy
    participant CDN as CDN
    participant Frontend as Frontend Service
    
    Dev ->> Dev: npm run build
    Dev ->> Git: git push origin main
    
    Git ->> GHA: Trigger Workflow
    GHA ->> Build: npm install
    Build ->> Build: Compile TypeScript
    Build ->> Build: Generate Vite Bundle
    Build ->> Test: Run Tests
    Test -->> GHA: Tests Pass/Fail
    
    alt Tests Fail
        GHA -->> Dev: Notify Failure
    else Tests Pass
        GHA ->> Deploy: Deploy to Render
        Deploy ->> Frontend: Update Service
        Frontend ->> CDN: Update Assets
        CDN -->> Dev: Deployment Complete
    end
```

---

## 3. Backend Deployment Pipeline

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Git as GitHub
    participant GHA as GitHub Actions
    participant Lint as Linting
    participant Test as Unit Tests
    participant Build as Build/Bundle
    participant Deploy as Render Deploy
    participant Backend as Backend Service
    participant DB as PostgreSQL
    
    Dev ->> Git: git push origin main
    
    Git ->> GHA: Trigger Workflow
    GHA ->> Lint: ESLint Check
    Lint -->> GHA: Status
    
    GHA ->> Test: Run Tests
    Test ->> Test: API Tests
    Test ->> Test: Logic Tests
    Test -->> GHA: Results
    
    alt Any Failure
        GHA -->> Dev: Notify
    else All Pass
        GHA ->> Build: npm install
        Build ->> Build: Bundle App
        Build ->> Deploy: Upload to Render
        Deploy ->> Backend: Start Service
        Backend ->> DB: Verify Connection
        DB -->> Backend: Connected
        Backend -->> Dev: Ready
    end
```

---

## 4. Database Deployment

```mermaid
graph TD
    Local["Local PostgreSQL<br/>Development"]
    
    Local -->|Migration Scripts| Migrations["Migration Files<br/>v1, v2, v3..."]
    
    Migrations -->|Applied Via| Tools["Migration Tool<br/>Knex.js or<br/>Sequelize"]
    
    Tools -->|Deploy To| ProdDB["Render PostgreSQL<br/>Production"]
    
    ProdDB -->|Backup| Backup["Daily Backups<br/>Render Managed"]
    
    Backup -->|Restore If Needed| Recovery["Disaster Recovery"]
    
    ProdDB -->|Indexes| Indexes["Performance<br/>Indexes"]
```

---

## 5. Environment Configuration

```mermaid
graph TB
    subgraph "Environment Variables"
        Dev["Development<br/>.env.local"]
        Prod["Production<br/>Render Config"]
        Test["Testing<br/>.env.test"]
    end
    
    subgraph "Dev Secrets"
        D1["DATABASE_URL<br/>localhost:5432"]
        D2["REDIS_URL<br/>localhost:6379"]
        D3["ANTHROPIC_API_KEY<br/>test-key"]
        D4["PORT=5000"]
        D5["FRONTEND_URL<br/>localhost:3000"]
    end
    
    subgraph "Prod Secrets"
        P1["DATABASE_URL<br/>Render DB"]
        P2["REDIS_URL<br/>Render Redis"]
        P3["ANTHROPIC_API_KEY<br/>real-key"]
        P4["PORT=automated"]
        P5["FRONTEND_URL<br/>*.onrender.com"]
        P6["NODE_ENV<br/>production"]
    end
    
    Dev --> D1
    Dev --> D2
    Dev --> D3
    Dev --> D4
    Dev --> D5
    
    Prod --> P1
    Prod --> P2
    Prod --> P3
    Prod --> P4
    Prod --> P5
    Prod --> P6
```

---

## 6. Monitoring & Logging Stack

```mermaid
graph TB
    subgraph "Application"
        API["Express API"]
        React["React App"]
    end
    
    subgraph "Logging"
        Console["Console Logs"]
        Files["File Logs"]
        ErrorLog["Error Log"]
    end
    
    subgraph "Monitoring"
        Health["Health Check<br/>GET /health"]
        Metrics["Metrics<br/>Response Time<br/>Error Rate"]
    end
    
    subgraph "Render Dashboard"
        RenderLogs["Render Logs<br/>Real-time Feed"]
        RenderMetrics["Render Metrics<br/>CPU, Memory"]
    end
    
    subgraph "Alerts"
        SlackAlert["Slack Notifications"]
        EmailAlert["Email Alerts"]
    end
    
    API --> Console
    API --> ErrorLog
    React --> Console
    
    Console --> RenderLogs
    ErrorLog --> RenderLogs
    
    API --> Health
    API --> Metrics
    
    Metrics --> RenderMetrics
    Health --> RenderMetrics
    
    RenderMetrics -->|Alert if Error| SlackAlert
    RenderLogs -->|Alert if Crash| EmailAlert
```

---

## 7. CI/CD Workflow Configuration

```yaml
# .github/workflows/deploy.yml
name: Deploy to Render

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install Dependencies
        run: npm install
      
      - name: Run Linting
        run: npm run lint
      
      - name: Run Tests
        run: npm test
      
      - name: Build Frontend
        run: cd frontend && npm run build
      
      - name: Build Backend
        run: cd backend && npm run build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Render
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}
```

---

## 8. Database Backup & Recovery

```mermaid
graph TD
    DB["Production Database<br/>Render PostgreSQL"]
    
    DB -->|Daily 2 AM| Backup["Automated Backup<br/>Render Managed"]
    
    Backup --> S3["S3 Storage<br/>Optional Extra"]
    
    Backup --> Retention["Retention Policy<br/>30 days"]
    
    Retention -->|Backup Corrupted| Restore["Point-in-Time<br/>Restore"]
    Retention -->|Data Lost| Recovery["Full Database<br/>Recovery"]
    
    Restore --> TestDB["Test Database<br/>Verify Data"]
    Recovery --> TestDB
    
    TestDB --> Validate["Data Validation"]
    
    Validate -->|OK| ProdRestore["Restore to Prod"]
    Validate -->|Issues| Manual["Manual Recovery"]
```

---

## 9. Scaling Strategy

```mermaid
graph TB
    Current["Current Setup<br/>Single Instance<br/>294 Seats"]
    
    Current -->|Monitor Load| Metrics["Metrics<br/>- Response Time<br/>- Error Rate<br/>- CPU/Memory"]
    
    Metrics --> Threshold{Load<br/>Exceeded?}
    
    Threshold -->|No| Continue["Continue<br/>Monitor"]
    Threshold -->|Yes| Scale["Scale Resources"]
    
    Continue --> Next["Next Monitor<br/>Cycle"]
    Next --> Metrics
    
    Scale --> Frontend["Scale Frontend<br/>- Add Instances<br/>- Load Balancer"]
    Scale --> Backend["Scale Backend<br/>- Add Instances<br/>- Connection Pool"]
    Scale --> Cache["Scale Cache<br/>- Increase Memory<br/>- Redis Cluster"]
    Scale --> DB["Scale Database<br/>- Read Replicas<br/>- Connection Limit"]
```

---

## 10. Production Readiness Checklist

```mermaid
graph TB
    subgraph "Code Quality"
        CQ1["✓ All Tests Pass"]
        CQ2["✓ No Lint Errors"]
        CQ3["✓ Code Review"]
        CQ4["✓ Security Scan"]
    end
    
    subgraph "Security"
        SEC1["✓ Input Validation"]
        SEC2["✓ Rate Limiting"]
        SEC3["✓ CORS Config"]
        SEC4["✓ Secrets Managed"]
        SEC5["✓ SSL/TLS"]
    end
    
    subgraph "Performance"
        PERF1["✓ Load Testing"]
        PERF2["✓ Cache Strategy"]
        PERF3["✓ DB Indexes"]
        PERF4["✓ Bundle Size"]
    end
    
    subgraph "Deployment"
        DEPLOY1["✓ DB Migrations"]
        DEPLOY2["✓ Env Variables"]
        DEPLOY3["✓ Monitoring"]
        DEPLOY4["✓ Rollback Plan"]
    end
    
    CQ1 --> Ready["Production<br/>Ready ✓"]
    CQ2 --> Ready
    CQ3 --> Ready
    CQ4 --> Ready
    SEC1 --> Ready
    SEC2 --> Ready
    SEC3 --> Ready
    SEC4 --> Ready
    SEC5 --> Ready
    PERF1 --> Ready
    PERF2 --> Ready
    PERF3 --> Ready
    PERF4 --> Ready
    DEPLOY1 --> Ready
    DEPLOY2 --> Ready
    DEPLOY3 --> Ready
    DEPLOY4 --> Ready
```

---

## 11. Render.com Configuration

### Frontend Service
```yaml
Name: election-frontend
Build: npm install && cd frontend && npm run build
Start: npx serve -s dist -p 3000
Environment:
  - NODE_ENV=production
  - VITE_API_URL=https://election-api.onrender.com
Auto-Deploy: Yes
```

### Backend Service
```yaml
Name: election-api
Build: npm install && cd backend && npm run build
Start: cd backend && npm start
Environment:
  - NODE_ENV=production
  - PORT=5000
  - DATABASE_URL=<render-postgres>
  - REDIS_URL=<render-redis>
  - ANTHROPIC_API_KEY=<secret>
Auto-Deploy: Yes
```

---

## 12. Health Check & Uptime Monitoring

```mermaid
sequenceDiagram
    participant Monitor as Uptime Monitor
    participant API as Backend API
    participant Health as Health Check
    participant Alert as Alert System
    
    loop Every 5 Minutes
        Monitor ->> API: GET /health
        API ->> Health: Check Status
        Health ->> Health: Verify DB
        Health ->> Health: Verify Cache
        Health -->> API: Status
        API -->> Monitor: Response
        
        alt Healthy
            Monitor ->> Monitor: Log OK
        else Unhealthy
            Monitor ->> Alert: Send Alert
            Alert -->> DevTeam: Email/Slack
        end
    end
```

