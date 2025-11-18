// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Helmet, HelmetProvider } from 'react-helmet-async'
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

const APP_NAME = 'Comedoria da Tia'
const APP_BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://comedoria-da-tia-web.vercel.app/'

// Componente responsável por definir SEO dinamicamente por rota
function RouteSEO() {
  const location = useLocation()
  const { pathname } = location

  // defaults
  let title = `${APP_NAME} — Painel`
  let description =
    'Sistema de pedidos online da Comedoria da Tia. Faça pedidos, acompanhe promoções e gerencie o cardápio de forma simples e rápida.'
  let canonical = `${APP_BASE_URL}${pathname}`

  if (pathname === '/login') {
    title = `Login — ${APP_NAME}`
    description =
      'Acesse o painel da Comedoria da Tia para fazer pedidos, acompanhar seus pedidos e gerenciar produtos.'
  } else if (pathname === '/inscreva-se') {
    title = `Criar conta — ${APP_NAME}`
    description =
      'Crie sua conta na Comedoria da Tia e comece a fazer seus pedidos de forma rápida e prática.'
  } else if (pathname === '/signup/callback') {
    title = `Confirmação de cadastro — ${APP_NAME}`
    description =
      'Confirmação de cadastro e validação de e-mail para acesso ao painel da Comedoria da Tia.'
  } else if (pathname === '/esqueceu-a-senha') {
    title = `Recuperar senha — ${APP_NAME}`
    description =
      'Recupere o acesso à sua conta na Comedoria da Tia e continue fazendo seus pedidos normalmente.'
  } else if (pathname === '/redefinir-a-senha') {
    title = `Redefinir senha — ${APP_NAME}`
    description = 'Defina uma nova senha para sua conta na Comedoria da Tia com segurança.'
  } else if (pathname.startsWith('/app/alunos/home')) {
    title = `Cardápio & Destaques — ${APP_NAME}`
    description =
      'Veja os destaques do dia, novidades e opções disponíveis para alunos na Comedoria da Tia.'
  } else if (pathname.startsWith('/app/alunos/ofertas')) {
    title = `Ofertas & Promoções — ${APP_NAME}`
    description =
      'Aproveite as melhores ofertas e promoções da Comedoria da Tia, exclusivas para alunos.'
  } else if (pathname.startsWith('/app/alunos/carrinho')) {
    title = `Carrinho de compras — ${APP_NAME}`
    description =
      'Revise seus itens, ajuste quantidades e finalize o pedido na Comedoria da Tia com PIX e outras formas de pagamento.'
  } else if (pathname.startsWith('/app/alunos/pedidos')) {
    title = `Meus pedidos — ${APP_NAME}`
    description =
      'Acompanhe o status dos seus pedidos, histórico de compras e detalhes de cada pedido na Comedoria da Tia.'
  } else if (pathname.startsWith('/app/produtos/novo')) {
    title = `Cadastrar novo produto — ${APP_NAME}`
    description =
      'Cadastre novos produtos, lanches e bebidas no sistema da Comedoria da Tia de forma simples.'
  } else if (pathname.startsWith('/app/produtos/promocao')) {
    title = `Gerenciar promoções — ${APP_NAME}`
    description =
      'Configure e gerencie promoções especiais e descontos no cardápio da Comedoria da Tia.'
  } else if (pathname.startsWith('/app/produtos')) {
    title = `Lista de produtos — ${APP_NAME}`
    description =
      'Gerencie o catálogo completo de produtos da Comedoria da Tia: edição, preços, estoque e visibilidade.'
  } else if (pathname.startsWith('/app/relatorios')) {
    title = `Relatórios & desempenho — ${APP_NAME}`
    description =
      'Visualize relatórios de vendas, produtos mais pedidos e outros indicadores da Comedoria da Tia.'
  } else if (pathname.startsWith('/app/banco-imagens')) {
    title = `Banco de imagens — ${APP_NAME}`
    description =
      'Gerencie o banco de imagens dos produtos, banners e materiais visuais da Comedoria da Tia.'
  } else if (pathname.startsWith('/app/pedidos')) {
    title = `Gestão de pedidos — ${APP_NAME}`
    description =
      'Acompanhe e gerencie todos os pedidos em tempo real: produção, entrega e finalização na Comedoria da Tia.'
  } else if (pathname.startsWith('/app/caixa')) {
    title = `Caixa & pagamentos — ${APP_NAME}`
    description =
      'Controle financeiro, fechamento de caixa e visão geral de pagamentos realizados na Comedoria da Tia.'
  } else if (pathname.startsWith('/app/config')) {
    title = `Configurações do sistema — ${APP_NAME}`
    description =
      'Ajuste preferências, configurações gerais e opções administrativas da Comedoria da Tia.'
  } else if (pathname === '/' || pathname === '/app') {
    title = `${APP_NAME} — Painel de pedidos`
    description =
      'Painel principal da Comedoria da Tia: faça login, veja o cardápio, promoções e gerencie pedidos e produtos.'
  }

  return (
    <Helmet>
      {/* Título e descrição padrão/dinâmica */}
      <title>{title}</title>
      <meta name="description" content={description} />

      {/* SEO básico */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="robots" content="index,follow" />
      <meta name="theme-color" content="#0f172a" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content={APP_NAME} />

      {/* Se tiver uma imagem padrão do projeto, troque a URL abaixo */}
      {/* <meta property="og:image" content={`${APP_BASE_URL}/og-image.png`} /> */}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {/* <meta name="twitter:image" content={`${APP_BASE_URL}/og-image.png`} /> */}

      {/* Canonical */}
      <link rel="canonical" href={canonical} />
    </Helmet>
  )
}

function App() {
  const { NotifierHost } = useNotifier()

  return (
    <HelmetProvider>
      <CartProvider>
        <Router>
          <NotifierHost />
          {/* SEO dinâmico por rota */}
          <RouteSEO />

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
    </HelmetProvider>
  )
}

export default App
