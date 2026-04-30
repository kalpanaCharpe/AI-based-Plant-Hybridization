import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/predict', label: 'Predict' },
    { to: '/history', label: 'History' },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-sage-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-forest-600 rounded-xl flex items-center justify-center shadow-md group-hover:bg-forest-700 transition-colors duration-200">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 22V12M12 12C12 7 7 3 2 3C2 8 5 12 12 12ZM12 12C12 7 17 3 22 3C22 8 19 12 12 12Z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-display font-bold text-2xl text-sage-900 tracking-tight">
              Hybrid<span className="text-forest-600">Flora</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-s font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-forest-50 text-forest-700 font-semibold'
                      : 'text-sage-600 hover:text-sage-900 hover:bg-sage-50'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <Link to="/predict" className="ml-3 btn-primary text-s py-2 px-5">
              Start Prediction
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-sage-600 hover:bg-sage-100 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 animate-slide-up">
            <div className="flex flex-col gap-1 pt-2 border-t border-sage-100">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-150 ${
                      isActive
                        ? 'bg-forest-50 text-forest-700 font-semibold'
                        : 'text-sage-600 hover:bg-sage-50'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <Link
                to="/predict"
                onClick={() => setMenuOpen(false)}
                className="btn-primary text-sm text-center mt-2"
              >
                Start Prediction
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
