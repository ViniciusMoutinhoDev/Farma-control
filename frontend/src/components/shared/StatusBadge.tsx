interface StatusBadgeProps {
  status: string;
}

const statusMap: Record<string, { label: string; color: string }> = {
  ok:         { label: "OK",          color: "#1D9E75" },
  baixo:      { label: "Baixo",       color: "#BA7517" },
  critico:    { label: "Crítico",     color: "#e24b4a" },
  aguardando: { label: "Aguardando",  color: "#378ADD" },
  em_preparo: { label: "Em preparo",  color: "#BA7517" },
  concluido:  { label: "Concluído",   color: "#1D9E75" },
  cancelado:  { label: "Cancelado",   color: "#e24b4a" },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const s = statusMap[status] ?? { label: status, color: "#6b7280" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 12,
        fontWeight: 500,
        color: s.color,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: s.color,
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      {s.label}
    </span>
  );
}
