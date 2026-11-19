import { Link, Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Home } from '@/screens/Home'
import { Conciertos } from '@/screens/Conciertos'
import { Ficha } from '@/screens/Ficha'
import { Sala } from '@/screens/Sala'
import { Wishlist } from '@/screens/Wishlist'
import { Avisos } from '@/screens/Avisos'
import { PerfilLayout } from '@/screens/perfil/PerfilLayout'
import { PerfilResumen } from '@/screens/perfil/PerfilResumen'
import { Historico } from '@/screens/perfil/Historico'
import { Resenas } from '@/screens/perfil/Resenas'
import { Listas } from '@/screens/perfil/Listas'
import { Tags } from '@/screens/perfil/Tags'
import { Estadisticas } from '@/screens/perfil/Estadisticas'
import { Siguiendo, Seguidores } from '@/screens/perfil/Personas'
import { Artistas } from '@/screens/perfil/Artistas'
import { Ajustes } from '@/screens/perfil/Ajustes'
import { Suscripcion } from '@/screens/perfil/Suscripcion'
import { ListaDetalle } from '@/screens/ListaDetalle'
import { PerfilPublico } from '@/screens/PerfilPublico'
import { BuscarPersonas } from '@/screens/BuscarPersonas'

function NotFound() {
  return (
    <div>
      <h1>Página no encontrada</h1>
      <Link to="/">Volver al Home</Link>
    </div>
  )
}

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="conciertos" element={<Conciertos />} />
        <Route path="conciertos/:id" element={<Ficha />} />
        <Route path="salas/:id" element={<Sala />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="avisos" element={<Avisos />} />
        <Route path="listas/:id" element={<ListaDetalle />} />
        <Route path="u/:id" element={<PerfilPublico />} />
        <Route path="personas" element={<BuscarPersonas />} />
        <Route path="perfil" element={<PerfilLayout />}>
          <Route index element={<PerfilResumen />} />
          <Route path="historico" element={<Historico />} />
          <Route path="resenas" element={<Resenas />} />
          <Route path="listas" element={<Listas />} />
          <Route path="tags" element={<Tags />} />
          <Route path="estadisticas" element={<Estadisticas />} />
          <Route path="siguiendo" element={<Siguiendo />} />
          <Route path="seguidores" element={<Seguidores />} />
          <Route path="artistas" element={<Artistas />} />
          <Route path="ajustes" element={<Ajustes />} />
          <Route path="ajustes/suscripcion" element={<Suscripcion />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
