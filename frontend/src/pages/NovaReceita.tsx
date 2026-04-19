import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { MateriaPrima } from "../types";
import { useCartStore } from "../store/cartStore";
import StockBar from "../components/shared/StockBar";
import { useToast } from "../components/shared/Toast";

export default function NovaReceita() {
  const [busca, setBusca] = useState("");
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { showToast } = useToast();

  const { items, nomeReceita, addItem, removeItem, updateGramas, setNomeReceita, clear, totalPeso, totalCusto } =
    useCartStore();

  const { data: materias = [], isLoading } = useQuery<MateriaPrima[]>({
    queryKey: ["materias", busca],
    queryFn: async () => {
      const res = await api.get("/materias/", { params: busca ? { busca } : {} });
      return res.data;
    },
  });

  const filtered = materias.filter((m) =>
    m.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const isInCart = (id: number) => items.some((i) => i.materia.id === id);

  const canSave = items.length > 0 && nomeReceita.trim().length > 0;

  const buildPayload = () => ({
    nome: nomeReceita.trim(),
    itens: items.map((i) => ({
      materia_id: i.materia.id,
      quantidade: i.gramas,
      preco_unitario: i.materia.preco_compra,
    })),
  });

  const salvarOrcamento = useMutation({
    mutationFn: async () => {
      const res = await api.post("/receitas/", buildPayload());
      return res.data;
    },
    onSuccess: () => {
      clear();
      qc.invalidateQueries({ queryKey: ["materias"] });
      qc.invalidateQueries({ queryKey: ["receitas"] });
      showToast("Orçamento salvo!", "success");
      navigate("/orcamentos");
    },
    onError: () => showToast("Erro ao salvar orçamento.", "error"),
  });

  const criarPedido = useMutation({
    mutationFn: async () => {
      // 1. Criar receita
      const recRes = await api.post("/receitas/", buildPayload());
      const receitaId: number = recRes.data.id;

      // 2. Criar pedido
      await api.post("/pedidos/", { receita_id: receitaId });

      // 3. Descontar estoque para cada item
      for (const item of items) {
        const novaQtd = item.materia.quantidade - item.gramas;
        await api.put(`/materias/${item.materia.id}`, {
          quantidade: Math.max(0, novaQtd),
        });
      }
    },
    onSuccess: () => {
      clear();
      qc.invalidateQueries({ queryKey: ["materias"] });
      qc.invalidateQueries({ queryKey: ["pedidos"] });
      showToast("Pedido criado! Estoque atualizado.", "success");
      navigate("/pedidos");
    },
    onError: () => showToast("Erro ao criar pedido.", "error"),
  });

  const isBusy = salvarOrcamento.isPending || criarPedido.isPending;

  return (
    <div
      style={{
        padding: "24px",
        display: "flex",
        gap: 20,
        alignItems: "flex-start",
        minHeight: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* ── Coluna esquerda ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
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
            Nova Receita / Orçamento
          </h1>
          <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
            Monte a receita e salve como orçamento para o cliente aprovar
          </p>
        </div>

        {/* Busca */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#fff",
            border: "0.5px solid rgba(0,0,0,0.15)",
            borderRadius: 8,
            padding: "8px 12px",
            marginBottom: 16,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6b7280"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar matéria-prima..."
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: 13,
              background: "transparent",
              color: "#1a1a1a",
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
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
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f4f5f7" }}>
                {["Nome", "Disponível", "Preço/g", "Adicionar"].map((h) => (
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
              {isLoading ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      textAlign: "center",
                      padding: 32,
                      fontSize: 13,
                      color: "#6b7280",
                    }}
                  >
                    Carregando...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      textAlign: "center",
                      padding: 32,
                      fontSize: 13,
                      color: "#6b7280",
                    }}
                  >
                    Nenhuma matéria-prima encontrada
                  </td>
                </tr>
              ) : (
                filtered.map((m) => {
                  const inCart = isInCart(m.id);
                  return (
                    <tr
                      key={m.id}
                      style={{
                        borderBottom: "0.5px solid rgba(0,0,0,0.06)",
                        background: inCart ? "#e8f0fb" : "transparent",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        if (!inCart)
                          (e.currentTarget as HTMLTableRowElement).style.background =
                            "#f7f9fc";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.background =
                          inCart ? "#e8f0fb" : "transparent";
                      }}
                    >
                      <td style={{ padding: "11px 14px" }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: "#1a1a1a",
                          }}
                        >
                          {m.nome}
                        </div>
                        {m.fornecedor && (
                          <div style={{ fontSize: 11, color: "#6b7280" }}>
                            {m.fornecedor}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "11px 14px", minWidth: 180 }}>
                        <StockBar qty={m.quantidade} min={m.estoque_minimo} />
                      </td>
                      <td
                        style={{
                          padding: "11px 14px",
                          fontSize: 13,
                          color: "#1a1a1a",
                        }}
                      >
                        R${" "}
                        {m.preco_compra.toFixed(2).replace(".", ",")}
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        <button
                          onClick={() => !inCart && addItem(m)}
                          disabled={inCart}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            background: inCart ? "transparent" : "#1a3a5c",
                            color: inCart ? "#378ADD" : "#fff",
                            border: inCart
                              ? "0.5px solid #378ADD"
                              : "none",
                            borderRadius: 6,
                            padding: "6px 12px",
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: inCart ? "default" : "pointer",
                            opacity: inCart ? 0.7 : 1,
                            fontFamily: "'DM Sans', sans-serif",
                            transition: "all 0.15s",
                          }}
                        >
                          {inCart ? (
                            <>
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                              </svg>
                              Adicionado
                            </>
                          ) : (
                            <>
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                              </svg>
                              Adicionar
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Coluna direita — Carrinho ── */}
      <div
        style={{
          width: 320,
          flexShrink: 0,
          position: "sticky",
          top: 24,
        }}
      >
        <div
          style={{
            background: "#fff",
            border: "0.5px solid rgba(0,0,0,0.10)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {/* Header carrinho */}
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "0.5px solid rgba(0,0,0,0.08)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="#1a3a5c"
            >
              <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96C5 16.1 6.1 17.2 7.2 17.2h13v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63H19c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0023.47 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
            <span
              style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}
            >
              Carrinho da Receita
            </span>
            {items.length > 0 && (
              <span
                style={{
                  marginLeft: "auto",
                  background: "#1a3a5c",
                  color: "#fff",
                  borderRadius: "50%",
                  width: 18,
                  height: 18,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 600,
                }}
              >
                {items.length}
              </span>
            )}
          </div>

          {/* Input nome */}
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "0.5px solid rgba(0,0,0,0.08)",
            }}
          >
            <label
              style={{
                display: "block",
                fontSize: 10,
                fontWeight: 500,
                color: "#6b7280",
                marginBottom: 6,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Nome do orçamento *
            </label>
            <input
              value={nomeReceita}
              onChange={(e) => setNomeReceita(e.target.value)}
              placeholder="Ex: Hidratante Corporal FPS30"
              style={{
                width: "100%",
                border: "0.5px solid rgba(0,0,0,0.15)",
                borderRadius: 8,
                padding: "8px 10px",
                fontSize: 13,
                fontFamily: "'DM Sans', sans-serif",
                color: "#1a1a1a",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Lista de itens */}
          <div
            style={{
              minHeight: 160,
              maxHeight: 340,
              overflowY: "auto",
            }}
          >
            {items.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "36px 16px",
                  gap: 8,
                }}
              >
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#d1d5db"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#9ca3af",
                  }}
                >
                  Carrinho vazio
                </span>
                <span style={{ fontSize: 12, color: "#b8bcc4" }}>
                  Adicione ingredientes da lista
                </span>
              </div>
            ) : (
              items.map((item) => {
                const insuficiente = item.gramas > item.materia.quantidade;
                const custoItem = item.gramas * item.materia.preco_compra;
                return (
                  <div
                    key={item.materia.id}
                    style={{
                      padding: "12px 16px",
                      borderBottom: "0.5px solid rgba(0,0,0,0.06)",
                      background: insuficiente ? "#fff8f8" : "transparent",
                    }}
                  >
                    {/* Nome + remover */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: insuficiente ? "#e24b4a" : "#1a1a1a",
                          flex: 1,
                        }}
                      >
                        {item.materia.nome}
                      </span>
                      <button
                        onClick={() => removeItem(item.materia.id)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#9ca3af",
                          padding: 2,
                          lineHeight: 1,
                          display: "flex",
                        }}
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                      </button>
                    </div>

                    {/* Preço */}
                    <div
                      style={{
                        fontSize: 11,
                        color: "#6b7280",
                        marginBottom: 8,
                      }}
                    >
                      R${" "}
                      {item.materia.preco_compra.toFixed(2).replace(".", ",")}/g →{" "}
                      <strong style={{ color: "#1a1a1a" }}>
                        R$ {custoItem.toFixed(2).replace(".", ",")}
                      </strong>
                    </div>

                    {/* Controles de quantidade */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <button
                        onClick={() =>
                          updateGramas(item.materia.id, item.gramas - 0.5)
                        }
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 6,
                          border: "0.5px solid rgba(0,0,0,0.15)",
                          background: "#fff",
                          cursor: "pointer",
                          fontSize: 14,
                          color: "#1a1a1a",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        −
                      </button>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: "#1a1a1a",
                          minWidth: 42,
                          textAlign: "center",
                        }}
                      >
                        {item.gramas.toFixed(1)}g
                      </span>
                      <button
                        onClick={() =>
                          updateGramas(item.materia.id, item.gramas + 0.5)
                        }
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 6,
                          border: "0.5px solid rgba(0,0,0,0.15)",
                          background: "#fff",
                          cursor: "pointer",
                          fontSize: 14,
                          color: "#1a1a1a",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        +
                      </button>
                      {insuficiente && (
                        <span
                          style={{
                            fontSize: 10,
                            color: "#e24b4a",
                            fontWeight: 500,
                          }}
                        >
                          Estoque insuficiente
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Totais */}
          {items.length > 0 && (
            <div
              style={{
                padding: "12px 16px",
                borderTop: "0.5px solid rgba(0,0,0,0.08)",
                background: "#f9fafb",
              }}
            >
              {[
                { label: "Ingredientes", value: `${items.length}` },
                { label: "Peso total", value: `${totalPeso().toFixed(1)}g` },
                {
                  label: "Custo total",
                  value: `R$ ${totalCusto().toFixed(2).replace(".", ",")}`,
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontSize: 12, color: "#6b7280" }}>
                    {label}:
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#1a1a1a" }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Botões de ação */}
          <div
            style={{
              padding: "12px 16px",
              borderTop: "0.5px solid rgba(0,0,0,0.08)",
              display: "flex",
              gap: 8,
            }}
          >
            <button
              onClick={() => salvarOrcamento.mutate()}
              disabled={!canSave || isBusy}
              style={{
                flex: 1,
                background: canSave && !isBusy ? "#1a3a5c" : "#e5e7eb",
                color: canSave && !isBusy ? "#fff" : "#9ca3af",
                border: "none",
                borderRadius: 6,
                padding: "8px 10px",
                fontSize: 12,
                fontWeight: 500,
                cursor: canSave && !isBusy ? "pointer" : "not-allowed",
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.15s",
              }}
            >
              {salvarOrcamento.isPending ? "Salvando..." : "Salvar Orçamento"}
            </button>
            <button
              onClick={() => criarPedido.mutate()}
              disabled={!canSave || isBusy}
              style={{
                flex: 1,
                background: "none",
                color: canSave && !isBusy ? "#1D9E75" : "#9ca3af",
                border: `0.5px solid ${canSave && !isBusy ? "#1D9E75" : "#d1d5db"}`,
                borderRadius: 6,
                padding: "8px 10px",
                fontSize: 12,
                fontWeight: 500,
                cursor: canSave && !isBusy ? "pointer" : "not-allowed",
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.15s",
              }}
            >
              {criarPedido.isPending ? "Criando..." : "→ Pedido"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
