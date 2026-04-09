import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SimulationHistory, {
  loadHistory,
  saveToHistory,
  clearHistory,
} from "@/components/SimulationHistory";
import type { HistoryEntry } from "@/lib/types";
import type { SimulationFormValues } from "@/lib/types";

// ---------- localStorage stub helpers ----------

function makeLocalStorageStub() {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((k) => delete store[k]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
}

function buildEntry(id: string): HistoryEntry {
  return {
    id,
    date: "2024-06-01T10:00:00.000Z",
    originCep: "01310100",
    destinationCep: "20040020",
    weight: 5,
    dimensions: { height: 20, width: 30, length: 40 },
    results: [
      {
        carrier: { name: "Correios PAC", code: "PAC" },
        price: 18.5,
        deadlineDays: 7,
      },
    ],
  };
}

describe("localStorage utilities — saveToHistory / loadHistory", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", makeLocalStorageStub());
  });

  it("saveToHistory adds an entry that loadHistory returns", () => {
    const entry = buildEntry("1");
    saveToHistory(entry);
    const history = loadHistory();
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe("1");
  });

  it("loadHistory returns empty array when localStorage is empty", () => {
    const history = loadHistory();
    expect(history).toHaveLength(0);
  });

  it("prepends new entries (newest first)", () => {
    saveToHistory(buildEntry("old"));
    saveToHistory(buildEntry("new"));
    const history = loadHistory();
    expect(history[0].id).toBe("new");
    expect(history[1].id).toBe("old");
  });
});

describe("localStorage utilities — max 20 entries", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", makeLocalStorageStub());
  });

  it("enforces maximum of 20 entries, dropping oldest", () => {
    for (let i = 1; i <= 21; i++) {
      saveToHistory(buildEntry(String(i)));
    }
    const history = loadHistory();
    expect(history).toHaveLength(20);
    // entry "1" was the first saved, so it is the oldest and should be gone
    const ids = history.map((e) => e.id);
    expect(ids).not.toContain("1");
    expect(ids).toContain("21");
  });
});

describe("localStorage utilities — clearHistory", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", makeLocalStorageStub());
  });

  it("clearHistory removes all entries", () => {
    saveToHistory(buildEntry("1"));
    saveToHistory(buildEntry("2"));
    clearHistory();
    const history = loadHistory();
    expect(history).toHaveLength(0);
  });
});

// ---------- Component tests ----------

describe("SimulationHistory component — renders entries", () => {
  beforeEach(() => {
    const stub = makeLocalStorageStub();
    const entry = buildEntry("entry-1");
    stub.setItem("freight-simulator-history", JSON.stringify([entry]));
    vi.stubGlobal("localStorage", stub);
  });

  it("renders a history entry with origin and destination CEPs", () => {
    render(<SimulationHistory onRedo={vi.fn()} refreshKey={0} />);
    // formatted as 01310-100 → 20040-020
    expect(screen.getByText(/01310-100/)).toBeInTheDocument();
    expect(screen.getByText(/20040-020/)).toBeInTheDocument();
  });

  it("renders the 'Refazer' button for each entry", () => {
    render(<SimulationHistory onRedo={vi.fn()} refreshKey={0} />);
    expect(screen.getByRole("button", { name: "Refazer" })).toBeInTheDocument();
  });
});

describe("SimulationHistory component — Refazer button", () => {
  beforeEach(() => {
    const stub = makeLocalStorageStub();
    const entry = buildEntry("entry-1");
    stub.setItem("freight-simulator-history", JSON.stringify([entry]));
    vi.stubGlobal("localStorage", stub);
  });

  it("calls onRedo with correctly mapped values when Refazer is clicked", () => {
    const onRedo = vi.fn();
    render(<SimulationHistory onRedo={onRedo} refreshKey={0} />);
    fireEvent.click(screen.getByRole("button", { name: "Refazer" }));
    expect(onRedo).toHaveBeenCalledOnce();
    const calledWith: SimulationFormValues = onRedo.mock.calls[0][0];
    expect(calledWith.originCep).toBe("01310-100");
    expect(calledWith.destinationCep).toBe("20040-020");
    expect(calledWith.weight).toBe("5");
    expect(calledWith.height).toBe("20");
    expect(calledWith.width).toBe("30");
    expect(calledWith.length).toBe("40");
  });
});

describe("SimulationHistory component — Limpar historico", () => {
  beforeEach(() => {
    const stub = makeLocalStorageStub();
    const entry = buildEntry("entry-1");
    stub.setItem("freight-simulator-history", JSON.stringify([entry]));
    vi.stubGlobal("localStorage", stub);
  });

  it("shows confirmation UI when 'Limpar historico' is clicked", () => {
    render(<SimulationHistory onRedo={vi.fn()} refreshKey={0} />);
    fireEvent.click(screen.getByRole("button", { name: "Limpar historico" }));
    expect(screen.getByText(/tem certeza/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
  });

  it("hides confirmation when Cancelar is clicked", () => {
    render(<SimulationHistory onRedo={vi.fn()} refreshKey={0} />);
    fireEvent.click(screen.getByRole("button", { name: "Limpar historico" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByText(/tem certeza/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Limpar historico" })
    ).toBeInTheDocument();
  });
});

describe("SimulationHistory component — empty history", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", makeLocalStorageStub());
  });

  it("renders nothing (null) when history is empty", () => {
    const { container } = render(
      <SimulationHistory onRedo={vi.fn()} refreshKey={0} />
    );
    expect(container.firstChild).toBeNull();
  });
});
