import type { H3Event } from 'h3'

const SESSION_COOKIE_NAME = import.meta.dev
  ? 'manager_session'
  : '__Host-manager_session'
const SESSION_DURATION_SECONDS = 8 * 60 * 60
const SESSION_DURATION_MILLISECONDS = SESSION_DURATION_SECONDS * 1000
const textEncoder = new TextEncoder()

interface AuthConfiguration {
  password: string
  sessionSecret: string
}

const isString = (value: unknown): value is string =>
  typeof value === 'string'

export const getAuthConfiguration = (event: H3Event): AuthConfiguration | null => {
  const cloudflareEnvironment = event.context.cloudflare?.env as {
    MANAGER_PASSWORD?: unknown
    MANAGER_SESSION_SECRET?: unknown
  } | undefined
  const password = cloudflareEnvironment?.MANAGER_PASSWORD
  const sessionSecret = cloudflareEnvironment?.MANAGER_SESSION_SECRET

  if (
    !isString(password)
    || password.length < 12
    || !isString(sessionSecret)
    || sessionSecret.length < 32
  ) {
    return null
  }

  return { password, sessionSecret }
}

const getSignature = async (value: string, secret: string): Promise<ArrayBuffer> => {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  return crypto.subtle.sign('HMAC', key, textEncoder.encode(value))
}

const encodeBase64Url = (value: ArrayBuffer): string => {
  const bytes = new Uint8Array(value)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

export const verifyManagerPassword = async (password: string, expectedPassword: string): Promise<boolean> => {
  const [submittedDigest, expectedDigest] = await Promise.all([
    crypto.subtle.digest('SHA-256', textEncoder.encode(password)),
    crypto.subtle.digest('SHA-256', textEncoder.encode(expectedPassword))
  ])
  const submittedBytes = new Uint8Array(submittedDigest)
  const expectedBytes = new Uint8Array(expectedDigest)
  let difference = 0

  for (let index = 0; index < expectedBytes.length; index++) {
    difference |= expectedBytes[index]! ^ submittedBytes[index]!
  }

  return difference === 0
}

export const createManagerSession = async (event: H3Event, sessionSecret: string): Promise<void> => {
  const expiresAt = Date.now() + SESSION_DURATION_MILLISECONDS
  const sessionValue = String(expiresAt)
  const signature = await getSignature(sessionValue, sessionSecret)

  setCookie(event, SESSION_COOKIE_NAME, `${sessionValue}.${encodeBase64Url(signature)}`, {
    httpOnly: true,
    secure: !import.meta.dev,
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS
  })
  setResponseHeader(event, 'Cache-Control', 'no-store')
}

export const clearManagerSession = (event: H3Event): void => {
  deleteCookie(event, SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: !import.meta.dev,
    sameSite: 'strict',
    path: '/'
  })
  setResponseHeader(event, 'Cache-Control', 'no-store')
}

export const isManagerAuthenticated = async (event: H3Event, sessionSecret: string): Promise<boolean> => {
  const cookie = getCookie(event, SESSION_COOKIE_NAME)
  if (!cookie) return false

  const separator = cookie.indexOf('.')
  if (separator <= 0) return false

  const sessionValue = cookie.slice(0, separator)
  const encodedSignature = cookie.slice(separator + 1)
  const expiresAt = Number(sessionValue)

  if (
    !Number.isSafeInteger(expiresAt)
    || expiresAt <= Date.now()
    || expiresAt > Date.now() + SESSION_DURATION_MILLISECONDS
    || !/^[\w-]+$/.test(encodedSignature)
  ) {
    return false
  }

  try {
    const signature = encodedSignature.replaceAll('-', '+').replaceAll('_', '/')
    const paddedSignature = signature.padEnd(Math.ceil(signature.length / 4) * 4, '=')
    const signatureBytes = Uint8Array.from(atob(paddedSignature), character => character.charCodeAt(0))
    const key = await crypto.subtle.importKey(
      'raw',
      textEncoder.encode(sessionSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    return crypto.subtle.verify('HMAC', key, signatureBytes, textEncoder.encode(sessionValue))
  } catch {
    return false
  }
}
