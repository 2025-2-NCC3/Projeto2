// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useNotifier } from './components/Notifier/useNotifier'
import { CartProvider } from './context/CartContext'

// Pages
import Login from './pages/Login/Login'
import Signup from './pages/Signup/Signup'
import SignupCallback from './pages/Auth/SignupCallBack'
import ForgotPassword from './pages/ForgotPassword/ForgotPassword'
import ResetPassword from './pages/ResetPassword/ResetPassword'
import Home from './pages/Alunos/Home'
import OffersAlunos from './pages/Alunos/OffersAlunos'
import Cart from './pages/Alunos/Cart'
import ProductNew from './pages/Products/ProductNew'
import ProductsList from './pages/Products/ProductsList'
import Promotion from './pages/Products/Promotion'
import Relatorios from './pages/Relatorios/Relatorios'
import BancoDeImagens from './pages/Banco_de_Imagens/BancoDeImagens'
import Pedidos from './pages/Pedidos/Pedidos'
import UsersOrders from './pages/Alunos/UsersOrders'
import Caixa from './pages/Caixa/Caixa'
import Settings from './pages/Configuracoes/Settings'

// Layout & Guards
import AppLayout from './layouts/layouts'
import RequireAuth from './Routes/RequireAuth'
import RequireAdmin from './Routes/RequireAdmin'

function App() {
  const { NotifierHost } = useNotifier()

  return (
    <CartProvider>
      <Router>
        <NotifierHost />
        <Routes>
          {/* Auth públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/inscreva-se" element={<Signup />} />
          {/* Callback de confirmação de cadastro / e-mail */}
          <Route path="/signup/callback" element={<SignupCallback />} />
          <Route path="/esqueceu-a-senha" element={<ForgotPassword />} />
          <Route path="/redefinir-a-senha" element={<ResetPassword />} />

          {/* Área autenticada */}
          <Route element={<RequireAuth />}>
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Navigate to="alunos/home" replace />} />

              {/* Rotas dos alunos */}
              <Route path="alunos/home" element={<Home />} />
              <Route path="alunos/ofertas" element={<OffersAlunos />} />
              <Route path="alunos/carrinho" element={<Cart />} />
              <Route path="alunos/pedidos" element={<UsersOrders />} />

              {/* Rotas administrativas */}
              <Route element={<RequireAdmin />}>
                <Route path="produtos" element={<ProductsList />} />
                <Route path="produtos/novo" element={<ProductNew />} />
                <Route path="produtos/promocao" element={<Promotion />} />
                <Route path="relatorios" element={<Relatorios />} />
                <Route path="banco-imagens" element={<BancoDeImagens />} />
                <Route path="pedidos" element={<Pedidos />} />
                <Route path="caixa" element={<Caixa />} />
                <Route path="config" element={<Settings />} />
              </Route>
            </Route>
          </Route>

          {/* Redirecionar raiz para /app */}
          <Route path="/" element={<Navigate to="/app" replace />} />

          {/* 404 */}
          <Route
            path="*"
            element={<div style={{ padding: 24 }}>Página não encontrada</div>}
          />
        </Routes>
      </Router>
    </CartProvider>
  )
}

export default App
