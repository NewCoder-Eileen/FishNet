import { Navigate, useLocation } from 'react-router-dom'
import { isLoggedIn } from '../lib/auth'

export default function RequireAuth({ children }) {
  const location = useLocation()
  if (!isLoggedIn()) {
    return <Navigate to="/login" state={{ next: location.pathname }} replace />
  }
  return children
}