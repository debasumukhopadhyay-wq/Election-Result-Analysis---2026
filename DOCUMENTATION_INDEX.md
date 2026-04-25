# Documentation Index & Quick Reference

## West Bengal Assembly Election 2026 Prediction System

---

## 📚 Documentation Overview

This documentation package contains comprehensive diagrams and specifications for the election prediction system. All diagrams use **Mermaid.js** syntax and are rendered automatically in VS Code or GitHub.

---

## 📑 Files Guide

### 1. **[ARCHITECTURE.md](ARCHITECTURE.md)** - System Architecture
**What's Inside:**
- System overview diagram
- Request flow sequence diagram
- Candidate scoring sequence
- Statewide simulation flow
- AI reasoning integration
- Data layer architecture
- Component interaction flow
- Error handling flow
- Caching strategy
- Deployment architecture

**Use When:**
- Understanding overall system design
- Explaining how components communicate
- Learning about data flow
- Reviewing system reliability

---

### 2. **[DATABASE_ERD.md](DATABASE_ERD.md)** - Database Schema
**What's Inside:**
- Main Entity Relationship Diagram (ERD)
- 10+ database tables with detailed descriptions
- Complete SQL schema definitions
- Index strategy for performance
- Sample data relationships
- Foreign key relationships

**Use When:**
- Designing database queries
- Adding new tables
- Understanding data relationships
- Optimizing database performance
- Debugging data issues

---

### 3. **[API_FLOWS.md](API_FLOWS.md)** - API Endpoints & Flows
**What's Inside:**
- API flow overview diagram
- 5 main endpoints with detailed flows:
  - GET /constituencies
  - POST /predict
  - GET /candidate/:id
  - GET /state-summary
  - POST /improve
- Complete request/response examples (JSON)
- Error handling flows
- Caching strategy by endpoint
- Rate limiting configuration

**Use When:**
- Calling API endpoints
- Debugging API issues
- Writing API documentation
- Understanding data contracts
- Implementing frontend API calls

---

### 4. **[PROCESS_FLOWS.md](PROCESS_FLOWS.md)** - Business Processes
**What's Inside:**
- Overall system flow diagram
- Prediction engine process
- Candidate scoring detail
- Booth simulation process
- State-wide election simulation
- AI reasoning process
- PDF export process
- Data refresh & cache invalidation
- Error recovery process
- User workflow (complete journey)

**Use When:**
- Understanding business logic
- Learning the prediction algorithm
- Following user interactions
- Debugging process issues
- Optimizing workflows

---

### 5. **[COMPONENT_ARCHITECTURE.md](COMPONENT_ARCHITECTURE.md)** - Frontend Components
**What's Inside:**
- React component tree structure
- Data flow architecture
- ConstituencyPage data flow
- Component interaction map
- Zustand store structure
- Custom hooks usage
- Props flow example
- Error boundary strategy
- Performance optimization
- Routing map

**Use When:**
- Developing React components
- Adding new features
- Understanding state management
- Optimizing performance
- Debugging component issues

---

### 6. **[DEPLOYMENT_ARCHITECTURE.md](DEPLOYMENT_ARCHITECTURE.md)** - Deployment & Infrastructure
**What's Inside:**
- Deployment architecture overview
- Frontend deployment pipeline
- Backend deployment pipeline
- Database deployment strategy
- Environment configuration
- Monitoring & logging stack
- CI/CD workflow (GitHub Actions)
- Database backup & recovery
- Scaling strategy
- Production readiness checklist
- Render.com configuration
- Health check monitoring

**Use When:**
- Deploying to production
- Setting up CI/CD
- Configuring environments
- Monitoring application
- Scaling resources
- Setting up backups

---

## 🎯 Quick Navigation Guide

### By Role

#### **Backend Developer**
1. Start with [ARCHITECTURE.md](ARCHITECTURE.md) - System overview
2. Study [DATABASE_ERD.md](DATABASE_ERD.md) - Database schema
3. Reference [API_FLOWS.md](API_FLOWS.md) - API endpoints
4. Understand [PROCESS_FLOWS.md](PROCESS_FLOWS.md) - Business logic

