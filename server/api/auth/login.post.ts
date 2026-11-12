import { createManagerSession, getAuthConfiguration, verifyManagerPassword } from '../../utils/manager-auth'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const configuration = getAuthConfiguration(event)

  if (!configuration) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Authentication is not configured',
      message: 'A autenticação ainda não está configurada no servidor.'
    })
  }

  const body: unknown = await readBody(event)
  const password = typeof body === 'object' && body !== null && 'password' in body
    ? body.password
    : undefined

  if (typeof password !== 'string' || password.length > 1024) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request',
      message: 'Informe uma senha válida.'
    })
  }

  if (!await verifyManagerPassword(password, configuration.password)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Senha incorreta.'
    })
  }

  await createManagerSession(event, configuration.sessionSecret)

  return { authenticated: true }
})
