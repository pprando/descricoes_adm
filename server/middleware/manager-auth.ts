import { getAuthConfiguration, isManagerAuthenticated } from '../utils/manager-auth'

export default defineEventHandler(async (event) => {
  const pathname = getRequestURL(event).pathname
  const isHistoryPage = pathname === '/historico' || pathname === '/historico/'
  const isHistoryApi = pathname === '/api/historico'

  if (!isHistoryPage && !isHistoryApi) return
  if (isHistoryPage) setResponseHeader(event, 'Cache-Control', 'private, no-store')

  const configuration = getAuthConfiguration(event)
  const authenticated = configuration
    ? await isManagerAuthenticated(event, configuration.sessionSecret)
    : false

  if (authenticated) return

  if (isHistoryPage) {
    return sendRedirect(event, '/', 302)
  }

  setResponseHeader(event, 'Cache-Control', 'no-store')
  throw createError({
    statusCode: configuration ? 401 : 503,
    statusMessage: configuration ? 'Unauthorized' : 'Authentication is not configured',
    message: configuration
      ? 'É necessário entrar para consultar o histórico.'
      : 'A autenticação ainda não está configurada no servidor.'
  })
})
