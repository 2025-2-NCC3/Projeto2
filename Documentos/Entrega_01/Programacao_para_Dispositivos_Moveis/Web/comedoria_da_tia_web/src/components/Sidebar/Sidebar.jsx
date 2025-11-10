import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom"; // 👈 add useNavigate
import {
  ChefHat,
  Home,
  Package,
  PlusCircle,
  Percent,
  BarChart3,
  Settings,
  LogOut,
  BanknoteArrowDown,
  ChevronLeft,
  ChevronRight,
  Images,
  ListOrdered,
} from "lucide-react";
import "./Sidebar.css";
import supabase from "../../lib/supabaseClient";

const LS_KEY = "sidebar_collapsed";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate(); // 👈 precisa disso para redirecionar

  // carrega estado inicial do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved != null) setCollapsed(saved === "1");
    } catch {
      /* noop */
    }
  }, []);

  // logout + redirect
  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("logout error", err);
    } finally {
      navigate("/login", { replace: true });
    }
  }

  // persiste quando mudar
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, collapsed ? "1" : "0");
    } catch {
      /* noop */
    }
  }, [collapsed]);

  return (
    <aside className={`sidebar ${collapsed ? "is-collapsed" : ""}`}>
      {/* topo / logo */}
      <div className="sb-header">
        <div className="sb-brand">
          <div className="sb-logo" aria-hidden>
            <ChefHat size={22} />
          </div>
          {!collapsed && <span className="sb-title">Comedoria da Tia</span>}
        </div>

        <button
          className="sb-collapse"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          aria-expanded={!collapsed}
          title={collapsed ? "Expandir" : "Recolher"}
          type="button"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* navegação */}
      <nav className="sb-nav">
        <Section label="Geral" collapsed={collapsed} />
        <SbLink
          to="/app"
          icon={<Home size={18} />}
          label="Inicio"
          collapsed={collapsed}
        />

        <Section label="Produtos" collapsed={collapsed} />
        <SbLink
          to="/app/produtos"
          icon={<Package size={18} />}
          label="Lista"
          collapsed={collapsed}
        />
        <SbLink
          to="/app/produtos/novo"
          icon={<PlusCircle size={18} />}
          label="Cadastrar"
          collapsed={collapsed}
        />
        {/* deixa desabilitado até existir a página */}
        <SbLink
          to="produtos/promocao"
          icon={<Percent size={18} />}
          label="Promoções"
          collapsed={collapsed}
        />
        <SbLink 
          to="/app/pedidos"
          icon={<ListOrdered size={18} />}
          label="Pedidos"
          collapsed={collapsed}
        />

        <Section label="Vendas" collapsed={collapsed} />
        <SbLink
          to="/app/relatorios"
          icon={<BarChart3 size={18} />}
          label="Relatórios"
          collapsed={collapsed}
        />

      <Section label="Banco de Imagens" collapsed={collapsed} />
        <SbLink
          to="/app/banco-imagens"
          icon={<Images size={18} />}
          label="Banco de Imagens"
          collapsed={collapsed}
        />


      <Section label="Caixa / Financeiro" collapsed={collapsed} />
        <SbLink
          to="/app/caixa"
          icon={<BanknoteArrowDown size={18} />}
          label="Caixa"
          collapsed={collapsed}
        />

        <Section label="Sistema" collapsed={collapsed} />
        <SbLink
          to="/app/config"
          icon={<Settings size={18} />}
          label="Configurações"
          collapsed={collapsed}
        />

        <div className="sb-spacer" />

        <button
          className="sb-logout"
          title="Sair"
          type="button"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          {!collapsed && <span>Sair</span>}
        </button>
      </nav>
    </aside>
  );
}

function Section({ label, collapsed }) {
  if (collapsed) return null;
  return <div className="sb-section">{label}</div>;
}

function SbLink({ to, icon, label, collapsed, disabled = false }) {
  if (disabled) {
    return (
      <div
        className="sb-link is-disabled"
        title={`${label} (em breve)`}
        role="link"
        aria-disabled="true"
      >
        <span className="sb-icon">{icon}</span>
        {!collapsed && <span className="sb-label">{label}</span>}
      </div>
    );
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) => `sb-link ${isActive ? "is-active" : ""}`}
      title={collapsed ? label : undefined}
      end
    >
      <span className="sb-icon">{icon}</span>
      {!collapsed && <span className="sb-label">{label}</span>}
    </NavLink>
  );
}
