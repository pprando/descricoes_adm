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

    // Se D1 não estiver configurado, usar dados mock para desenvolvimento
    let validFeedbacks: Feedback[]

    if (!db) {
      console.warn('D1 binding not configured - usando dados mock para desenvolvimento')
      
      // Dados mock para testes e desenvolvimento
      const mockData: Feedback[] = [
        {
          descricao: 'Interface muito intuitiva e fácil de usar',
          created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() // 5 minutos atrás
        },
        {
          descricao: 'Gostaria de mais opções de filtro',
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutos atrás
        },
        {
          descricao: 'Performance excelente, carrega muito rápido',
          created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString() // 1 hora atrás
        },
        {
          descricao: 'Alguns botões poderiam ser maiores',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 horas atrás
        },
        {
          descricao: 'Excelente suporte técnico',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 dia atrás
        },
        {
          descricao: 'Layout responsivo funciona bem em mobile',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() // 2 dias atrás
        }
      ]
      
      validFeedbacks = mockData
    } else {
      // Executa a query preparada com LIMIT para evitar sobrecarga
      // Máximo 1000 registros por requisição
      const statement = db.prepare(
        'SELECT descricao, created_at FROM feedbacks ORDER BY created_at DESC LIMIT 1000'
      )

      const result = await statement.all()

      // Valida e sanitiza resultados
      if (!Array.isArray(result.results)) {
        console.error('Invalid database response format')
        validFeedbacks = []
      } else {
        validFeedbacks = result.results.filter(validateFeedback)
      }
    }

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
