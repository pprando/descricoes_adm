interface Feedback {
  descricao: string
  created_at: string
}

// Validação de tipo simples (sem dependência extra)
const validateFeedback = (obj: unknown): obj is Feedback => {
  if (typeof obj !== 'object' || obj === null) return false
  const feedback = obj as Record<string, unknown>
  return (
    typeof feedback.descricao === 'string' &&
    feedback.descricao.length > 0 &&
    typeof feedback.created_at === 'string' &&
    !isNaN(Date.parse(feedback.created_at))
  )
}

export default defineEventHandler(async (event): Promise<Feedback[]> => {
  try {
    // Acessa o binding do D1 a partir do contexto do Cloudflare
    // O nome do binding deve ser configurado no wrangler.toml como:
    // [[d1_databases]]
    // binding = "DB"
    const db = event.context.cloudflare?.env?.DB

    if (!db) {
      console.error('D1 binding not configured')
      throw createError({
        statusCode: 503,
        statusMessage: 'Service Unavailable',
        message: 'Database configuration error'
      })
    }

    // Executa a query preparada com LIMIT para evitar sobrecarga
    // Máximo 1000 registros por requisição
    const statement = db.prepare(
      'SELECT descricao, created_at FROM feedbacks ORDER BY created_at DESC LIMIT 1000'
    )

    const result = await statement.all()

    // Valida e sanitiza resultados
    if (!Array.isArray(result.results)) {
      console.error('Invalid database response format')
      return []
    }

    const validFeedbacks = result.results.filter(validateFeedback)

    // Set cache headers (30 segundos para dados não-críticos)
    setResponseHeader(event, 'Cache-Control', 'public, max-age=30, stale-while-revalidate=300')
    setResponseHeader(event, 'Content-Type', 'application/json')

    return validFeedbacks
  } catch (error) {
    console.error('Erro ao buscar histórico de feedbacks:', error instanceof Error ? error.message : 'Unknown error')

    // Retorna erro genérico sem expor detalhes internos
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Falha ao buscar histórico de feedbacks'
    })
  }
})
