import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Navbar } from './components/Navbar'
import { Home } from './pages/Home'
import { PlanTrip } from './pages/PlanTrip'
import { TripResults } from './pages/TripResults'
import { PlaceDetail } from './pages/PlaceDetail'
import { MyTrips } from './pages/MyTrips'
import { Profile } from './pages/Profile'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-travel-50">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/plan" element={<PlanTrip />} />
              <Route path="/results" element={<TripResults />} />
              <Route path="/place/:placeId" element={<PlaceDetail />} />
              <Route path="/my-trips" element={<MyTrips />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
