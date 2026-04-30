// src/pages/NotFoundPage.jsx
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="text-7xl mb-4 animate-leaf-sway inline-block">🌿</div>
      <h1 className="font-display text-5xl text-forest-800 mb-2">404</h1>
      <p className="font-display text-xl text-gray-600 mb-1">Page Not Found</p>
      <p className="font-body text-sm text-gray-400 max-w-sm mb-8">
        Looks like this leaf blew away. The page you're looking for doesn't exist.
      </p>
      <Link to="/" className="btn-primary">
        <span>🏠</span> Back to Home
      </Link>
    </div>
  )
}
