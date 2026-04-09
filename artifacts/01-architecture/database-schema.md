# Database Schema — Simulador de Frete

## Visao Geral

O banco de dados armazena as tabelas de preco configuradas pelo administrador. Cada transportadora tem multiplas regras de preco baseadas em faixas de CEP (origem/destino) e faixas de peso.

O historico de simulacoes do usuario e armazenado em **localStorage** (cliente), nao no banco.

## Diagrama de Entidades

```
Carrier (1) ---< PriceTable (1) ---< WeightRange (N)
                    |
                    +-- cepOriginStart/End
                    +-- cepDestinationStart/End
                    +-- deadlineDays
```

- **Carrier**: transportadora (PAC, SEDEX, Transportadora Privada)
- **PriceTable**: regra de frete para uma faixa de CEP origem/destino + prazo
- **WeightRange**: faixa de peso com preco correspondente, vinculada a uma PriceTable

## Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Carrier {
  id          String       @id @default(cuid())
  name        String       @unique
  code        String       @unique // "PAC", "SEDEX", "PRIVATE"
  active      Boolean      @default(true)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  priceTables PriceTable[]

  @@index([code])
  @@index([active])
}

model PriceTable {
  id                  String        @id @default(cuid())
  carrierId           String
  carrier             Carrier       @relation(fields: [carrierId], references: [id], onDelete: Cascade)
  cepOriginStart      String        // CEP no formato "00000000" (8 digitos, sem hifen)
  cepOriginEnd        String
  cepDestinationStart String
  cepDestinationEnd   String
  deadlineDays        Int           // Prazo em dias uteis
  active              Boolean       @default(true)
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt
  weightRanges        WeightRange[]

  @@index([carrierId])
  @@index([cepOriginStart, cepOriginEnd])
  @@index([cepDestinationStart, cepDestinationEnd])
  @@index([active])
}

