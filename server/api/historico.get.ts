interface Feedback {
  descricao: string
  created_at: string
}

export default defineEventHandler(async (event): Promise<Feedback[]> => {
  try {
    // Acessa o binding do D1 a partir do contexto do Cloudflare
    // O nome do binding deve ser configurado no wrangler.toml como:
    // [[d1_databases]]
    // binding = "DB"
    const db = event.context.cloudflare?.env?.DB

    if (!db) {
      throw new Error('Database binding not found. Ensure D1 is configured in wrangler.toml')
    }

    // Executa a query preparada para buscar histórico de feedbacks
    const statement = db.prepare(
      'SELECT descricao, created_at FROM feedbacks ORDER BY created_at DESC'
    )

    const result = await statement.all()

    // Retorna o array de resultados
    return result.results as Feedback[]
  } catch (error) {
    console.error('Erro ao buscar histórico de feedbacks:', error)

    // Retorna erro genérico sem expor detalhes internos
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Falha ao buscar histórico de feedbacks'
    })
  }
})
