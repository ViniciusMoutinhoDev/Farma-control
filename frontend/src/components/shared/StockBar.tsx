interface StockBarProps {
  qty: number;
  min: number;
}

export default function StockBar({ qty, min }: StockBarProps) {
  const pct = Math.min(100, (qty / Math.max(min * 3, 1)) * 100);
  const color =
    qty <= min * 0.3 ? "#e24b4a" : qty <= min ? "#BA7517" : "#1D9E75";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          flex: 1,
          height: 4,
          borderRadius: 2,
          background: "#eceef2",
          minWidth: 60,
        }}
      >
        <div
          style={{
            width: `${pct.toFixed(0)}%`,
            height: 4,
            borderRadius: 2,
            background: color,
            transition: "width 0.3s ease",
          }}
        />
      </div>
      <span style={{ fontSize: 11, color: "#6b7280", minWidth: 80, whiteSpace: "nowrap" }}>
        {qty.toFixed(1)}g / mín {min}g
      </span>
    </div>
  );
}
