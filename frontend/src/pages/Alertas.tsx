import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { MateriaPrima } from "../types";
import StockBar from "../components/shared/StockBar";
import StatusBadge from "../components/shared/StatusBadge";

function AlertIcon({ color }: { color: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, marginTop: 2 }}
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function BellIcon({ color }: { color: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, marginTop: 2 }}
    >
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

interface AlertCardProps {
  materia: MateriaPrima;
  nivel: "critico" | "baixo";
}

function AlertCard({ materia, nivel }: AlertCardProps) {
  const isCritico = nivel === "critico";
  const cardBg = isCritico ? "#fff5f5" : "#fffbf0";
  const borderColor = isCritico
    ? "rgba(226,75,74,0.18)"
    : "rgba(186,117,23,0.18)";
  const iconColor = isCritico ? "#e24b4a" : "#BA7517";
  const deficit = Math.max(0, materia.estoque_minimo - materia.quantidade);

  return (
    <div
      style={{
        background: cardBg,
        border: `0.5px solid ${borderColor}`,
        borderRadius: 8,
        padding: "14px 16px",
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
      }}
    >
      {/* Ícone */}
      <div>
        {isCritico ? (
          <AlertIcon color={iconColor} />
        ) : (
          <BellIcon color={iconColor} />
        )}
      </div>

      {/* Conteúdo */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 4,
          }}
        >
          <div>
            <div
              style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}
            >
              {materia.nome}
            </div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
              Atual:{" "}
              <strong style={{ color: iconColor }}>
                {materia.quantidade.toFixed(1)}g
              </strong>{" "}
              — Mínimo: {materia.estoque_minimo}g — Déficit:{" "}
              <strong style={{ color: iconColor }}>{deficit.toFixed(1)}g</strong>
            </div>
          </div>
          <StatusBadge status={nivel} />
        </div>

        <div style={{ marginTop: 10 }}>
          <StockBar qty={materia.quantidade} min={materia.estoque_minimo} />
        </div>
      </div>
    </div>
  );
}

export default function Alertas() {
  const {
    data: materias = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<MateriaPrima[]>({
    queryKey: ["materias", "alertas"],
    queryFn: async () => {
      const res = await api.get("/materias/", { params: { alerta: true } });
      return res.data;
    },
  });

  const criticos = materias.filter(
    (m) => m.quantidade <= m.estoque_minimo * 0.3
  );
  const baixos = materias.filter(
    (m) =>
      m.quantidade > m.estoque_minimo * 0.3 && m.quantidade <= m.estoque_minimo
  );

  const SectionHeader = ({
    label,
    count,
    color,
  }: {
    label: string;
    count: number;
    color: string;
  }) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: color,
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 11,
          color: "#6b7280",
          fontWeight: 400,
        }}
      >
        ({count} {count === 1 ? "item" : "itens"})
      </span>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 18,
            fontWeight: 500,
            color: "#1a1a1a",
            margin: 0,
            marginBottom: 4,
          }}
        >
          Alertas de Estoque Mínimo
        </h1>
        <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
          Matérias-primas que estão abaixo do nível mínimo
        </p>
      </div>

      {isLoading ? (
        <div
          style={{
            textAlign: "center",
            padding: 60,
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
            padding: 60,
            fontSize: 13,
            color: "#e24b4a",
          }}
        >
          Erro ao carregar alertas.{" "}
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
      ) : materias.length === 0 ? (
        /* Estado vazio */
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 24px",
            gap: 16,
          }}
        >
          <svg
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1D9E75"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="9 12 11.5 14.5 15 10" />
          </svg>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: "#1D9E75",
                marginBottom: 6,
              }}
            >
              Tudo certo!
            </div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Todos os estoques estão acima do mínimo.
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {/* Seção Crítico */}
          {criticos.length > 0 && (
            <section>
              <SectionHeader
                label="Crítico"
                count={criticos.length}
                color="#e24b4a"
              />
              <div
                style={{
                  display: "grid",
                  gap: 10,
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(340px, 1fr))",
                }}
              >
                {criticos.map((m) => (
                  <AlertCard key={m.id} materia={m} nivel="critico" />
                ))}
              </div>
            </section>
          )}

          {/* Seção Baixo */}
          {baixos.length > 0 && (
            <section>
              <SectionHeader
                label="Baixo"
                count={baixos.length}
                color="#BA7517"
              />
              <div
                style={{
                  display: "grid",
                  gap: 10,
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(340px, 1fr))",
                }}
              >
                {baixos.map((m) => (
                  <AlertCard key={m.id} materia={m} nivel="baixo" />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
