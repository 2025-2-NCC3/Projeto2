// src/layouts/AppLayout.jsx
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar/Sidebar'
import './AppLayout.css'

export default function AppLayout() {
  return (
    <div className="app-shell">
      {/* A SideBar já controla o modo drawer em telas pequenas */}
      <Sidebar />
      <main className="app-main" id="main-content" role="main">
        <Outlet /> {/* Aqui entram as páginas (Lista, Cadastrar etc.) */}
      </main>
    </div>
  )
}
