import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:8000/api" });

type Materia = {
  id: number;
  nome: string;
  quantidade: number;
  estoque_minimo: number;
  preco_compra: number;
  unidade: string;
  fornecedor: string | null;
  status_alerta: "ok" | "baixo" | "critico";
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; dot: string }> = {
    ok:      { label: "OK",      color: "#1D9E75", dot: "#1D9E75" },
    baixo:   { label: "Baixo",   color: "#BA7517", dot: "#BA7517" },
    critico: { label: "Crítico", color: "#e24b4a", dot: "#e24b4a" },
  };
  const s = map[status] ?? map.ok;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 500, color: s.color }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, display: "inline-block" }} />
      {s.label}
    </span>
  );
}

function StockBar({ qty, min }: { qty: number; min: number }) {
  const pct = Math.min(100, (qty / Math.max(min * 3, 1)) * 100);
  const color = qty <= min * 0.3 ? "#e24b4a" : qty <= min ? "#BA7517" : "#1D9E75";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 4, borderRadius: 2, background: "#eceef2" }}>
        <div style={{ width: `${pct.toFixed(0)}%`, height: 4, borderRadius: 2, background: color }} />
      </div>
      <span style={{ fontSize: 11, color: "#6b7280", minWidth: 80 }}>{qty}g / mín {min}g</span>
    </div>
  );
}

export default function Estoque() {
  const qc = useQueryClient();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "critico" | "baixo">("todos");
  const [editando, setEditando] = useState<Materia | null>(null);
  const [novaQty, setNovaQty] = useState("");

  const { data: materias = [], isLoading } = useQuery<Materia[]>({
    queryKey: ["materias", busca],
    queryFn: async () => {
      const { data } = await api.get("/materias/", { params: busca ? { busca } : {} });
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, quantidade }: { id: number; quantidade: number }) =>
      api.put(`/materias/${id}`, { quantidade }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["materias"] }); setEditando(null); },
  });

  const filtradas = materias.filter((m) => {
    if (filtro === "critico") return m.status_alerta === "critico";
    if (filtro === "baixo") return m.status_alerta === "baixo" || m.status_alerta === "critico";
    return true;
  });

  const criticos = materias.filter((m) => m.status_alerta !== "ok").length;
  const valorTotal = materias.reduce((s, m) => s + m.quantidade * m.preco_compra, 0);

  return (
    <div style={{ padding: "20px 24px" }}>
      {/* Alerta */}
      {criticos > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff3cd", border: "0.5px solid #e6a817", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#7a5a00" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#BA7517"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
          <span><strong>{criticos} matérias-primas</strong> abaixo do estoque mínimo — verifique antes de manipular.</span>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Total de itens", value: materias.length, sub: "matérias-primas", color: "#1a3a5c" },
          { label: "Estoque crítico", value: criticos, sub: "abaixo do mínimo", color: criticos > 0 ? "#e24b4a" : "#1D9E75" },
          { label: "Itens OK", value: materias.length - criticos, sub: "em nível adequado", color: "#1D9E75" },
          { label: "Valor em estoque", value: `R$${valorTotal.toFixed(2).replace(".", ",")}`, sub: "custo de compra", color: "#1a3a5c" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.1)", borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} width="13" height="13" viewBox="0 0 24 24" fill="#9ca3af"><path d="M15.5 14h-.79l-.28-.27A6.5 6.5 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar matéria-prima..."
            style={{ width: "100%", padding: "8px 12px 8px 32px", border: "0.5px solid rgba(0,0,0,0.15)", borderRadius: 8, fontSize: 13, outline: "none", background: "#fff" }}
          />
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {(["todos", "critico", "baixo"] as const).map((f) => (
            <button key={f} onClick={() => setFiltro(f)}
              style={{ fontSize: 11, padding: "6px 12px", borderRadius: 20, border: "0.5px solid", cursor: "pointer", borderColor: filtro === f ? "#1a3a5c" : "rgba(0,0,0,0.15)", background: filtro === f ? "#1a3a5c" : "#fff", color: filtro === f ? "#fff" : "#6b7280" }}>
              {f === "todos" ? "Todos" : f === "critico" ? "Crítico" : "Baixo"}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.1)", borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f4f5f7" }}>
              {["Nome", "Quantidade", "Estoque Mínimo", "Preço/g", "Status", "Ação"].map((h) => (
                <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "#6b7280", borderBottom: "0.5px solid rgba(0,0,0,0.1)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: "#6b7280" }}>Carregando...</td></tr>
            ) : filtradas.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: "#6b7280" }}>Nenhuma matéria-prima encontrada.</td></tr>
            ) : filtradas.map((m) => (
              <tr key={m.id} style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
                <td style={{ padding: "10px 14px", fontWeight: 500 }}>{m.nome}</td>
                <td style={{ padding: "10px 14px", minWidth: 200 }}><StockBar qty={m.quantidade} min={m.estoque_minimo} /></td>
                <td style={{ padding: "10px 14px", color: "#6b7280" }}>{m.estoque_minimo}g</td>
                <td style={{ padding: "10px 14px", color: "#6b7280" }}>R${m.preco_compra.toFixed(2)}/g</td>
                <td style={{ padding: "10px 14px" }}><StatusBadge status={m.status_alerta} /></td>
                <td style={{ padding: "10px 14px" }}>
                  <button onClick={() => { setEditando(m); setNovaQty(String(m.quantidade)); }}
                    style={{ fontSize: 11, padding: "4px 10px", border: "0.5px solid #378ADD", borderRadius: 5, background: "none", color: "#378ADD", cursor: "pointer" }}>
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal edição */}
      {editando && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 24, width: 360, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>{editando.nome}</h3>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>Quantidade atual: {editando.quantidade}g</p>
            <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>Nova quantidade (g)</label>
            <input type="number" value={novaQty} onChange={(e) => setNovaQty(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", border: "0.5px solid rgba(0,0,0,0.2)", borderRadius: 8, fontSize: 14, outline: "none", marginBottom: 16 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setEditando(null)}
                style={{ flex: 1, padding: 10, border: "0.5px solid rgba(0,0,0,0.15)", borderRadius: 8, background: "none", cursor: "pointer", fontSize: 13 }}>
                Cancelar
              </button>
              <button onClick={() => updateMutation.mutate({ id: editando.id, quantidade: parseFloat(novaQty) })}
                style={{ flex: 1, padding: 10, border: "none", borderRadius: 8, background: "#1a3a5c", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                {updateMutation.isPending ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}