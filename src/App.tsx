import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import PlusGate from './components/PlusGate'
import AgendaPage from './pages/AgendaPage'
import FriendsPage from './pages/FriendsPage'
import GigDetailPage from './pages/GigDetailPage'
import GigsPage from './pages/GigsPage'
import GigslistPage from './pages/GigslistPage'
import ImportPage from './pages/ImportPage'
import ProfilePage from './pages/ProfilePage'
import ReviewsPage from './pages/ReviewsPage'
import SubscriptionPage from './pages/SubscriptionPage'
import TagsPage from './pages/TagsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<ProfilePage />} />
        <Route path="u/:userId" element={<ProfilePage />} />
        <Route path="gigs" element={<GigsPage />} />
        <Route path="gigs/:gigId" element={<GigDetailPage />} />
        <Route path="gigslist" element={<GigslistPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="tags" element={<TagsPage />} />
        <Route path="friends" element={<FriendsPage />} />
        <Route path="agenda" element={<PlusGate flag="agenda" title="Agenda"><AgendaPage /></PlusGate>} />
        <Route path="import" element={<PlusGate flag="bulkImport" title="Importación masiva"><ImportPage /></PlusGate>} />
        <Route path="subscription" element={<SubscriptionPage />} />
        <Route path="*" element={<p className="muted">Página no encontrada.</p>} />
      </Route>
    </Routes>
  )
}
