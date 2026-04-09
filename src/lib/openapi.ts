/**
 * OpenAPI 3.0.3 specification for Simulador de Frete API.
 *
 * Schema shapes are derived from the Zod schemas in ./schemas.ts and
 * the error types in ./errors.ts. Keep this spec in sync when those
 * files change.
 */

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Simulador de Frete API",
    version: "1.0.0",
    description:
      "API para simulacao de frete e gerenciamento de tabelas de preco. Permite calcular custos de envio com base em CEP de origem/destino, peso e dimensoes do pacote.",
  },
  servers: [
    {
      url: "/",
      description: "Servidor atual",
    },
  ],
  tags: [
    {
      name: "Simulacao",
      description: "Simulacao de frete",
    },
    {
      name: "Transportadoras",
      description: "Listagem de transportadoras",
    },
    {
      name: "Tabelas de Preco",
      description: "CRUD de tabelas de preco",
    },
  ],
  paths: {
    "/api/simulate": {
      post: {
        tags: ["Simulacao"],
        summary: "Simular frete",
        description:
          "Calcula opcoes de frete para um pacote com base em CEPs de origem/destino, peso e dimensoes. Retorna cotacoes de todas as transportadoras com tabelas de preco compativeis.",
        operationId: "simulateFreight",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SimulateRequest" },
              example: {
                originCep: "01001000",
                destinationCep: "20040020",
                weight: 5,
                height: 30,
                width: 40,
                length: 50,
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Simulacao realizada com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SimulateResponse" },
              },
            },
          },
          "400": {
            description: "Dados de entrada invalidos",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiErrorResponse" },
              },
            },
          },
          "500": {
            description: "Erro interno do servidor",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/carriers": {
      get: {
        tags: ["Transportadoras"],
        summary: "Listar transportadoras",
        description: "Retorna a lista de todas as transportadoras cadastradas.",
        operationId: "listCarriers",
        responses: {
          "200": {
            description: "Lista de transportadoras",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CarriersResponse" },
              },
            },
          },
          "500": {
            description: "Erro interno do servidor",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/price-tables": {
      get: {
        tags: ["Tabelas de Preco"],
        summary: "Listar tabelas de preco",
        description:
          "Retorna uma lista paginada de tabelas de preco, com filtros opcionais por transportadora e status.",
        operationId: "listPriceTables",
        parameters: [
          {
            name: "page",
            in: "query",
            description: "Numero da pagina (minimo 1)",
            required: false,
            schema: {
              type: "integer",
              minimum: 1,
              default: 1,
            },
          },
          {
            name: "limit",
            in: "query",
            description: "Itens por pagina (1-100)",
            required: false,
            schema: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 20,
            },
          },
          {
            name: "carrierId",
            in: "query",
            description: "Filtrar por ID da transportadora",
            required: false,
            schema: {
              type: "string",
            },
          },
          {
            name: "active",
            in: "query",
            description: "Filtrar por status ativo/inativo",
            required: false,
            schema: {
              type: "string",
              enum: ["true", "false"],
            },
          },
        ],
        responses: {
          "200": {
            description: "Lista paginada de tabelas de preco",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PriceTableListResponse",
                },
              },
            },
          },
          "400": {
            description: "Parametros de consulta invalidos",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiErrorResponse" },
              },
            },
          },
          "500": {
            description: "Erro interno do servidor",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiErrorResponse" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Tabelas de Preco"],
        summary: "Criar tabela de preco",
        description:
          "Cria uma nova tabela de preco para uma transportadora com faixas de peso e faixas de CEP.",
        operationId: "createPriceTable",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/PriceTableCreateRequest",
              },
              example: {
                carrierId: "clx1234567890",
                cepOriginStart: "01000000",
                cepOriginEnd: "01999999",
                cepDestinationStart: "20000000",
                cepDestinationEnd: "20999999",
                deadlineDays: 5,
                active: true,
                weightRanges: [
                  { minWeight: 0, maxWeight: 5, price: 25.5 },
                  { minWeight: 5, maxWeight: 15, price: 45.0 },
                ],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Tabela de preco criada com sucesso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PriceTableSingleResponse",
                },
              },
            },
          },
          "400": {
            description: "Dados de entrada invalidos",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiErrorResponse" },
              },
            },
          },
          "500": {
            description: "Erro interno do servidor",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/price-tables/{id}": {
      get: {
        tags: ["Tabelas de Preco"],
        summary: "Buscar tabela de preco por ID",
        description: "Retorna uma tabela de preco especifica pelo seu ID.",
        operationId: "getPriceTableById",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID da tabela de preco",
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Tabela de preco encontrada",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PriceTableSingleResponse",
                },
              },
            },
          },
          "404": {
            description: "Tabela de preco nao encontrada",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiErrorResponse" },
              },
            },
          },
          "500": {
            description: "Erro interno do servidor",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiErrorResponse" },
              },
            },
          },
        },
      },
      put: {
        tags: ["Tabelas de Preco"],
        summary: "Atualizar tabela de preco",
        description:
          "Atualiza uma tabela de preco existente. Substitui completamente os dados, incluindo as faixas de peso.",
        operationId: "updatePriceTable",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID da tabela de preco",
            schema: {
              type: "string",
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/PriceTableUpdateRequest",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Tabela de preco atualizada com sucesso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PriceTableSingleResponse",
                },
              },
            },
          },
          "400": {
            description: "Dados de entrada invalidos",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiErrorResponse" },
              },
            },
          },
          "404": {
            description: "Tabela de preco nao encontrada",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiErrorResponse" },
              },
            },
          },
          "500": {
            description: "Erro interno do servidor",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiErrorResponse" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Tabelas de Preco"],
        summary: "Excluir tabela de preco",
        description: "Exclui uma tabela de preco pelo seu ID.",
        operationId: "deletePriceTable",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID da tabela de preco",
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Tabela de preco excluida com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DeleteResponse" },
              },
            },
          },
          "404": {
            description: "Tabela de preco nao encontrada",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiErrorResponse" },
              },
            },
          },
          "500": {
            description: "Erro interno do servidor",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiErrorResponse" },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      SimulateRequest: {
        type: "object",
        required: [
          "originCep",
          "destinationCep",
          "weight",
          "height",
          "width",
          "length",
        ],
        properties: {
          originCep: {
            type: "string",
            pattern: "^\\d{8}$",
            description: "CEP de origem (8 digitos)",
            example: "01001000",
          },
          destinationCep: {
            type: "string",
            pattern: "^\\d{8}$",
            description: "CEP de destino (8 digitos)",
            example: "20040020",
          },
          weight: {
            type: "number",
            exclusiveMinimum: 0,
            maximum: 150,
            description: "Peso do pacote em kg (maximo 150)",
            example: 5,
          },
          height: {
            type: "number",
            exclusiveMinimum: 0,
            maximum: 200,
            description: "Altura do pacote em cm (maximo 200)",
            example: 30,
          },
          width: {
            type: "number",
            exclusiveMinimum: 0,
            maximum: 200,
            description: "Largura do pacote em cm (maximo 200)",
            example: 40,
          },
          length: {
            type: "number",
            exclusiveMinimum: 0,
            maximum: 200,
            description: "Comprimento do pacote em cm (maximo 200)",
            example: 50,
          },
        },
      },
      SimulateResponse: {
        type: "object",
        required: ["results", "input"],
        properties: {
          results: {
            type: "array",
            items: {
              type: "object",
              required: ["carrier", "price", "deadlineDays"],
              properties: {
                carrier: {
                  type: "object",
                  required: ["name", "code"],
                  properties: {
                    name: {
                      type: "string",
                      description: "Nome da transportadora",
                    },
                    code: {
                      type: "string",
                      description: "Codigo da transportadora",
                    },
                  },
                },
                price: {
                  type: "number",
                  description: "Preco do frete em reais",
                },
                deadlineDays: {
                  type: "integer",
                  description: "Prazo de entrega em dias uteis",
                },
              },
            },
          },
          input: {
            type: "object",
            required: [
              "originCep",
              "destinationCep",
              "weight",
              "effectiveWeight",
              "cubicWeight",
              "height",
              "width",
              "length",
            ],
            properties: {
              originCep: { type: "string" },
              destinationCep: { type: "string" },
              weight: {
                type: "number",
                description: "Peso real informado",
              },
              effectiveWeight: {
                type: "number",
                description:
                  "Peso efetivo (maior entre peso real e peso cubico)",
              },
              cubicWeight: {
                type: "number",
                description: "Peso cubico calculado a partir das dimensoes",
              },
              height: { type: "number" },
              width: { type: "number" },
              length: { type: "number" },
            },
          },
        },
      },
      Carrier: {
        type: "object",
        required: ["id", "name", "code", "active", "createdAt", "updatedAt"],
        properties: {
          id: { type: "string" },
          name: {
            type: "string",
            description: "Nome da transportadora",
          },
          code: {
            type: "string",
            description: "Codigo unico da transportadora",
          },
          active: {
            type: "boolean",
            description: "Se a transportadora esta ativa",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            description: "Data de criacao",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            description: "Data da ultima atualizacao",
          },
        },
      },
      CarriersResponse: {
        type: "object",
        required: ["data"],
        properties: {
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/Carrier" },
          },
        },
      },
      WeightRange: {
        type: "object",
        required: ["id", "minWeight", "maxWeight", "price"],
        properties: {
          id: { type: "string" },
          minWeight: {
            type: "number",
            description: "Peso minimo da faixa em kg",
          },
          maxWeight: {
            type: "number",
            description: "Peso maximo da faixa em kg",
          },
          price: {
            type: "number",
            description: "Preco para esta faixa em reais",
          },
        },
      },
      WeightRangeInput: {
        type: "object",
        required: ["minWeight", "maxWeight", "price"],
        properties: {
          minWeight: {
            type: "number",
            minimum: 0,
            description: "Peso minimo da faixa em kg",
          },
          maxWeight: {
            type: "number",
            exclusiveMinimum: 0,
            description:
              "Peso maximo da faixa em kg (deve ser maior que minWeight)",
          },
          price: {
            type: "number",
            exclusiveMinimum: 0,
            description: "Preco para esta faixa em reais",
          },
        },
      },
      PriceTable: {
        type: "object",
        required: [
          "id",
          "carrierId",
          "carrier",
          "cepOriginStart",
          "cepOriginEnd",
          "cepDestinationStart",
          "cepDestinationEnd",
          "deadlineDays",
          "active",
          "createdAt",
          "updatedAt",
          "weightRanges",
        ],
        properties: {
          id: { type: "string" },
          carrierId: { type: "string" },
          carrier: {
            type: "object",
            required: ["id", "name", "code"],
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              code: { type: "string" },
            },
          },
          cepOriginStart: {
            type: "string",
            pattern: "^\\d{8}$",
            description: "CEP de origem inicio da faixa",
          },
          cepOriginEnd: {
            type: "string",
            pattern: "^\\d{8}$",
            description: "CEP de origem fim da faixa",
          },
          cepDestinationStart: {
            type: "string",
            pattern: "^\\d{8}$",
            description: "CEP de destino inicio da faixa",
          },
          cepDestinationEnd: {
            type: "string",
            pattern: "^\\d{8}$",
            description: "CEP de destino fim da faixa",
          },
          deadlineDays: {
            type: "integer",
            description: "Prazo de entrega em dias uteis",
          },
          active: {
            type: "boolean",
            description: "Se a tabela esta ativa",
          },
          createdAt: {
            type: "string",
            format: "date-time",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
          },
          weightRanges: {
            type: "array",
            items: { $ref: "#/components/schemas/WeightRange" },
          },
        },
      },
      PriceTableCreateRequest: {
        type: "object",
        required: [
          "carrierId",
          "cepOriginStart",
          "cepOriginEnd",
          "cepDestinationStart",
          "cepDestinationEnd",
          "deadlineDays",
          "active",
          "weightRanges",
        ],
        properties: {
          carrierId: {
            type: "string",
            minLength: 1,
            description: "ID da transportadora",
          },
          cepOriginStart: {
            type: "string",
            pattern: "^\\d{8}$",
            description: "CEP de origem inicio da faixa",
          },
          cepOriginEnd: {
            type: "string",
            pattern: "^\\d{8}$",
            description:
              "CEP de origem fim da faixa (deve ser >= cepOriginStart)",
          },
          cepDestinationStart: {
            type: "string",
            pattern: "^\\d{8}$",
            description: "CEP de destino inicio da faixa",
          },
          cepDestinationEnd: {
            type: "string",
            pattern: "^\\d{8}$",
            description:
              "CEP de destino fim da faixa (deve ser >= cepDestinationStart)",
          },
          deadlineDays: {
            type: "integer",
            minimum: 1,
            description: "Prazo de entrega em dias uteis",
          },
          active: {
            type: "boolean",
            description: "Se a tabela esta ativa",
          },
          weightRanges: {
            type: "array",
            minItems: 1,
            items: { $ref: "#/components/schemas/WeightRangeInput" },
            description: "Faixas de peso com precos",
          },
        },
      },
      PriceTableUpdateRequest: {
        $ref: "#/components/schemas/PriceTableCreateRequest",
      },
      PriceTableSingleResponse: {
        type: "object",
        required: ["data"],
        properties: {
          data: { $ref: "#/components/schemas/PriceTable" },
        },
      },
      PriceTableListResponse: {
        type: "object",
        required: ["data", "meta"],
        properties: {
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/PriceTable" },
          },
          meta: { $ref: "#/components/schemas/PaginationMeta" },
        },
      },
      PaginationMeta: {
        type: "object",
        required: ["total", "page", "limit", "totalPages"],
        properties: {
          total: {
            type: "integer",
            description: "Total de registros",
          },
          page: {
            type: "integer",
            description: "Pagina atual",
          },
          limit: {
            type: "integer",
            description: "Itens por pagina",
          },
          totalPages: {
            type: "integer",
            description: "Total de paginas",
          },
        },
      },
      DeleteResponse: {
        type: "object",
        required: ["success"],
        properties: {
          success: {
            type: "boolean",
            description: "Indica se a exclusao foi realizada com sucesso",
          },
        },
      },
      ApiErrorResponse: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message"],
            properties: {
              code: {
                type: "string",
                enum: ["VALIDATION_ERROR", "NOT_FOUND", "INTERNAL_ERROR"],
                description: "Codigo do erro",
              },
              message: {
                type: "string",
                description: "Mensagem descritiva do erro",
              },
              details: {
                description:
                  "Detalhes adicionais do erro (ex: erros de validacao por campo)",
              },
            },
          },
        },
      },
    },
  },
} as const;

export type OpenApiSpec = typeof openApiSpec;
