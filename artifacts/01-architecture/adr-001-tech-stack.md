# ADR-001: Tech Stack — Simulador de Frete

## Status

Aceito

## Contexto

O Simulador de Frete e uma aplicacao web greenfield que precisa:

- Formulario de simulacao com validacao (CEP, peso, dimensoes)
- API REST para calculo de frete e integracao externa
- CRUD administrativo para tabelas de preco
- Armazenamento persistente para tabelas de preco (servidor) e historico de simulacoes (cliente)
- Documentacao Swagger da API

O projeto e de baixa complexidade e escopo reduzido — nao exige infraestrutura distribuida, filas, cache, ou autenticacao complexa.

## Decisao

### Frontend + Backend: Next.js 14+ (App Router) com TypeScript

- **Monorepo natural**: frontend e backend no mesmo projeto, sem coordenacao de deploys separados
- **App Router**: rotas API via `app/api/` e Server Components para UI
- **TypeScript**: tipos compartilhados entre API e UI eliminam dessincronia

### Estilizacao: Tailwind CSS v3

- Utility-first, sem necessidade de design system customizado
- Produtividade alta para UI simples (formularios, tabelas, cards)

### ORM: Prisma com SQLite

- **SQLite**: banco embutido, zero configuracao, ideal para aplicacao de volume baixo
- **Prisma**: schema declarativo com tipos gerados automaticamente, migrations integradas
- Para producao futura, migrar para PostgreSQL requer apenas trocar o provider no schema

### Validacao: Zod

- Validacao de entrada na API e nos formularios com o mesmo schema
- Integracao nativa com TypeScript (inferencia de tipos)
- Mensagens de erro estruturadas

### Testes: Vitest + Testing Library

- Vitest para testes unitarios e de integracao da API
- Testing Library para testes de componentes React

### Documentacao API: Swagger UI

- `next-swagger-doc` ou arquivo OpenAPI estatico servido no projeto
- Documentacao da API acessivel em `/api-docs`

## Alternativas Consideradas

### Backend separado (Express/Fastify + React SPA)

- **Rejeitado**: complexidade de infraestrutura desnecessaria para o escopo
- Dois projetos, dois deploys, CORS, mais superficie de erro

### PostgreSQL / MySQL

- **Rejeitado para MVP**: overhead de configuracao (Docker/instalacao local)
- SQLite atende ao volume esperado. Migracao futura e trivial com Prisma

### Styled Components / CSS Modules

- **Rejeitado**: maior boilerplate que Tailwind para UI simples
- Tailwind e mais produtivo para formularios e tabelas

### tRPC

- **Rejeitado**: a US-005 exige API REST publica documentada com Swagger
- tRPC e otimo para chamadas internas, mas nao gera OpenAPI facilmente

## Consequencias

### Positivas

- Stack unificada: um unico projeto, um unico deploy
- TypeScript end-to-end: tipos derivados do Prisma schema, Zod para validacao
- Curva de aprendizado baixa: stack popular com documentacao abundante
- SQLite: zero dependencias externas para desenvolvimento local

### Negativas

- SQLite nao suporta conexoes concorrentes em producao com alto volume (aceitavel para este escopo)
- Next.js App Router ainda tem peculiaridades com caching que exigem atencao

### Riscos

- Se o projeto escalar para alto volume, sera necessario migrar de SQLite para PostgreSQL
  - Mitigacao: Prisma abstrai o banco; a migracao e trocar `provider = "sqlite"` por `provider = "postgresql"`

## Stack Final

| Camada | Tecnologia | Versao |
|--------|-----------|--------|
| Framework | Next.js (App Router) | 14+ |
| Linguagem | TypeScript | 5.x |
| Estilizacao | Tailwind CSS | 3.x |
| ORM | Prisma | 5.x |
| Banco de Dados | SQLite | 3.x |
| Validacao | Zod | 3.x |
| Testes | Vitest + Testing Library | latest |
| Docs API | Swagger UI | latest |
| Package Manager | npm | 10+ |
| Node.js | Node.js | 20+ LTS |
