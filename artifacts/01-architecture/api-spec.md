# API Specification — Simulador de Frete

## Base URL

```
/api
```

## Contrato de Erro Padronizado

Todas as respostas de erro seguem este formato:

```typescript
interface ApiError {
  error: {
    code: "VALIDATION_ERROR" | "NOT_FOUND" | "CONFLICT" | "INTERNAL_ERROR";
    message: string;      // Mensagem segura para o usuario
    details?: unknown;    // Detalhes de validacao (Zod issues)
  }
}
```

### HTTP Status Codes

| Status | Uso |
|--------|-----|
| 200 | Sucesso (GET, PUT) |
| 201 | Recurso criado (POST) |
| 204 | Sucesso sem body (DELETE) |
| 400 | Erro de validacao |
| 404 | Recurso nao encontrado |
| 409 | Conflito (duplicata) |
| 500 | Erro interno |

---

## Estrategia de Paginacao

Endpoints de listagem usam paginacao baseada em offset:

```
Request: ?page=1&limit=20
```

- `page`: numero da pagina (default: 1, minimo: 1)
- `limit`: itens por pagina (default: 20, minimo: 1, maximo: 100)

```typescript
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
}
```

---

## Schemas Zod

### Schemas de Validacao Compartilhados

```typescript
import { z } from "zod";

// CEP: 8 digitos numericos (sem hifen)
const cepSchema = z
  .string()
  .regex(/^\d{8}$/, "CEP deve conter exatamente 8 digitos numericos");

// Peso em kg
const weightSchema = z
  .number()
  .positive("Peso deve ser positivo")
  .max(150, "Peso maximo e 150 kg");

// Dimensao em cm
const dimensionSchema = z
  .number()
  .positive("Dimensao deve ser positiva")
  .max(200, "Dimensao maxima e 200 cm");
```

---

## Endpoints

### 1. POST /api/simulate

Simula o frete para todas as transportadoras ativas.

#### Request

```typescript
const SimulateRequestSchema = z.object({
  originCep: cepSchema,
  destinationCep: cepSchema,
  weight: weightSchema,
  height: dimensionSchema,
  width: dimensionSchema,
  length: dimensionSchema,
});

type SimulateRequest = z.infer<typeof SimulateRequestSchema>;
```

**Exemplo:**

```json
{
  "originCep": "01310100",
  "destinationCep": "40010000",
  "weight": 2.5,
  "height": 20,
  "width": 30,
  "length": 40
}
```

#### Response — 200 OK

```typescript
interface SimulateResponse {
  results: SimulationResult[];
  input: {
    originCep: string;
    destinationCep: string;
    weight: number;
    effectiveWeight: number; // max(weight, cubicWeight)
    cubicWeight: number;     // (h * w * l) / 6000
    height: number;
    width: number;
    length: number;
  };
}

interface SimulationResult {
  carrier: {
    name: string;
    code: string;  // "PAC" | "SEDEX" | "PRIVATE"
  };
  price: number;        // Em BRL, 2 casas decimais
  deadlineDays: number;  // Dias uteis
}
```

**Exemplo:**

```json
{
  "results": [
    {
      "carrier": { "name": "PAC", "code": "PAC" },
      "price": 25.50,
      "deadlineDays": 8
    },
    {
      "carrier": { "name": "SEDEX", "code": "SEDEX" },
      "price": 42.50,
      "deadlineDays": 4
    },
    {
      "carrier": { "name": "Transportadora Privada", "code": "PRIVATE" },
      "price": 30.00,
      "deadlineDays": 6
    }
  ],
  "input": {
    "originCep": "01310100",
    "destinationCep": "40010000",
    "weight": 2.5,
    "effectiveWeight": 2.5,
    "cubicWeight": 0.4,
    "height": 20,
    "width": 30,
    "length": 40
  }
}
```

