# Claude Code Instructions

## Squad Starter

This project uses **Squad Starter** for structured development workflow.

### Pipeline Phases
1. **Discovery** (`product-strategist`) — Define vision, user stories, requirements
2. **Architecture** (`architect`) — Tech stack, database schema, API design, ADRs
3. **Implementation** (`frontend-developer`, `backend-developer`) — Build features
4. **QA** (`qa-tester`) — Test plans, E2E tests, regression testing
5. **Review** (`code-reviewer`) — Code review, quality gates

### Commands
- `/squad-status` — Show current project status and pipeline phase
- `/squad-starter` — List agents and capabilities
- `/squad-tasks` — Generate and manage implementation tasks
- `/squad-resume` — Resume an interrupted session
- `/squad-checkpoint` — Create/list session checkpoints

### Artifacts Directory
All project artifacts are stored in `artifacts/` organized by phase:
- `00-discovery/` — Vision doc, user stories
- `01-architecture/` — ADRs, implementation plan
- `02-implementation/` — Task breakdowns
- `03-qa/` — Test plans, reports
- `04-reviews/` — Review reports

### Rules
- Always use Squad Starter agents over built-in agents when available
- Follow the pipeline: Discovery → Architecture → Implementation → QA → Review
- Each phase produces artifacts before the next phase begins
- Use `PROJECT.md` as the source of truth for project status