#### **Frontend Developer**
1. Start with [COMPONENT_ARCHITECTURE.md](COMPONENT_ARCHITECTURE.md) - Component structure
2. Review [ARCHITECTURE.md](ARCHITECTURE.md) - System overview
3. Reference [API_FLOWS.md](API_FLOWS.md) - API calls
4. Understand [PROCESS_FLOWS.md](PROCESS_FLOWS.md) - User workflows

#### **DevOps/Infrastructure Engineer**
1. Start with [DEPLOYMENT_ARCHITECTURE.md](DEPLOYMENT_ARCHITECTURE.md) - Infrastructure
2. Review [DATABASE_ERD.md](DATABASE_ERD.md) - Database setup
3. Check [ARCHITECTURE.md](ARCHITECTURE.md) - System components
4. Follow CI/CD workflow in deployment guide

#### **QA/Tester**
1. Study [PROCESS_FLOWS.md](PROCESS_FLOWS.md) - Test scenarios
2. Review [API_FLOWS.md](API_FLOWS.md) - API testing
3. Check [COMPONENT_ARCHITECTURE.md](COMPONENT_ARCHITECTURE.md) - UI testing
4. Reference [ARCHITECTURE.md](ARCHITECTURE.md) - System reliability

---

### By Task

#### Building a New Feature
```
1. Check PROCESS_FLOWS.md for business logic
2. Review COMPONENT_ARCHITECTURE.md for frontend
3. Check API_FLOWS.md for backend endpoints
4. Update DATABASE_ERD.md if new data needed
5. Test using PROCESS_FLOWS.md scenarios
```

#### Debugging a Bug
```
1. Read ARCHITECTURE.md - understand data flow
2. Check PROCESS_FLOWS.md - trace process
3. Review API_FLOWS.md - check API calls
4. Study COMPONENT_ARCHITECTURE.md - component state
5. Query DATABASE_ERD.md - data integrity
```

#### Performance Optimization
```
1. Review ARCHITECTURE.md - caching strategy
2. Check API_FLOWS.md - endpoint caching
3. Study COMPONENT_ARCHITECTURE.md - optimization
4. Review DATABASE_ERD.md - index strategy
5. Check DEPLOYMENT_ARCHITECTURE.md - scaling
```

#### Adding Database Table
```
1. Review DATABASE_ERD.md - existing schema
2. Design in DATABASE_ERD.md - ER diagram
3. Write SQL in DATABASE_ERD.md - table creation
4. Update PROCESS_FLOWS.md - if needed
5. Update API_FLOWS.md - if exposing data
```

#### Deploying to Production
```
1. Follow DEPLOYMENT_ARCHITECTURE.md - checklist
2. Configure CI/CD from deployment guide
3. Set environment variables
4. Run database migrations
5. Monitor using health checks
```

---

## 📊 Diagram Reference

### Sequence Diagrams (When Things Happen)
- Prediction Request Flow
- Candidate Scoring Sequence
- Statewide Simulation Flow
- AI Reasoning Integration
- Booth Simulation Process
- Error Recovery Process

### Flow Diagrams (Decision Making)
- Overall System Flow
- Prediction Engine Process
- Candidate Scoring Detail
- Booth Simulation Process
- State-Wide Simulation
- AI Reasoning Process
- PDF Export Process
- Data Refresh & Cache Invalidation
- Error Recovery Process
- User Workflow

### Entity Relationship Diagrams (Data Structure)
- Main ERD (10+ tables)
- Sample Data Model Relationships

### Component Diagrams (System Architecture)
- System Overview
- Data Layer Architecture
- Component Interaction Flow
- Data Flow Architecture
- Frontend Component Tree
- Store Structure
- Hooks Usage
- Deployment Architecture
- CI/CD Pipeline
- Monitoring Stack

### Architecture Diagrams (Layout & Structure)
- Deployment Architecture
- Frontend Deployment Pipeline
- Backend Deployment Pipeline
- Database Architecture