#### Response — 400 Validation Error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados de entrada invalidos",
    "details": [
      {
        "path": ["originCep"],
        "message": "CEP deve conter exatamente 8 digitos numericos"
      }
    ]
  }
}
```

#### Logica de Calculo

1. Validar entrada com `SimulateRequestSchema`
2. Calcular peso cubado: `(height * width * length) / 6000`
3. Determinar peso efetivo: `max(weight, cubicWeight)`
4. Para cada transportadora ativa:
   a. Buscar PriceTable onde o CEP de origem e destino estao dentro das faixas
   b. Buscar WeightRange correspondente ao peso efetivo
   c. Se encontrou ambos, incluir no resultado
5. Retornar resultados ordenados por preco (ascendente)

---

### 2. GET /api/carriers

Lista todas as transportadoras.

#### Response — 200 OK

```typescript
interface CarriersResponse {
  data: {
    id: string;
    name: string;
    code: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
  }[];
}
```

Nao paginado (numero fixo e pequeno de transportadoras).

---

### 3. GET /api/price-tables

Lista tabelas de preco com paginacao e filtros.

#### Query Parameters

| Param | Tipo | Default | Descricao |
|-------|------|---------|-----------|
| page | number | 1 | Pagina |
| limit | number | 20 | Itens por pagina (max 100) |
| carrierId | string | - | Filtrar por transportadora |
| active | boolean | - | Filtrar por status |

#### Response — 200 OK

```typescript
interface PriceTablesResponse {
  data: {
    id: string;
    carrierId: string;
    carrier: {
      id: string;
      name: string;
      code: string;
    };
    cepOriginStart: string;
    cepOriginEnd: string;
    cepDestinationStart: string;
    cepDestinationEnd: string;
    deadlineDays: number;
    active: boolean;
    weightRanges: {
      id: string;
      minWeight: number;
      maxWeight: number;
      price: number;
    }[];
    createdAt: string;
    updatedAt: string;
  }[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

---

### 4. GET /api/price-tables/:id

Retorna uma tabela de preco por ID.

#### Response — 200 OK

Mesmo formato de um item do array em `GET /api/price-tables`.

#### Response — 404 Not Found

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Tabela de preco nao encontrada"
  }
}
```

---

### 5. POST /api/price-tables

Cria uma nova tabela de preco.

#### Request

```typescript
const CreatePriceTableSchema = z.object({
  carrierId: z.string().min(1, "Carrier ID e obrigatorio"),
  cepOriginStart: cepSchema,
  cepOriginEnd: cepSchema,
  cepDestinationStart: cepSchema,
  cepDestinationEnd: cepSchema,
  deadlineDays: z.number().int().min(1, "Prazo minimo e 1 dia"),
  active: z.boolean().default(true),
  weightRanges: z
    .array(
      z.object({
        minWeight: z.number().min(0, "Peso minimo deve ser >= 0"),
        maxWeight: z.number().positive("Peso maximo deve ser positivo"),
        price: z.number().positive("Preco deve ser positivo"),
      })
    )
    .min(1, "Ao menos uma faixa de peso e obrigatoria"),
});

type CreatePriceTableRequest = z.infer<typeof CreatePriceTableSchema>;
```

#### Validacoes Adicionais (Application Layer)

- `cepOriginEnd >= cepOriginStart`
- `cepDestinationEnd >= cepDestinationStart`
- Cada weightRange: `maxWeight > minWeight`
- Weight ranges nao podem ter gaps ou sobreposicoes dentro da mesma PriceTable

#### Response — 201 Created

Retorna o objeto criado (mesmo formato de GET :id).

#### Response — 400 Validation Error

Formato padrao `ApiError`.

---

### 6. PUT /api/price-tables/:id

Atualiza uma tabela de preco existente.

#### Request

Mesmo schema de POST, todos os campos obrigatorios (full replace). Weight ranges sao substituidas integralmente (delete + insert).

#### Response — 200 OK

Retorna o objeto atualizado.

#### Response — 404 Not Found

Formato padrao `ApiError`.

---

### 7. DELETE /api/price-tables/:id

Remove uma tabela de preco e suas weight ranges (cascade).

#### Response — 204 No Content

Body vazio.

#### Response — 404 Not Found

Formato padrao `ApiError`.

---

## Validacoes de Entrada — Resumo

### Simulacao (POST /api/simulate)

| Campo | Tipo | Regra |
|-------|------|-------|
| originCep | string | 8 digitos numericos |
| destinationCep | string | 8 digitos numericos |
| weight | number | > 0, <= 150 |
| height | number | > 0, <= 200 |
| width | number | > 0, <= 200 |
| length | number | > 0, <= 200 |

### Price Table (POST/PUT /api/price-tables)

| Campo | Tipo | Regra |
|-------|------|-------|
| carrierId | string | Existente no banco |
| cepOriginStart | string | 8 digitos, <= cepOriginEnd |
| cepOriginEnd | string | 8 digitos, >= cepOriginStart |
| cepDestinationStart | string | 8 digitos, <= cepDestinationEnd |
| cepDestinationEnd | string | 8 digitos, >= cepDestinationStart |
| deadlineDays | integer | >= 1 |
| active | boolean | Default true |
| weightRanges | array | Min 1 item |
| weightRanges[].minWeight | number | >= 0, < maxWeight |
| weightRanges[].maxWeight | number | > minWeight |
| weightRanges[].price | number | > 0 |

---

## Rate Limiting

Nao aplicavel nesta versao (sem autenticacao, sem endpoints publicos expostos na internet). Quando houver deploy em producao:

- `/api/simulate`: max 60 req/min por IP
- `/api/price-tables` (write): max 30 req/min por IP

---

## CORS

Em desenvolvimento: permitir `localhost:3000`.
Em producao: configurar origins permitidos via variavel de ambiente `ALLOWED_ORIGINS`.
