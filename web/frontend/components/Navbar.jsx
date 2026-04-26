import { Link, useLocation } from "react-router-dom";
import { Newspaper, Users, ScrollText } from "lucide-react";

export default function Navbar() {
  const { pathname } = useLocation();

  const links = [
    { to: "/", label: "Dashboard", icon: <Users size={16} /> },
    { to: "/subscribe", label: "Subscribe", icon: <Newspaper size={16} /> },
    { to: "/logs", label: "Logs", icon: <ScrollText size={16} /> },
  ];

  return (
    <nav style={styles.nav}>
      <span style={styles.brand}>📰 AI News Scraper</span>
      <div style={styles.links}>
        {links.map(({ to, label, icon }) => (
          <Link
            key={to}
            to={to}
            style={{ ...styles.link, ...(pathname === to ? styles.active : {}) }}
          >
            {icon} {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "12px 32px", background: "#0f0f0f", borderBottom: "1px solid #222",
  },
  brand: { color: "#fff", fontWeight: 700, fontSize: 18 },
  links: { display: "flex", gap: 24 },
  link: { color: "#aaa", textDecoration: "none", display: "flex",
            alignItems: "center", gap: 6, fontSize: 14 },
  active: { color: "#fff", borderBottom: "2px solid #6366f1",
            paddingBottom: 2 },
};