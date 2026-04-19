import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { Pedido, StatusPedido } from "../types";
import StatusBadge from "../components/shared/StatusBadge";
import { useToast } from "../components/shared/Toast";

const TABS: { key: StatusPedido | "todos"; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "aguardando", label: "Aguardando" },
  { key: "em_preparo", label: "Em preparo" },
  { key: "concluido", label: "Concluídos" },
];

const rowBg: Record<StatusPedido, string> = {
  aguardando: "#fff",
  em_preparo: "#fffbf0",
  concluido:  "#f0faf5",
  cancelado:  "#fff5f5",
};

const rowOpacity: Record<StatusPedido, number> = {
  aguardando: 1,
  em_preparo: 1,
  concluido: 0.75,
  cancelado: 0.65,
};

export default function Pedidos() {
  const [tab, setTab] = useState<StatusPedido | "todos">("todos");
  const [expanded, setExpanded] = useState<number | null>(null);
  const qc = useQueryClient();
  const { showToast } = useToast();

  const { data: pedidos = [], isLoading, isError, refetch } = useQuery<Pedido[]>({
    queryKey: ["pedidos"],
    queryFn: async () => {
      const res = await api.get("/pedidos/");
      return res.data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: StatusPedido }) => {
      await api.put(`/pedidos/${id}`, { status });
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["pedidos"] });
      const label = vars.status === "em_preparo" ? "Em preparo" : "Concluído";
      showToast(`Pedido #${vars.id} → ${label}`, "success");
    },
    onError: () => showToast("Erro ao atualizar pedido.", "error"),
  });

  const filtered =
    tab === "todos" ? pedidos : pedidos.filter((p) => p.status === tab);

  // Stats
  const stats = {
    total: pedidos.length,
    aguardando: pedidos.filter((p) => p.status === "aguardando").length,
    em_preparo: pedidos.filter((p) => p.status === "em_preparo").length,
    concluido: pedidos.filter((p) => p.status === "concluido").length,
  };

  const StatCard = ({
    label,
    value,
    color,
  }: {
    label: string;
    value: number;
    color: string;
  }) => (
    <div
      style={{
        background: "#fff",
        border: "0.5px solid rgba(0,0,0,0.10)",
        borderRadius: 8,
        padding: "14px 18px",
        flex: 1,
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 600, color }}>{value}</div>
      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{
            fontSize: 18,
            fontWeight: 500,
            color: "#1a1a1a",
            margin: 0,
            marginBottom: 4,
          }}
        >
          Fila de Pedidos
        </h1>
        <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
          Gerencie o status dos pedidos de manipulação
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <StatCard label="Total de pedidos" value={stats.total} color="#1a3a5c" />
        <StatCard label="Aguardando" value={stats.aguardando} color="#378ADD" />
        <StatCard label="Em preparo" value={stats.em_preparo} color="#BA7517" />
        <StatCard label="Concluídos" value={stats.concluido} color="#1D9E75" />
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 16,
          background: "#eceef2",
          borderRadius: 8,
          padding: 4,
          width: "fit-content",
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: "none",
              fontSize: 12,
              fontWeight: tab === t.key ? 500 : 400,
              cursor: "pointer",
              background: tab === t.key ? "#fff" : "transparent",
              color: tab === t.key ? "#1a3a5c" : "#6b7280",
              boxShadow: tab === t.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.15s",
            }}
          >
            {t.label}
            {t.key !== "todos" && (
              <span
                style={{
                  marginLeft: 6,
                  background:
                    tab === t.key ? "#eceef2" : "rgba(0,0,0,0.07)",
                  borderRadius: 10,
                  padding: "1px 6px",
                  fontSize: 10,
                  fontWeight: 600,
                }}
              >
                {t.key === "aguardando"
                  ? stats.aguardando
                  : t.key === "em_preparo"
                  ? stats.em_preparo
                  : stats.concluido}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div
        style={{
          background: "#fff",
          border: "0.5px solid rgba(0,0,0,0.10)",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        {isLoading ? (
          <div
            style={{
              textAlign: "center",
              padding: 40,
              fontSize: 13,
              color: "#6b7280",
            }}
          >
            Carregando...
          </div>
        ) : isError ? (
          <div
            style={{
              textAlign: "center",
              padding: 40,
              fontSize: 13,
              color: "#e24b4a",
            }}
          >
            Erro ao carregar pedidos.{" "}
            <button
              onClick={() => refetch()}
              style={{
                background: "none",
                border: "none",
                color: "#378ADD",
                cursor: "pointer",
                fontSize: 13,
                textDecoration: "underline",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f4f5f7" }}>
                {["#", "Receita", "Ingredientes", "Custo", "Status", "Data", "Ações"].map((h) => (
                  <th
                    key={h}
                    style={{
                      fontSize: 11,
                      color: "#6b7280",
                      fontWeight: 500,
                      padding: "10px 14px",
                      textAlign: "left",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: 40,
                      fontSize: 13,
                      color: "#6b7280",
                    }}
                  >
                    Nenhum pedido encontrado
                  </td>
                </tr>
              ) : (
                filtered.map((pedido) => {
                  const isExpanded = expanded === pedido.id;
                  const opacity = rowOpacity[pedido.status];
                  return (
                    <>
                      <tr
                        key={pedido.id}
                        onClick={() => setExpanded(isExpanded ? null : pedido.id)}
                        style={{
                          borderBottom: "0.5px solid rgba(0,0,0,0.06)",
                          background: rowBg[pedido.status],
                          cursor: "pointer",
                          opacity,
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLTableRowElement).style.filter =
                            "brightness(0.97)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLTableRowElement).style.filter =
                            "none";
                        }}
                      >
                        <td
                          style={{
                            padding: "12px 14px",
                            fontSize: 12,
                            color: "#6b7280",
                            fontWeight: 500,
                          }}
                        >
                          #{pedido.id}
                        </td>
                        <td
                          style={{
                            padding: "12px 14px",
                            fontSize: 13,
                            fontWeight: 500,
                            color: "#1a1a1a",
                          }}
                        >
                          {pedido.receita?.nome ?? `Receita #${pedido.receita_id}`}
                        </td>
                        <td
                          style={{
                            padding: "12px 14px",
                            fontSize: 12,
                            color: "#6b7280",
                          }}
                        >
                          {pedido.receita?.itens?.length ?? "—"} ingredientes
                        </td>
                        <td
                          style={{
                            padding: "12px 14px",
                            fontSize: 13,
                            fontWeight: 500,
                            color: "#1a1a1a",
                          }}
                        >
                          R$ {pedido.custo_total.toFixed(2).replace(".", ",")}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <StatusBadge status={pedido.status} />
                        </td>
                        <td
                          style={{
                            padding: "12px 14px",
                            fontSize: 12,
                            color: "#6b7280",
                          }}
                        >
                          {new Date(pedido.criado_em).toLocaleDateString("pt-BR")}
                        </td>
                        <td
                          style={{ padding: "12px 14px" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {pedido.status === "aguardando" ? (
                            <button
                              onClick={() =>
                                updateStatus.mutate({
                                  id: pedido.id,
                                  status: "em_preparo",
                                })
                              }
                              disabled={updateStatus.isPending}
                              style={{
                                border: "0.5px solid #378ADD",
                                color: "#378ADD",
                                background: "none",
                                borderRadius: 6,
                                padding: "5px 10px",
                                fontSize: 11,
                                fontWeight: 500,
                                cursor: "pointer",
                                fontFamily: "'DM Sans', sans-serif",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Iniciar Preparo
                            </button>
                          ) : pedido.status === "em_preparo" ? (
                            <button
                              onClick={() =>
                                updateStatus.mutate({
                                  id: pedido.id,
                                  status: "concluido",
                                })
                              }
                              disabled={updateStatus.isPending}
                              style={{
                                border: "0.5px solid #1D9E75",
                                color: "#1D9E75",
                                background: "none",
                                borderRadius: 6,
                                padding: "5px 10px",
                                fontSize: 11,
                                fontWeight: 500,
                                cursor: "pointer",
                                fontFamily: "'DM Sans', sans-serif",
                              }}
                            >
                              Concluir
                            </button>
                          ) : (
                            <span
                              style={{
                                fontSize: 11,
                                color: "#9ca3af",
                                fontWeight: 500,
                              }}
                            >
                              Finalizado
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* Linha expansível */}
                      {isExpanded && pedido.receita?.itens && (
                        <tr
                          key={`${pedido.id}-expanded`}
                          style={{
                            background: "#f9fafb",
                            borderBottom: "0.5px solid rgba(0,0,0,0.06)",
                          }}
                        >
                          <td colSpan={7} style={{ padding: "0 14px 14px 38px" }}>
                            <div
                              style={{
                                fontSize: 11,
                                fontWeight: 500,
                                color: "#6b7280",
                                marginBottom: 8,
                                letterSpacing: "0.04em",
                                textTransform: "uppercase",
                                marginTop: 12,
                              }}
                            >
                              Ingredientes da receita
                            </div>
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 8,
                              }}
                            >
                              {pedido.receita.itens.map((item) => (
                                <div
                                  key={item.id}
                                  style={{
                                    background: "#fff",
                                    border: "0.5px solid rgba(0,0,0,0.10)",
                                    borderRadius: 6,
                                    padding: "6px 12px",
                                    fontSize: 12,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontWeight: 500,
                                      color: "#1a1a1a",
                                    }}
                                  >
                                    {item.nome_materia}
                                  </span>
                                  <span style={{ color: "#6b7280", marginLeft: 8 }}>
                                    {item.quantidade.toFixed(1)}g — R${" "}
                                    {(item.quantidade * item.preco_unitario)
                                      .toFixed(2)
                                      .replace(".", ",")}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