model WeightRange {
  id           String     @id @default(cuid())
  priceTableId String
  priceTable   PriceTable @relation(fields: [priceTableId], references: [id], onDelete: Cascade)
  minWeight    Float      // Peso minimo em kg (inclusive)
  maxWeight    Float      // Peso maximo em kg (exclusive)
  price        Float      // Preco em BRL (R$)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  @@index([priceTableId])
  @@index([minWeight, maxWeight])
}
```

### Nota sobre tipos monetarios

SQLite nao suporta `Decimal` nativo. O campo `price` usa `Float` por limitacao do SQLite. Na camada de aplicacao, valores monetarios DEVEM ser arredondados para 2 casas decimais antes de persistir e ao retornar na API. Se migrar para PostgreSQL, trocar para `Decimal` no schema.

## Constraints e Regras de Negocio

### Carrier

| Campo | Regra |
|-------|-------|
| name | Unico, obrigatorio, max 100 caracteres |
| code | Unico, obrigatorio, valores: "PAC", "SEDEX", "PRIVATE" |
| active | Default true |

### PriceTable

| Campo | Regra |
|-------|-------|
| cepOriginStart | 8 digitos numericos, sem hifen |
| cepOriginEnd | 8 digitos numericos, >= cepOriginStart |
| cepDestinationStart | 8 digitos numericos, sem hifen |
| cepDestinationEnd | 8 digitos numericos, >= cepDestinationStart |
| deadlineDays | Inteiro positivo, minimo 1 |
| active | Default true |

### WeightRange

| Campo | Regra |
|-------|-------|
| minWeight | >= 0, < maxWeight |
| maxWeight | > minWeight, <= 150 (limite pratico) |
| price | > 0, arredondado para 2 casas decimais |

## Dados Seed (3 Transportadoras)

### Carriers

```json
[
  { "name": "PAC", "code": "PAC" },
  { "name": "SEDEX", "code": "SEDEX" },
  { "name": "Transportadora Privada", "code": "PRIVATE" }
]
```

### PriceTables — Cobertura Nacional (CEP 01000000 a 99999999)

#### PAC

| Faixa CEP Origem | Faixa CEP Destino | Prazo |
|---|---|---|
| 01000000 - 39999999 | 01000000 - 39999999 | 5 dias |
| 01000000 - 39999999 | 40000000 - 69999999 | 8 dias |
| 01000000 - 39999999 | 70000000 - 99999999 | 10 dias |
| 40000000 - 69999999 | 01000000 - 39999999 | 8 dias |
| 40000000 - 69999999 | 40000000 - 69999999 | 5 dias |
| 40000000 - 69999999 | 70000000 - 99999999 | 8 dias |
| 70000000 - 99999999 | 01000000 - 39999999 | 10 dias |
| 70000000 - 99999999 | 40000000 - 69999999 | 8 dias |
| 70000000 - 99999999 | 70000000 - 99999999 | 5 dias |

**Weight Ranges (PAC — por PriceTable):**

| Min (kg) | Max (kg) | Preco (R$) |
|----------|----------|------------|
| 0 | 1 | 15.90 |
| 1 | 5 | 25.50 |
| 5 | 10 | 38.00 |
| 10 | 30 | 65.00 |
| 30 | 50 | 95.00 |

#### SEDEX

Mesmas faixas de CEP do PAC, com prazos reduzidos:

| Distancia | Prazo |
|-----------|-------|
| Mesma regiao | 2 dias |
| Regioes adjacentes | 4 dias |
| Regioes distantes | 6 dias |

**Weight Ranges (SEDEX — por PriceTable):**

| Min (kg) | Max (kg) | Preco (R$) |
|----------|----------|------------|
| 0 | 1 | 25.90 |
| 1 | 5 | 42.50 |
| 5 | 10 | 62.00 |
| 10 | 30 | 98.00 |
| 30 | 50 | 145.00 |

#### Transportadora Privada

Mesmas faixas de CEP, com prazos intermediarios:

| Distancia | Prazo |
|-----------|-------|
| Mesma regiao | 3 dias |
| Regioes adjacentes | 6 dias |
| Regioes distantes | 8 dias |

**Weight Ranges (Privada — por PriceTable):**

| Min (kg) | Max (kg) | Preco (R$) |
|----------|----------|------------|
| 0 | 1 | 18.90 |
| 1 | 5 | 30.00 |
| 5 | 10 | 45.00 |
| 10 | 30 | 72.00 |
| 30 | 50 | 110.00 |

## Logica de Calculo de Frete

Para uma simulacao com `originCep`, `destinationCep` e `weight`:

```sql
-- Pseudoquery: encontrar PriceTables aplicaveis
SELECT pt.*, c.name, c.code
FROM PriceTable pt
JOIN Carrier c ON c.id = pt.carrierId
WHERE pt.active = true
  AND c.active = true
  AND pt.cepOriginStart <= :originCep
  AND pt.cepOriginEnd >= :originCep
  AND pt.cepDestinationStart <= :destinationCep
  AND pt.cepDestinationEnd >= :destinationCep;

-- Para cada PriceTable encontrada, buscar o preco pela faixa de peso
SELECT wr.price
FROM WeightRange wr
WHERE wr.priceTableId = :priceTableId
  AND wr.minWeight <= :weight
  AND wr.maxWeight > :weight;
```

Se nenhuma PriceTable ou WeightRange for encontrada para uma transportadora, ela NAO aparece nos resultados (em vez de retornar erro).

## Dimensoes (Cubagem)

As dimensoes (altura, largura, comprimento) sao usadas para calcular o **peso cubado**:

```
pesoCubado = (altura_cm * largura_cm * comprimento_cm) / 6000
```

O peso efetivo para calculo e o **maior** entre peso real e peso cubado:

```
pesoEfetivo = max(pesoReal, pesoCubado)
```

Este calculo e feito na camada de aplicacao (API), nao no banco.
