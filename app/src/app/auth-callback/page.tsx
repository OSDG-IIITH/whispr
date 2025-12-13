/**
 * /auth-callback page
 * 
 * This page handles the redirect from Alt Auth.
 * It redirects to our API callback endpoint with the same query params.
 */

import { redirect } from 'next/navigation'

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  
  // Build query string from search params
  const queryString = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      queryString.set(key, value)
    } else if (Array.isArray(value)) {
      value.forEach(v => queryString.append(key, v))
    }
  }
  
  // Redirect to our API callback with the same params
  redirect(`/api/verify/callback?${queryString.toString()}`)
}
