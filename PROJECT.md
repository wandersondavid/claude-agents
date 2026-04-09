# Project: Simulador de Frete

## Status
- **Phase:** QA Completo — aguardando Code Review
- **Started:** 2026-04-09
- **Last Updated:** 2026-04-09

## Tech Stack
- **Framework:** Next.js 14+ (App Router) + TypeScript
- **Styling:** Tailwind CSS v3
- **ORM/DB:** Prisma v7 + SQLite (via better-sqlite3 adapter)
- **Validation:** Zod
- **Testing:** Vitest + Testing Library
- **Infra:** Docker + Docker Compose

## Team (Squad Starter Agents)
| Agent | Role | Status |
|-------|------|--------|
| `product-strategist` | Discovery & requirements | Available |
| `architect` | Architecture & tech decisions | Available |
| `frontend-developer` | UI implementation | Available |
| `backend-developer` | API & server implementation | Available |
| `qa-tester` | Testing & quality assurance | Available |
| `code-reviewer` | Code review & standards | Available |
| `squad-manager` | Orchestration & coordination | Available |

## Pipeline
```
[Discovery] → [Architecture] → [Implementation] → [QA] → [Review]
   Done           Done              Done           Done    Next
```

## Artifacts
- `artifacts/00-discovery/` — Vision, user stories, requirements
- `artifacts/01-architecture/` — ADRs, tech stack, schema, API design
- `artifacts/02-implementation/` — Implementation plans, task breakdowns
- `artifacts/03-qa/` — Test plans, QA reports
- `artifacts/04-reviews/` — Code review reports, retrospectives

## Notes
- Project initialized on 2026-04-09 with Squad Starter
- **18/18 tasks completed** (4 ARCH + 10 DEV + 4 QA)
- All APIs working: /api/simulate, /api/carriers, /api/price-tables, /api/docs
- Frontend: simulador, resultados, historico, comparacao, admin CRUD
- Swagger UI disponivel em /docs
- Docker + Docker Compose configurado
- DB seeded: 3 carriers, 27 price tables, 135 weight ranges
- Build: OK | Tests: 72 passed (4 suites) | Lint: OK
- Next: Code Review phase
