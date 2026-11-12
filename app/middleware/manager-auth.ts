export default defineNuxtRouteMiddleware(async () => {
  const requestFetch = useRequestFetch()
  const session = await requestFetch<{ authenticated: boolean }>('/api/auth/session')

  if (!session.authenticated) {
    return navigateTo('/')
  }
})
