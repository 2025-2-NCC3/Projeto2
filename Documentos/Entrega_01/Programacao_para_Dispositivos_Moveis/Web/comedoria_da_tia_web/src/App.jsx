// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useNotifier } from './components/Notifier/useNotifier'

// pages públicas
import Login from './pages/Login/Login'
import Signup from './pages/Signup/Signup'
import ForgotPassword from './pages/ForgotPassword/ForgotPassword'
import ResetPassword from './pages/ResetPassword/ResetPassword'

// páginas aluno / comum
import Home from './pages/Alunos/Home'
import OffersAlunos from './pages/Alunos/OffersAlunos'

// páginas admin
import ProductNew from './pages/Products/ProductNew'
import ProductsList from './pages/Products/ProductsList'
import Promotion from './pages/Products/Promotion'
import Relatorios from './pages/Relatorios/Relatorios'
import BancoDeImagens from './pages/Banco_de_Imagens/BancoDeImagens'

// layout + guards
import AppLayout from './layouts/layouts'
import RequireAuth from './Routes/RequireAuth'
import RequireAdmin from './Routes/RequireAdmin'

function App() {
  const { NotifierHost } = useNotifier()

  return (
    <Router>
      <NotifierHost />

      <Routes>
        {/* ---------- Rotas públicas (sem login) ---------- */}
        <Route path="/login" element={<Login />} />
        <Route path="/inscreva-se" element={<Signup />} />
        <Route path="/esqueceu-a-senha" element={<ForgotPassword />} />
        <Route path="/redefinir-a-senha" element={<ResetPassword />} />

        {/* ---------- Rotas protegidas (usuário logado) ---------- */}
        <Route element={<RequireAuth />}>
          {/* tudo do app interno vive sob /app */}
          <Route path="/app" element={<AppLayout />}>
            {/* /app -> redireciona pra /app/alunos/home */}
            <Route index element={<Navigate to="alunos/home" replace />} />

            {/* ----- Rotas acessíveis a QUALQUER usuário logado ----- */}
            <Route path="alunos/home" element={<Home />} />
            <Route path="alunos/ofertas" element={<OffersAlunos />} />

            {/* ----- Rotas apenas ADMIN ----- */}
            <Route element={<RequireAdmin />}>
              {/* lista de produtos */}
              <Route path="produtos" element={<ProductsList />} />

              {/* criar novo produto */}
              <Route path="produtos/novo" element={<ProductNew />} />

              {/* configura promoções */}
              <Route path="produtos/promocao" element={<Promotion />} />

              {/* relatórios internos */}
              <Route path="relatorios" element={<Relatorios />} />

              {/* banco de imagens (Pixabay + galeria interna) */}
              <Route path="banco-imagens" element={<BancoDeImagens />} />
            </Route>
          </Route>
        </Route>

        {/* ---------- default / raiz ---------- */}
        <Route path="/" element={<Navigate to="/app" replace />} />

        {/* ---------- 404 ---------- */}
        <Route
          path="*"
          element={
            <div style={{ padding: 24 }}>
              Página não encontrada
            </div>
          }
        />
      </Routes>
    </Router>
  )
}

export default App
