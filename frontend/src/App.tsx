import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Estoque from './pages/Estoque'
import NovaReceita from './pages/NovaReceita'
import Pedidos from './pages/Pedidos'
import Alertas from './pages/Alertas'
import Orcamentos from './pages/Orcamentos'
import Afericao from './pages/Afericao'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/"            element={<Navigate to="/estoque" />} />
        <Route path="/estoque"     element={<Estoque />} />
        <Route path="/receita"     element={<NovaReceita />} />
        <Route path="/orcamentos"  element={<Orcamentos />} />
        <Route path="/pedidos"     element={<Pedidos />} />
        <Route path="/afericao"    element={<Afericao />} />
        <Route path="/alertas"     element={<Alertas />} />
      </Routes>
    </Layout>
  )
}
