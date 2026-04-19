import { NavLink } from "react-router-dom";
import { ToastProvider } from "../shared/Toast";

const navItems = [
  { to: "/estoque",    label: "Estoque",      icon: "M20 6h-2.18c.07-.44.18-.89.18-1A3 3 0 0015 2a3 3 0 00-3 3c0 .11.11.56.18 1H10A2 2 0 008 8v12a2 2 0 002 2h10a2 2 0 002-2V8a2 2 0 00-2-2z" },
  { to: "/receita",   label: "Nova Receita",  icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z" },
  { to: "/orcamentos",label: "Orçamentos",    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  { to: "/pedidos",   label: "Pedidos",       icon: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" },
  { to: "/afericao",  label: "Balança",       icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" },
  { to: "/alertas",   label: "Alertas",       icon: "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      <aside style={{ width: 200, background: "#1a3a5c", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ width: 28, height: 28, background: "#378ADD", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z"/></svg>
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#fff" }}>FarmaControl</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>Vila Mariana</div>
        </div>

        <nav style={{ padding: "12px 0", flex: 1 }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", padding: "0 16px", marginBottom: 4, textTransform: "uppercase" }}>Principal</div>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to}
              style={({ isActive }) => ({
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 16px", fontSize: 12, textDecoration: "none",
                color: isActive ? "#fff" : "rgba(255,255,255,0.65)",
                background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                borderLeft: isActive ? "3px solid #378ADD" : "3px solid transparent",
              })}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d={item.icon}/></svg>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
          v1.0.0 — Python 3.13
        </div>
      </aside>

      <main style={{ flex: 1, overflow: "auto", background: "#f4f5f7" }}>
        {children}
      </main>

      <ToastProvider />
    </div>
  );
}