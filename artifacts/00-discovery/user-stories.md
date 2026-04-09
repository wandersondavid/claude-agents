# User Stories — Simulador de Frete

## Visao Geral
Sistema web para simulacao de frete que permite ao usuario calcular custos de envio com base em origem, destino, peso e dimensoes do pacote, comparando diferentes transportadoras.

---

## US-001: Simulacao de Frete
**Como** usuario, **quero** informar origem, destino, peso e dimensoes do pacote **para** receber uma estimativa de custo e prazo de entrega.

### Criterios de Aceitacao
- Informar CEP de origem e CEP de destino
- Informar peso (kg) e dimensoes (altura, largura, comprimento em cm)
- Exibir resultado com preco e prazo estimado
- Validar CEPs e dimensoes antes de calcular

---

## US-002: Comparacao de Transportadoras
**Como** usuario, **quero** ver opcoes de diferentes transportadoras lado a lado **para** escolher a melhor relacao custo-beneficio.

### Criterios de Aceitacao
- Exibir no minimo 3 opcoes de frete (ex: PAC, SEDEX, Transportadora Privada)
- Mostrar preco e prazo para cada opcao
- Ordenar por preco ou prazo
- Destacar a opcao mais barata e a mais rapida

---

## US-003: Historico de Simulacoes
**Como** usuario, **quero** ver minhas simulacoes anteriores **para** consultar valores ja calculados sem precisar refazer a simulacao.

### Criterios de Aceitacao
- Listar simulacoes recentes (armazenamento local)
- Exibir data, origem, destino, peso e resultado
- Permitir refazer uma simulacao a partir do historico
- Limpar historico

---

## US-004: Calculo de Frete por Tabela de Precos
**Como** administrador, **quero** configurar tabelas de precos por faixa de CEP e peso **para** que o sistema calcule valores personalizados.

### Criterios de Aceitacao
- CRUD de tabelas de preco
- Definir faixas de CEP (origem/destino)
- Definir faixas de peso com preco correspondente
- Definir prazo por faixa
- Tabela padrao pre-carregada

---

## US-005: API de Simulacao
**Como** desenvolvedor, **quero** uma API REST para simular frete **para** integrar o calculo em outros sistemas.

### Criterios de Aceitacao
- Endpoint POST `/api/simulate` com body: origin, destination, weight, dimensions
- Resposta com array de opcoes (carrier, price, deadline)
- Validacao de entrada com mensagens de erro claras
- Documentacao da API
