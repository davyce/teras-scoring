🇬🇧 **English** · [🇫🇷 Français](README.fr.md)

# 🏦 TERAS — Explainable Credit Intelligence for Central Africa

An AI-powered credit-scoring platform for the CEMAC region (Central African Economic and Monetary Community) — built around one principle: every score must be justifiable with real data, not a black box.

## The problem

CEMAC's 6 countries and 55M+ people face severe financial exclusion:

| Metric | Value |
|---|---|
| Population with a bank account | 12–18% |
| Excluded from the banking system | 72% |
| Informal-economy workers | 85% |
| Access to bank credit | 8–12% |
| Average interest rates | 18–35%/year |
| Informal/usury rates | 100–300%/year |
| Time to get a classic bank loan | 3–6 months |
| Informal economy outside the formal system | $1.2 trillion (IMF, 2023) |

85% of adults have no traceable credit history — not because they're not creditworthy, but because the data that would prove it (mobile money, utility payments, informal trade) never touches a bank's scoring model. TERAS turns that data into a transparent, explainable score instead of excluding people the traditional system can't see.

## What it does

- **Explainable scoring, not a black box** — every score comes with the specific data points and weights that produced it, in plain language, not just a number.
- **Five role-based interfaces**, one shared platform: **Individual** (score, simulators, bank messaging), **Enterprise** (employee management, finance, SSE-streamed reports), **Bank** (8 financial products, credit requests, analytics), **Government** (regulatory oversight across CEMAC countries), **Admin** (KYC workflow, RAG/chat governance, monitoring).
- **Adaptive financial education** — an AI chat layer that explains scores and financial concepts, auto-detecting the right pedagogical level for who's asking.
- **RAG-grounded advice** — responses are grounded in an indexed corpus of real regulatory and financial documents, with citations, not free-floating LLM guesses.

## Stack

Django (backend, 25+ models, 60+ REST endpoints), React + TypeScript (frontend, 45+ pages), PostgreSQL, Server-Sent Events for streaming AI workflows, Claude Sonnet for the reasoning layer.

## Architecture

```
backend/    Django project — models, REST API, scoring engine, RAG pipeline
teras-frontend/   React + TypeScript SPA — 5 role-based interfaces
```

Score computation follows a documented, versioned formula (e.g. fiscal transparency weighted at 30% of one sub-score) rather than an opaque model — the goal is that a bank or regulator can audit *why* a score is what it is.

## Quickstart

```bash
git clone https://github.com/davyce/teras-scoring.git
cd teras-scoring

# Backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in your own secrets — never commit this file
python manage.py migrate
python manage.py runserver   # → http://127.0.0.1:8000

# Frontend (separate terminal)
cd teras-frontend
npm install
npm run dev   # → http://localhost:5173
```

## Status

This is a showcase snapshot of an active project, published for portfolio purposes — synthetic seed data only, no real user or financial records. See [README.fr.md](README.fr.md) for the full original documentation (French), including the complete API reference and scoring methodology.

---

Built by [Davy Okemba](https://github.com/davyce).
