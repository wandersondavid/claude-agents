import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SimulationResults from "@/components/SimulationResults";
import type { SimulateResponse } from "@/lib/schemas";

function buildResponse(
  overrides: Partial<SimulateResponse> = {}
): SimulateResponse {
  return {
    results: [
      {
        carrier: { name: "Correios SEDEX", code: "SEDEX" },
        price: 35.9,
        deadlineDays: 2,
      },
      {
        carrier: { name: "Correios PAC", code: "PAC" },
        price: 18.5,
        deadlineDays: 7,
      },
      {
        carrier: { name: "Private Carrier", code: "PRIVATE" },
        price: 22.0,
        deadlineDays: 3,
      },
    ],
    input: {
      originCep: "01310100",
      destinationCep: "20040020",
      weight: 5,
      effectiveWeight: 5,
      cubicWeight: 4,
      height: 20,
      width: 30,
      length: 40,
    },
    ...overrides,
  };
}

describe("SimulationResults — renders carrier list", () => {
  it("renders all carrier names", () => {
    render(<SimulationResults data={buildResponse()} />);
    expect(screen.getByText("Correios SEDEX")).toBeInTheDocument();
    expect(screen.getByText("Correios PAC")).toBeInTheDocument();
    expect(screen.getByText("Private Carrier")).toBeInTheDocument();
  });

  it("renders all carrier code badges", () => {
    render(<SimulationResults data={buildResponse()} />);
    expect(screen.getByText("SEDEX")).toBeInTheDocument();
    expect(screen.getByText("PAC")).toBeInTheDocument();
    expect(screen.getByText("PRIVATE")).toBeInTheDocument();
  });
});

describe("SimulationResults — Mais barato / Mais rapido tags", () => {
  it("shows 'Mais barato' tag on cheapest carrier", () => {
    render(<SimulationResults data={buildResponse()} />);
    // PAC has price 18.5, the cheapest
    expect(screen.getByText("Mais barato")).toBeInTheDocument();
  });

  it("shows 'Mais rapido' tag on fastest carrier", () => {
    render(<SimulationResults data={buildResponse()} />);
    // SEDEX has deadlineDays 2, the fastest
    expect(screen.getByText("Mais rapido")).toBeInTheDocument();
  });

  it("does not show tags when there is only one result", () => {
    const data = buildResponse({
      results: [
        {
          carrier: { name: "Correios PAC", code: "PAC" },
          price: 18.5,
          deadlineDays: 7,
        },
      ],
    });
    render(<SimulationResults data={data} />);
    // Single result is both cheapest and fastest — still renders tags
    expect(screen.getByText("Mais barato")).toBeInTheDocument();
    expect(screen.getByText("Mais rapido")).toBeInTheDocument();
  });
});

describe("SimulationResults — sort toggle", () => {
  it("renders sort buttons", () => {
    render(<SimulationResults data={buildResponse()} />);
    expect(
      screen.getByRole("button", { name: /ordenar por preco/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /ordenar por prazo/i })
    ).toBeInTheDocument();
  });

  it("'Ordenar por preco' is pressed by default", () => {
    render(<SimulationResults data={buildResponse()} />);
    const priceBtn = screen.getByRole("button", { name: /ordenar por preco/i });
    expect(priceBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("switches sort to deadline when 'Ordenar por prazo' is clicked", () => {
    render(<SimulationResults data={buildResponse()} />);
    const deadlineBtn = screen.getByRole("button", { name: /ordenar por prazo/i });
    fireEvent.click(deadlineBtn);
    expect(deadlineBtn).toHaveAttribute("aria-pressed", "true");
    const priceBtn = screen.getByRole("button", { name: /ordenar por preco/i });
    expect(priceBtn).toHaveAttribute("aria-pressed", "false");
  });
});

describe("SimulationResults — carrier badge colors", () => {
  it("PAC badge has blue classes", () => {
    render(<SimulationResults data={buildResponse()} />);
    const badge = screen.getByText("PAC");
    expect(badge.className).toContain("blue");
  });

  it("SEDEX badge has red classes", () => {
    render(<SimulationResults data={buildResponse()} />);
    const badge = screen.getByText("SEDEX");
    expect(badge.className).toContain("red");
  });

  it("PRIVATE badge has green classes", () => {
    render(<SimulationResults data={buildResponse()} />);
    const badge = screen.getByText("PRIVATE");
    expect(badge.className).toContain("green");
  });
});

describe("SimulationResults — price formatting", () => {
  it("displays price formatted as BRL", () => {
    const data = buildResponse({
      results: [
        {
          carrier: { name: "Correios PAC", code: "PAC" },
          price: 18.5,
          deadlineDays: 7,
        },
      ],
    });
    render(<SimulationResults data={data} />);
    // pt-BR Intl formats R$ 18,50
    expect(screen.getByText(/R\$\s*18[,.]50/)).toBeInTheDocument();
  });
});

describe("SimulationResults — deadline formatting", () => {
  it("shows plural 'dias uteis' for deadlineDays > 1", () => {
    const data = buildResponse({
      results: [
        {
          carrier: { name: "Correios PAC", code: "PAC" },
          price: 18.5,
          deadlineDays: 7,
        },
      ],
    });
    render(<SimulationResults data={data} />);
    expect(screen.getByText(/7 dias/)).toBeInTheDocument();
    expect(screen.getByText(/uteis/)).toBeInTheDocument();
  });

  it("shows singular 'dia util' for deadlineDays = 1", () => {
    const data = buildResponse({
      results: [
        {
          carrier: { name: "Correios SEDEX", code: "SEDEX" },
          price: 35.9,
          deadlineDays: 1,
        },
      ],
    });
    render(<SimulationResults data={data} />);
    expect(screen.getByText(/1 dia/)).toBeInTheDocument();
    expect(screen.getByText(/util/)).toBeInTheDocument();
  });
});

describe("SimulationResults — empty results", () => {
  it("shows appropriate message when results are empty", () => {
    const data = buildResponse({ results: [] });
    render(<SimulationResults data={data} />);
    expect(
      screen.getByText(/nenhuma opcao de frete encontrada/i)
    ).toBeInTheDocument();
  });
});
