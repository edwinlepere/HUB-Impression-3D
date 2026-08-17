import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Filaments from './pages/Filaments'
import Couleurs from './pages/Couleurs'
import Imprimantes from './pages/Imprimantes'
import Plateaux from './pages/Plateaux'
import Profils from './pages/Profils'
import Calculateur from './pages/Calculateur'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/"              element={<Dashboard />} />
        <Route path="/filaments"     element={<Filaments />} />
        <Route path="/couleurs"      element={<Couleurs />} />
        <Route path="/imprimantes"   element={<Imprimantes />} />
        <Route path="/plateaux"      element={<Plateaux />} />
        <Route path="/profils"       element={<Profils />} />
        <Route path="/calculateur"   element={<Calculateur />} />
        <Route path="*"              element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  )
}
