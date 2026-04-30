import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-sage-950 text-sage-400 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-14">
        
        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* 1. Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-forest-600 rounded-xl flex items-center justify-center shadow-md">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 22V12M12 12C12 7 7 3 2 3C2 8 5 12 12 12ZM12 12C12 7 17 3 22 3C22 8 19 12 12 12Z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-bold text-xl text-white tracking-wide">
                Hybrid<span className="text-forest-400">Flora</span>
              </span>
            </div>

            <p className="text-sm text-sage-400 leading-relaxed">
              Intelligent plant hybridization platform using machine learning 
              to predict optimal crop combinations and improve agricultural outcomes.
            </p>
          </div>

          {/* 2. Navigation */}
          <div>
            <h4 className="text-white font-semibold text-s uppercase tracking-wider mb-4">
              Navigation
            </h4>
            <ul className="space-y-2">
              {[
                ['/', 'Home'],
                ['/predict', 'Hybrid Prediction'],
                ['/history', 'Prediction History']
              ].map(([to, label]) => (
                <li key={to}>
                  <Link 
                    to={to} 
                    className="text-sm hover:text-forest-400 transition-all duration-200"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Features */}
          <div>
            <h4 className="text-white font-semibold text-s uppercase tracking-wider mb-4">
              Features
            </h4>
            <ul className="space-y-2 text-sm text-sage-400">
              <li>AI-based Hybrid Prediction</li>
              <li>Trait Analysis Engine</li>
              <li>Prediction History Tracking</li>
              <li>Fast & Accurate Results</li>
            </ul>
          </div>

          {/* 4. Technology */}
          <div>
            <h4 className="text-white font-semibold text-s uppercase tracking-wider mb-4">
              Technology
            </h4>
            <ul className="space-y-2 text-sm text-sage-400">
              <li>Machine Learning Models</li>
              <li>Random Forest Algorithms</li>
              <li>React + Tailwind UI</li>
              <li>REST API Integration</li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-sage-800 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          
          <p className="text-xs text-sage-300 text-center sm:text-left">
            © {new Date().getFullYear()} HybridFlora AI. All rights reserved.
          </p>

          <p className="text-xs text-sage-300 text-center sm:text-right">
            Empowering Smart Agriculture with AI
          </p>

        </div>

      </div>
    </footer>
  )
}
      