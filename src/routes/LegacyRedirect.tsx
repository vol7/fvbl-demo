import { Navigate, useLocation } from "react-router"

/** The same path under `/ca`, for links from before the region prefix. */
export function LegacyRedirect() {
  const { pathname, search, hash } = useLocation()
  return <Navigate to={`/ca${pathname}${search}${hash}`} replace />
}
