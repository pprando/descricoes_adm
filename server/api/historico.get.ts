import { getAuthConfiguration, isManagerAuthenticated } from '../utils/manager-auth'

interface Feedback {
  id: number
  tipo: string
  regiao: string
  unidade: string
  nota: number
  descricao: string
  created_at: string | null
}

const validateFeedback = (obj: unknown): obj is Feedback => {
  if (typeof obj !== 'object' || obj === null) return false
  const feedback = obj as Record<string, unknown>
  return (
    typeof feedback.id === 'number'
    && typeof feedback.tipo === 'string'
    && typeof feedback.regiao === 'string'
    && typeof feedback.unidade === 'string'
    && typeof feedback.nota === 'number'
    && typeof feedback.descricao === 'string'
    && (feedback.created_at === null
      || (typeof feedback.created_at === 'string' && !Number.isNaN(Date.parse(feedback.created_at))))
  )
}

export default defineEventHandler(async (event): Promise<Feedback[]> => {
  const configuration = getAuthConfiguration(event)

  if (!configuration) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Authentication is not configured',
      message: 'A autenticação ainda não está configurada no servidor.'
    })
  }

  if (!await isManagerAuthenticated(event, configuration.sessionSecret)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'É necessário entrar para consultar o histórico.'
    })
  }

  try {
    const db = event.context.cloudflare?.env?.DB

    let validFeedbacks: Feedback[]

    if (!db) {
      console.warn('D1 binding not configured - usando dados mock para desenvolvimento')
      const mockData: Feedback[] = [
        {
          id: 6,
          tipo: 'informacao',
          regiao: 'SEDE',
          unidade: 'CENTRO MUNICIPAL DE SAÚDE',
          nota: 10,
          descricao: 'Interface muito intuitiva e fácil de usar',
          created_at: new Date(Date.now() - 5 * 60_000).toISOString()
        },
        {
          id: 5,
          tipo: 'reclamacao',
          regiao: 'SEDE',
          unidade: 'CENTRO MUNICIPAL DE SAÚDE',
          nota: 6,
          descricao: 'Gostaria de mais opções de filtro',
          created_at: new Date(Date.now() - 60 * 60_000).toISOString()
        },
        {
          id: 4,
          tipo: 'informacao',
          regiao: 'SEDE',
          unidade: 'CENTRO MUNICIPAL DE SAÚDE',
          nota: 10,
          descricao: 'Performance excelente, carrega muito rápido',
          created_at: new Date(Date.now() - 2 * 60 * 60_000).toISOString()
        },
        {
          id: 3,
          tipo: 'sugestao',
          regiao: 'SEDE',
          unidade: 'CENTRO MUNICIPAL DE SAÚDE',
          nota: 8,
          descricao: 'Alguns botões poderiam ser maiores',
          created_at: new Date(Date.now() - 3 * 60 * 60_000).toISOString()
        },
        {
          id: 2,
          tipo: 'elogio',
          regiao: 'SEDE',
          unidade: 'CENTRO MUNICIPAL DE SAÚDE',
          nota: 10,
          descricao: 'Excelente suporte técnico',
          created_at: new Date(Date.now() - 4 * 60 * 60_000).toISOString()
        },
        {
          id: 1,
          tipo: 'informacao',
          regiao: 'SEDE',
          unidade: 'CENTRO MUNICIPAL DE SAÚDE',
          nota: 9,
          descricao: 'Layout responsivo funciona bem em mobile',
          created_at: new Date(Date.now() - 5 * 60 * 60_000).toISOString()
        }
      ]
      validFeedbacks = mockData
    } else {
      const statement = db.prepare(
        'SELECT id, tipo, regiao, unidade, nota, descricao, created_at FROM feedbacks ORDER BY created_at DESC, id DESC LIMIT 1000'
      )
      const result = await statement.all()

      if (!Array.isArray(result.results)) {
        throw new Error('Invalid database response format')
      }

      validFeedbacks = result.results.filter(validateFeedback)
      if (validFeedbacks.length !== result.results.length) {
        throw new Error('D1 returned rows with an unexpected feedback schema')
      }
    }

    setResponseHeader(event, 'Cache-Control', 'no-store')
    setResponseHeader(event, 'Content-Type', 'application/json')

    return validFeedbacks
  } catch (error) {
    console.error('Erro ao buscar histórico de feedbacks:', error instanceof Error ? error.message : 'Unknown error')

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Falha ao buscar histórico de feedbacks'
    })
  }
})
