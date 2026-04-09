# Implementation Plan — Simulador de Frete

## Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 18 |
| ARCH Tasks | 4 (4 Done) |
| DEV Tasks | 10 (10 Done) |
| QA Tasks | 4 (4 Done) |
| Estimated Effort | ~8-10 days |

---

## Task Breakdown

### US-001: Simulacao de Frete

| Task ID | Agent | Description | Depends On | Size | Status |
|---------|-------|-------------|------------|------|--------|
| TASK-001-ARCH | architect | Definir tech stack, estrutura do projeto e schema do banco | - | M | Done |
| TASK-002-ARCH | architect | Especificacao da API de simulacao (endpoints, DTOs, validacoes) | TASK-001-ARCH | S | Done |
| TASK-003-DEV | backend-developer | Implementar endpoint POST `/api/simulate` com logica de calculo | TASK-002-ARCH | L | Done |
| TASK-004-DEV | frontend-developer | Implementar formulario de simulacao (CEP, peso, dimensoes) | TASK-003-DEV | M | Done |
| TASK-005-DEV | frontend-developer | Implementar tela de resultados da simulacao | TASK-004-DEV | M | Done |
| TASK-006-QA | qa-tester | Testes da simulacao de frete (API + UI) | TASK-003-DEV, TASK-005-DEV | M | Done |

### US-002: Comparacao de Transportadoras

| Task ID | Agent | Description | Depends On | Size | Status |
|---------|-------|-------------|------------|------|--------|
| TASK-007-DEV | backend-developer | Implementar calculo multi-transportadora (PAC, SEDEX, Privada) | TASK-003-DEV | M | Done |
| TASK-008-DEV | frontend-developer | Implementar comparativo de transportadoras com ordenacao | TASK-007-DEV | M | Done |
| TASK-009-QA | qa-tester | Testes de comparacao de transportadoras | TASK-007-DEV, TASK-008-DEV | S | Done |

### US-003: Historico de Simulacoes

| Task ID | Agent | Description | Depends On | Size | Status |
|---------|-------|-------------|------------|------|--------|
| TASK-010-DEV | frontend-developer | Implementar historico de simulacoes (localStorage) | TASK-005-DEV | M | Done |
| TASK-011-DEV | frontend-developer | Acao de refazer simulacao e limpar historico | TASK-010-DEV | S | Done |
| TASK-012-QA | qa-tester | Testes do historico de simulacoes | TASK-010-DEV, TASK-011-DEV | S | Done |

### US-004: Tabela de Precos (Admin)

| Task ID | Agent | Description | Depends On | Size | Status |
|---------|-------|-------------|------------|------|--------|
| TASK-013-ARCH | architect | Schema da tabela de precos (faixas de CEP, peso, preco, prazo) | TASK-001-ARCH | S | Done |
| TASK-014-DEV | backend-developer | CRUD API de tabelas de preco + seed com dados padrao | TASK-013-ARCH | L | Done |
| TASK-015-DEV | frontend-developer | Tela admin de gerenciamento de tabelas de preco | TASK-014-DEV | L | Done |
| TASK-016-QA | qa-tester | Testes do CRUD de tabelas de preco | TASK-014-DEV, TASK-015-DEV | M | Done |

### US-005: API de Simulacao (documentacao)

| Task ID | Agent | Description | Depends On | Size | Status |
|---------|-------|-------------|------------|------|--------|
| TASK-017-ARCH | architect | Documentacao OpenAPI/Swagger da API | TASK-003-DEV | S | Done |
| TASK-018-DEV | backend-developer | Integrar Swagger UI no projeto | TASK-017-ARCH | S | Done |

---

## Dependency Graph

```
TASK-001-ARCH --> TASK-002-ARCH --> TASK-003-DEV --> TASK-004-DEV --> TASK-005-DEV --> TASK-006-QA
                                       |                                |
                                       |                                +--> TASK-010-DEV --> TASK-011-DEV --> TASK-012-QA
                                       |
                                       +--> TASK-007-DEV --> TASK-008-DEV --> TASK-009-QA
                                       |
                                       +--> TASK-017-ARCH --> TASK-018-DEV

TASK-001-ARCH --> TASK-013-ARCH --> TASK-014-DEV --> TASK-015-DEV --> TASK-016-QA
```

## Execution Order

### Sequential (mandatory order):
1. TASK-001-ARCH (tech stack) -> TASK-002-ARCH (API spec) -> TASK-003-DEV (simulate API)
2. TASK-003-DEV -> TASK-004-DEV (form UI) -> TASK-005-DEV (results UI)
3. TASK-013-ARCH (price schema) -> TASK-014-DEV (price CRUD API) -> TASK-015-DEV (admin UI)
4. TASK-010-DEV (historico) -> TASK-011-DEV (refazer/limpar)

### Parallelizable:
- TASK-007-DEV e TASK-017-ARCH (ambos dependem apenas de TASK-003-DEV)
- TASK-004-DEV e TASK-007-DEV (apos TASK-003-DEV)
- TASK-013-ARCH e TASK-002-ARCH (ambos dependem apenas de TASK-001-ARCH)
- TASK-010-DEV e TASK-008-DEV (independentes, mesma base)

---

## Pre-Flight Validation

```bash
# TASK-003-DEV pre-flight
grep "TASK-002-ARCH.*Done" artifacts/02-implementation/implementation-plan.md

# TASK-004-DEV pre-flight
grep "TASK-003-DEV.*Done" artifacts/02-implementation/implementation-plan.md

# TASK-007-DEV pre-flight
grep "TASK-003-DEV.*Done" artifacts/02-implementation/implementation-plan.md

# TASK-014-DEV pre-flight
grep "TASK-013-ARCH.*Done" artifacts/02-implementation/implementation-plan.md

# TASK-015-DEV pre-flight
grep "TASK-014-DEV.*Done" artifacts/02-implementation/implementation-plan.md
```

---

## Approval

- [ ] Human reviewed task breakdown
- [ ] Dependencies are correct
- [ ] Effort estimates are reasonable
- [ ] Execution order is clear
- [ ] Approved to proceed to Architecture
