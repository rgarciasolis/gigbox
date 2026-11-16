import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import PlusGate from './components/PlusGate'
import AgendaPage from './pages/AgendaPage'
import FriendsPage from './pages/FriendsPage'
import GigDetailPage from './pages/GigDetailPage'
import GigsPage from './pages/GigsPage'
import GigslistPage from './pages/GigslistPage'
import HomePage from './pages/HomePage'
import ImportPage from './pages/ImportPage'
import MyGigsPage from './pages/MyGigsPage'
import ProfileHomePage from './pages/ProfileHomePage'
import ProfileLayout from './pages/ProfileLayout'
import ProfilePage from './pages/ProfilePage'
import SubscriptionPage from './pages/SubscriptionPage'
import ReviewsPage from './pages/ReviewsPage'
import TagsPage from './pages/TagsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="perfil" element={<ProfileLayout />}>
          <Route index element={<ProfileHomePage />} />
          <Route path="gigs" element={<MyGigsPage />} />
          <Route path="tags" element={<TagsPage />} />
          <Route path="friends" element={<FriendsPage />} />
          <Route path="gigslists" element={<GigslistPage />} />
        </Route>
        <Route path="u/:userId" element={<ProfilePage />} />
        <Route path="gigs" element={<GigsPage />} />
        <Route path="gigs/:gigId" element={<GigDetailPage />} />
        <Route path="agenda" element={<PlusGate flag="agenda" title="Agenda"><AgendaPage /></PlusGate>} />
        <Route path="import" element={<PlusGate flag="bulkImport" title="Importación masiva"><ImportPage /></PlusGate>} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="gigslist" element={<Navigate to="/perfil/gigslists" replace />} />
        <Route path="tags" element={<Navigate to="/perfil/tags" replace />} />
        <Route path="friends" element={<Navigate to="/perfil/friends" replace />} />
        <Route path="subscription" element={<Navigate to="/suscripcion" replace />} />
        <Route path="suscripcion" element={<SubscriptionPage />} />
        <Route path="*" element={<p className="muted">Página no encontrada.</p>} />
      </Route>
    </Routes>
  )
}
