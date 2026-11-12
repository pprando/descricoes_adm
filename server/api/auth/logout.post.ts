import { clearManagerSession } from '../../utils/manager-auth'

export default defineEventHandler((event) => {
  clearManagerSession(event)
  return { authenticated: false }
})
