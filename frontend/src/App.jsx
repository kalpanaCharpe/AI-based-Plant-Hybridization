// App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ScrollToTop from './ScrollToTop'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import PredictPage from './pages/PredictPage'
import ResultPage from './pages/ResultPage'
import HistoryPage from './pages/HistoryPage'
import NotFoundPage from './pages/NotFoundPage'

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Navbar />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Layout>
        <ScrollToTop/>
        <Routes>
          <Route path="/"        element={<HomePage />} />
          <Route path="/predict" element={<PredictPage />} />
          <Route path="/result"  element={<ResultPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="*"        element={<NotFoundPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
