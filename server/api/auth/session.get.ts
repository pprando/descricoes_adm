import { getAuthConfiguration, isManagerAuthenticated } from '../../utils/manager-auth'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const configuration = getAuthConfiguration(event)

  if (!configuration) {
    return { authenticated: false, configured: false }
  }

  return {
    authenticated: await isManagerAuthenticated(event, configuration.sessionSecret),
    configured: true
  }
})