---

## 🔑 Key Concepts Explained

### **Prediction Engine**
The core algorithm that scores each candidate (0-100) based on:
- Candidate Image (15%)
- Party Brand (20%)
- Anti-Incumbency (18%)
- Caste Equation (22%)
- Local Leadership (12%)
- Recent Events (13%)

**Reference:** [PROCESS_FLOWS.md](PROCESS_FLOWS.md#3-candidate-scoring-detail)

### **Booth Simulation**
Granular voting prediction at booth level (voting unit), aggregated to constituency.
**Reference:** [PROCESS_FLOWS.md](PROCESS_FLOWS.md#4-booth-simulation-process)

### **Prediction Caching**
Smart caching with 1-hour TTL for predictions, 4-hour TTL for state summary.
**Reference:** [ARCHITECTURE.md](ARCHITECTURE.md#9-caching-strategy)

### **AI Reasoning**
Claude Sonnet generates natural language explanations for predictions.
**Reference:** [PROCESS_FLOWS.md](PROCESS_FLOWS.md#6-ai-reasoning-process)

### **State Management**
Zustand stores for: Predictions, Constituencies, Dashboard state.
**Reference:** [COMPONENT_ARCHITECTURE.md](COMPONENT_ARCHITECTURE.md#5-store-structure-zustand)

---

## 🚀 Common Tasks

### Task: Make a Prediction
**Steps:**
1. Frontend: Select constituency (COMPONENT_ARCHITECTURE.md)
2. Frontend: Submit context & weights (PROCESS_FLOWS.md)
3. Backend: Score all candidates (PROCESS_FLOWS.md)
4. Backend: Simulate booths (PROCESS_FLOWS.md)
5. Backend: Get AI analysis (PROCESS_FLOWS.md)
6. Frontend: Display results (COMPONENT_ARCHITECTURE.md)

**Sequence:** [ARCHITECTURE.md - Prediction Request Flow](ARCHITECTURE.md#2-request-flow-sequence-diagram)

### Task: Add New Scoring Factor
**Steps:**
1. Add factor to weights config (scoringWeights.js)
2. Add scoring function (predictionEngine.js)
3. Update DATABASE_ERD.md candidate_strength table
4. Update API response in API_FLOWS.md
5. Update frontend panel in COMPONENT_ARCHITECTURE.md

### Task: Scale for More Predictions
**Reference:** [DEPLOYMENT_ARCHITECTURE.md - Scaling Strategy](DEPLOYMENT_ARCHITECTURE.md#9-scaling-strategy)

---

## 📋 API Endpoints Quick Reference

| Endpoint | Method | Purpose | Cache TTL |
|----------|--------|---------|-----------|
| `/constituencies` | GET | Get all 294 constituencies | 24h |
| `/predict` | POST | Make single prediction | 1h |
| `/candidate/:id` | GET | Get candidate details | 6h |
| `/state-summary` | GET | Get state-wide projection | 4h |
| `/improve` | POST | Get improvement strategy | No cache |
| `/health` | GET | Health check | No cache |

**Full Details:** [API_FLOWS.md](API_FLOWS.md)

---

## 🗄️ Database Quick Reference

| Table | Purpose | Records |
|-------|---------|---------|
| `constituency` | Core units | 294 |
| `candidate` | Candidates | ~1176 (4 per seat) |
| `booth` | Voting units | ~20,000 |
| `demographics` | Population data | 294 |
| `historical_result` | Past elections | ~10,000+ |
| `candidate_strength` | Scores | ~1176 |
| `booth_prediction` | Booth results | ~20,000 |
| `prediction_cache` | Cached results | Variable |

**Full Schema:** [DATABASE_ERD.md](DATABASE_ERD.md)

---

## 🔧 Tech Stack Reference

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Zustand, Vite |
| UI | Tailwind CSS, Recharts |
| Backend | Node.js, Express.js |
| Database | PostgreSQL (primary), Redis (cache) |
| AI | Anthropic Claude Sonnet/Opus |
| Deployment | Render.com, GitHub Actions |
| Monitoring | Render Logs, Health Checks |

---

## 📞 Support & Questions

### If you're stuck on:

**"How do components talk to each other?"**
→ Read [COMPONENT_ARCHITECTURE.md - Data Flow Architecture](COMPONENT_ARCHITECTURE.md#2-data-flow-architecture)

**"Where is the prediction calculation?"**
→ Read [PROCESS_FLOWS.md - Prediction Engine Process](PROCESS_FLOWS.md#2-prediction-engine-process)

**"How is data stored?"**
→ Read [DATABASE_ERD.md](DATABASE_ERD.md)

**"What happens when a user makes a request?"**
→ Read [ARCHITECTURE.md - Request Flow](ARCHITECTURE.md#2-request-flow-sequence-diagram)

**"How do I deploy to production?"**
→ Read [DEPLOYMENT_ARCHITECTURE.md - Deployment Pipeline](DEPLOYMENT_ARCHITECTURE.md)

**"How do I add a new API endpoint?"**
→ Read [API_FLOWS.md - API Design](API_FLOWS.md)

---

## 📈 Documentation Stats

- **Total Diagrams**: 50+
- **Sequence Diagrams**: 8
- **Flow Diagrams**: 10
- **ERD Diagrams**: 2
- **Architecture Diagrams**: 15+
- **Database Tables**: 11
- **API Endpoints**: 6
- **Components**: 20+

---

## 🎓 Learning Path

### For Beginners
1. Read: [ARCHITECTURE.md](ARCHITECTURE.md) - Overview
2. Explore: [PROCESS_FLOWS.md](PROCESS_FLOWS.md) - User workflows
3. Study: [COMPONENT_ARCHITECTURE.md](COMPONENT_ARCHITECTURE.md) - UI/UX
4. Learn: [API_FLOWS.md](API_FLOWS.md) - Backend communication

### For Intermediate
1. Deep dive: [DATABASE_ERD.md](DATABASE_ERD.md) - Data model
2. Master: [PROCESS_FLOWS.md](PROCESS_FLOWS.md) - Algorithm details
3. Optimize: [ARCHITECTURE.md](ARCHITECTURE.md) - Caching & performance
4. Deploy: [DEPLOYMENT_ARCHITECTURE.md](DEPLOYMENT_ARCHITECTURE.md) - Infrastructure

### For Advanced
1. Review all diagrams for patterns
2. Propose system enhancements
3. Optimize database queries
4. Implement performance improvements

---

## ✅ Checklist for New Team Members

- [ ] Read [ARCHITECTURE.md](ARCHITECTURE.md) - System overview
- [ ] Read your role-specific documentation
- [ ] Run the application locally
- [ ] Make a test prediction
- [ ] Study relevant database tables
- [ ] Review API endpoints
- [ ] Check deployment process
- [ ] Understand error handling
- [ ] Set up development environment

---

## 📝 Version Information

- **System**: West Bengal Assembly Election 2026 Prediction
- **Documentation Version**: 1.0
- **Last Updated**: 2026-04-25
- **Tech Stack**: MERN + Claude AI
- **Deployment**: Render.com

---

## 🔄 How to Use These Diagrams

### In VS Code
- All `.md` files are rendered with mermaid support
- Click on any diagram to view full size
- Use Markdown Preview to see formatted diagrams

### In GitHub
- Diagrams render automatically in README
- Use GitHub's diagram viewer for better resolution

### In Documentation Sites
- Copy Mermaid code to your docs platform
- All diagrams are self-contained and portable

### In Presentations
- Export diagrams as PNG/SVG
- Use as visual aids for discussions
- Reference specific diagram sections

---

## 🎯 Next Steps

1. **Choose your role**: Backend, Frontend, DevOps, QA
2. **Start with role-specific docs** (see Quick Navigation)
3. **Pick a task** from Common Tasks section
4. **Reference relevant diagrams**
5. **Ask questions** using the Support & Questions section

---

**Happy coding! 🚀**

For detailed information on any topic, click the relevant markdown file link above.

