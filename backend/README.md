# Second Commit

> AI-powered Predictive Intelligence Engine for reviving abandoned software projects.

# Team Information

| Field | Details |
|---|---|
| Team Name | Commit2.0 |
| Team Leader | Akshara Dixit |
| Team Leader Email | dixitakshara96@gmail.com |
| Team Leader Phone Number | 9682729612 |
| Team Size | 3 |

## Problem Statement
**Predictive Intelligence Engine** – Develop a system that predicts future trends using historical and real-time data.

# Project Title
## Second Commit

## Project Description
Second Commit predicts the revival potential of abandoned GitHub repositories using historical repository data, real-time developer activity, Retrieval-Augmented Generation (RAG), and a CrewAI multi-agent system. It helps founders discover reusable software projects, estimate feasibility, identify contributors, and generate explainable revival plans.

## Features
- Repository revival prediction
- GitHub repository search
- Multi-agent AI analysis
- RAG-powered reports
- Contributor recommendation
- AI-generated outreach
- Explainable predictions
- Startup, Freelancer & Admin dashboards

# Overall Architecture

```mermaid
flowchart LR
User-->React
React-->FastAPI
FastAPI-->Postgres
FastAPI-->Qdrant
FastAPI-->GitHub
FastAPI-->CrewAI
CrewAI-->RepoAgent
CrewAI-->DocAgent
CrewAI-->HealthAgent
CrewAI-->TrendAgent
CrewAI-->SkillAgent
CrewAI-->CommAgent
CrewAI-->LLM
LLM-->Report
Report-->React
```

# Complete Platform Flow

```mermaid
flowchart TD
Register-->Startup
Register-->Freelancer
Register-->Admin
Startup-->Idea
Idea-->Search
Search-->Analysis
Analysis-->Report
Report-->Recommend
Freelancer-->GitHubProfile
GitHubProfile-->SkillExtraction
SkillExtraction-->Recommend
Recommend-->Outreach
Outreach-->Revival
Admin-->Analytics
```

# Startup Owner Flow

```mermaid
flowchart TD
Login-->Dashboard-->SubmitIdea-->AIRefine-->SearchGitHub-->SelectRepo-->MultiAgent-->RevivalReport-->RecommendContributors-->Outreach-->Revival
```

# Freelancer Flow

```mermaid
flowchart TD
Register-->Profile-->ConnectGitHub-->ExtractSkills-->Recommendations-->Invitation-->JoinProject
```

# Admin Flow

```mermaid
flowchart TD
Login-->Analytics-->Users-->Repositories-->Reports-->Monitoring
```

# Backend

```mermaid
flowchart LR
React-->FastAPI
FastAPI-->Auth
FastAPI-->RepositoryService
FastAPI-->AIService
RepositoryService-->GitHubAPI
AIService-->CrewAI
AIService-->Qdrant
FastAPI-->PostgreSQL
```

# Multi-Agent Pipeline

```mermaid
flowchart LR
Repository-->RepositoryReader-->DocumentationAgent-->CodeHealthAgent-->TrendPredictionAgent-->SkillGapAgent-->CommunicationAgent-->FinalReport
```

# AI Modules

## Repository Reader
- Reads commits, README, issues and pull requests.
- Creates repository summary.

## Documentation Agent
- Scores documentation quality.
- Detects missing documentation.

## Code Health Agent
- Measures repository health.
- Estimates maintenance effort.

## Trend Prediction Agent
- Predicts future technology relevance.
- Detects ecosystem trends.

## Skill Gap Agent
- Finds missing skills.
- Matches contributors.

## Communication Agent
- Generates outreach emails.
- Personalizes invitations.

# RAG Pipeline

```mermaid
flowchart LR
GitHub-->Embeddings-->Qdrant-->Retriever-->LLM-->RevivalReport
```

# Explainable AI

```mermaid
flowchart TD
HistoricalData-->ForecastModel-->ReasoningEngine-->NaturalLanguageExplanation-->User
```

# Database ER Diagram

```mermaid
erDiagram
USER ||--o{ PROJECT : owns
PROJECT ||--o{ ANALYSIS : generates
PROJECT ||--o{ INVITATION : sends
USER ||--o{ PROFILE : has
PROFILE ||--o{ SKILL : contains
USER{
uuid id
string name
string role
}
PROJECT{
uuid id
string title
}
ANALYSIS{
uuid id
float revival_score
}
PROFILE{
uuid id
string github
}
SKILL{
uuid id
string technology
}
INVITATION{
uuid id
string status
}
```

# Sequence Diagram

```mermaid
sequenceDiagram
participant U as User
participant F as Frontend
participant B as Backend
participant G as GitHub
participant A as CrewAI
participant L as LLM
U->>F: Submit Idea
F->>B: Request
B->>G: Fetch Repo
G-->>B: Data
B->>A: Analyze
A->>L: RAG Context
L-->>A: Prediction
A-->>B: Report
B-->>F: Response
F-->>U: Dashboard
```

# Tech Stack

## Frontend
- React
- Vite
- Tailwind CSS
- shadcn/ui
- Framer Motion

## Backend
- FastAPI
- Python
- Celery
- Redis
- JWT
- Pydantic

## Database
- PostgreSQL
- Qdrant

## AI
- CrewAI
- LangChain
- Sentence Transformers
- HuggingFace
- Zephyr
- Mistral
- DeepSeek
- RAG

## APIs
- GitHub REST API
- GitHub Search API
- GitHub Commits API
- GitHub Contributors API
- GitHub Issues API
- GitHub Topics API

# Folder Structure

```text
frontend/
backend/
agents/
rag/
database/
docs/
```

# Installation

```bash
git clone <repo>
cd second-commit
pip install -r requirements.txt
npm install
npm run dev
uvicorn app:app --reload
```

# Team Members

| Name | Role |
|---|---|
| Akshara Dixit | AI/ML |
| Kriti Jain | Backend |
| Jahnvi Katiyar | Frontend |

# Prototype
Add link

# PPT
Add Google Drive link

# Video Demo
Add Google Drive link

# Future Scope
- Continuous monitoring
- CI/CD integration
- PR automation
- Slack/Discord integration
- Funding prediction
- Organization-wide analytics

