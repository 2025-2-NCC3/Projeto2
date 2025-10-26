"use client"

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const vendasDiarias = [
  { dia: "Seg", vendas: 4200 },
  { dia: "Ter", vendas: 3800 },
  { dia: "Qua", vendas: 5100 },
  { dia: "Qui", vendas: 4900 },
  { dia: "Sex", vendas: 6200 },
]

const produtosMaisVendidos = [
  { produto: "Café", quantidade: 320 },
  { produto: "Salgados", quantidade: 280 },
  { produto: "Refrigerante", quantidade: 250 },
  { produto: "Sanduíche", quantidade: 180 },
]

const horariosPico = [
  { horario: "8h", clientes: 120 },
  { horario: "10h", clientes: 95 },
  { horario: "12h", clientes: 280 },
  { horario: "14h", clientes: 180 },
  { horario: "16h", clientes: 130 },
]

const categorias = [
  { nome: "Bebidas", valor: 35, cor: "#22c55e" },
  { nome: "Salgados", valor: 28, cor: "#84cc16" },
  { nome: "Doces", valor: 15, cor: "#10b981" },
  { nome: "Refeições", valor: 22, cor: "#14b8a6" },
]

const Card = ({ children }) => (
  <div
    className="rounded-lg p-6"
    style={{
      backgroundColor: "rgba(17, 24, 39, 0.85)",
      border: "1px solid rgba(255,255,255,0.1)",
    }}
  >
    {children}
  </div>
)

export default function DashboardCantina() {
  return (
    <div
      className="min-h-screen p-6"
      style={{
        background: "linear-gradient(135deg, #111827, #059669, #10b981)",
      }}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Dashboard Cantina</h1>
          <p className="text-gray-300">Métricas e vendas</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <h3 className="text-sm text-gray-400">Receita Total</h3>
            <div className="mt-2 text-2xl font-bold text-gray-100">R$ 28.100</div>
            <p className="mt-1 text-sm text-emerald-400">+12.5%</p>
          </Card>

          <Card>
            <h3 className="text-sm text-gray-400">Transações</h3>
            <div className="mt-2 text-2xl font-bold text-gray-100">967</div>
            <p className="mt-1 text-sm text-emerald-400">+8.2%</p>
          </Card>

          <Card>
            <h3 className="text-sm text-gray-400">Ticket Médio</h3>
            <div className="mt-2 text-2xl font-bold text-gray-100">R$ 29,06</div>
            <p className="mt-1 text-sm text-emerald-400">+3.8%</p>
          </Card>

          <Card>
            <h3 className="text-sm text-gray-400">Clientes</h3>
            <div className="mt-2 text-2xl font-bold text-gray-100">1.890</div>
            <p className="mt-1 text-sm text-emerald-400">+15.3%</p>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <h3 className="mb-4 text-lg font-semibold text-gray-100">Vendas Diárias</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={vendasDiarias}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="dia" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                    color: "#e5e7eb",
                  }}
                />
                <Area type="monotone" dataKey="vendas" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 className="mb-4 text-lg font-semibold text-gray-100">Horários de Pico</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={horariosPico}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="horario" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                    color: "#e5e7eb",
                  }}
                />
                <Line type="monotone" dataKey="clientes" stroke="#22c55e" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <h3 className="mb-4 text-lg font-semibold text-gray-100">Produtos Mais Vendidos</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={produtosMaisVendidos} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" stroke="#9ca3af" />
                <YAxis dataKey="produto" type="category" stroke="#9ca3af" width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                    color: "#e5e7eb",
                  }}
                />
                <Bar dataKey="quantidade" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 className="mb-4 text-lg font-semibold text-gray-100">Distribuição por Categoria</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categorias}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ nome, valor }) => `${nome}: ${valor}%`}
                  outerRadius={100}
                  dataKey="valor"
                >
                  {categorias.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.cor} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                    color: "#e5e7eb",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </div>
  )
}