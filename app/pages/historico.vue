<script setup lang="ts">
interface Feedback {
  id: number
  tipo: string
  regiao: string
  unidade: string
  nota: number
  descricao: string
  nome: string | null
  telefone: string | null
}

interface UnitSummary {
  regiao: string
  unidade: string
  quantidade: number
  media: number
}

const refreshInterval = 15000
const typeLabels: Record<string, string> = {
  informacao: 'Informação',
  elogio: 'Elogio',
  sugestao: 'Sugestão',
  reclamacao: 'Reclamação'
}

definePageMeta({
  layout: 'default',
  middleware: 'manager-auth'
})

useHead({
  title: 'Histórico de Feedbacks',
  meta: [
    {
      name: 'description',
      content: 'Visualize e acompanhe todos os feedbacks registrados no sistema'
    }
  ]
})

const searchQuery = ref('')
const lastUpdated = ref<Date | null>(null)
const requestFetch = useRequestFetch()

const { data: feedbacks, pending, error, refresh } = useAsyncData<Feedback[]>(
  'historico',
  () => requestFetch('/api/historico'),
  {
    transform: data => data || []
  }
)

const refreshFeedbacks = async () => {
  await refresh()
  if (!error.value) lastUpdated.value = new Date()
}

const filteredFeedbacks = computed(() => {
  if (!feedbacks.value) return []
  const query = searchQuery.value.trim().toLocaleLowerCase('pt-BR')
  if (!query) return feedbacks.value

  return feedbacks.value.filter(feedback =>
    Object.values(feedback).some(value =>
      String(value ?? '').toLocaleLowerCase('pt-BR').includes(query)
    )
  )
})

const feedbacksByType = computed(() => {
  const counts = new Map<string, number>()

  for (const feedback of feedbacks.value ?? []) {
    counts.set(feedback.tipo, (counts.get(feedback.tipo) ?? 0) + 1)
  }

  return [...counts.entries()]
    .map(([tipo, quantidade]) => ({
      tipo,
      label: typeLabels[tipo] ?? `${tipo.charAt(0).toLocaleUpperCase('pt-BR')}${tipo.slice(1)}`,
      quantidade
    }))
    .sort((a, b) => b.quantidade - a.quantidade)
})

const maxFeedbacksByType = computed(() =>
  Math.max(1, ...feedbacksByType.value.map(item => item.quantidade))
)

const unitSummaries = computed<UnitSummary[]>(() => {
  const units = new Map<string, { regiao: string, unidade: string, notas: number[] }>()

  for (const feedback of feedbacks.value ?? []) {
    const key = JSON.stringify([feedback.regiao, feedback.unidade])
    const unit = units.get(key) ?? {
      regiao: feedback.regiao,
      unidade: feedback.unidade,
      notas: []
    }

    unit.notas.push(feedback.nota)
    units.set(key, unit)
  }

  return [...units.values()]
    .map(unit => ({
      regiao: unit.regiao,
      unidade: unit.unidade,
      quantidade: unit.notas.length,
      media: unit.notas.reduce((total, nota) => total + nota, 0) / unit.notas.length
    }))
    .sort((a, b) => b.quantidade - a.quantidade || a.unidade.localeCompare(b.unidade, 'pt-BR'))
})

const overallAverage = computed(() => {
  const allFeedbacks = feedbacks.value ?? []
  if (!allFeedbacks.length) return 0

  return allFeedbacks.reduce((total, feedback) => total + feedback.nota, 0) / allFeedbacks.length
})

const ratingLabel = (average: number): string => {
  if (average < 6) return 'Baixa'
  if (average < 8) return 'Média'
  return 'Alta'
}

const ratingClass = (average: number): string => {
  if (average < 6) return 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
  if (average < 8) return 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
  return 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300'
}

const clearSearch = () => {
  searchQuery.value = ''
}

let refreshTimer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  lastUpdated.value = new Date()
  refreshTimer = setInterval(() => {
    if (!pending.value) void refreshFeedbacks()
  }, refreshInterval)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})

const formatUpdatedAt = (date: Date): string =>
  new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'America/Sao_Paulo'
  }).format(date)
</script>

<template>
  <div>
    <!-- Hero Section -->
    <UPageHero
      title="Histórico de Feedbacks"
      description="Acompanhe e analise todos os feedbacks registrados no sistema em uma interface intuitiva e responsiva."
      :ui="{
        root: 'relative overflow-hidden',
        container: 'flex items-center justify-between gap-6'
      }"
    />

    <!-- Main Content -->
    <UPageSection
      class="space-y-8"
      :ui="{ container: 'max-w-full' }"
    >
      <!-- Search and Stats Bar -->
      <div class="space-y-4">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <!-- Search Input -->
          <div class="w-full sm:flex-1">
            <UInput
              v-model="searchQuery"
              type="search"
              placeholder="Pesquisar em todas as colunas..."
              icon="i-lucide-search"
              size="lg"
              :ui="{ root: 'rounded-xl' }"
            />
          </div>

          <!-- Refresh Button -->
          <UButton
            icon="i-lucide-refresh-cw"
            :loading="pending"
            variant="soft"
            color="neutral"
            aria-label="Atualizar lista de feedbacks"
            @click="refreshFeedbacks"
          >
            Atualizar
          </UButton>
        </div>

        <p
          class="text-xs text-gray-500 dark:text-gray-400"
          role="status"
        >
          Atualização automática a cada 15 segundos
          <span v-if="lastUpdated"> · Última atualização: {{ formatUpdatedAt(lastUpdated) }}</span>
        </p>

        <!-- Stats -->
        <div
          v-if="feedbacks && feedbacks.length > 0"
          class="flex items-center gap-4 rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900/50"
          role="status"
          aria-label="Contador de feedbacks"
        >
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-file-text"
              class="h-5 w-5 text-green-600 dark:text-green-500"
              aria-hidden="true"
            />
            <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
              {{ filteredFeedbacks.length }} de {{ feedbacks.length }}
              <span class="text-gray-500 dark:text-gray-500">
                {{ feedbacks.length === 1 ? 'registro' : 'registros' }}
              </span>
            </span>
          </div>

          <div
            v-if="searchQuery"
            class="ml-auto"
          >
            <UButton
              icon="i-lucide-x"
              size="xs"
              color="neutral"
              variant="ghost"
              aria-label="Limpar filtro de pesquisa"
              @click="clearSearch"
            >
              Limpar
            </UButton>
          </div>
        </div>
      </div>

      <section
        v-if="feedbacks?.length"
        class="space-y-4"
        aria-labelledby="dashboard-title"
      >
        <div>
          <h2
            id="dashboard-title"
            class="text-xl font-semibold text-gray-900 dark:text-white"
          >
            Resumo dos feedbacks
          </h2>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Indicadores calculados com base nos {{ feedbacks.length }} registros carregados.
          </p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <UCard>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Total de feedbacks
            </p>
            <p class="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {{ feedbacks.length }}
            </p>
          </UCard>

          <UCard>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Unidades com registros
            </p>
            <p class="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {{ unitSummaries.length }}
            </p>
          </UCard>

          <UCard>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Média geral das notas
            </p>
            <p class="mt-2 flex items-baseline gap-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {{ overallAverage.toFixed(1) }}
              <span class="text-sm font-normal text-gray-500 dark:text-gray-400">de 10</span>
            </p>
          </UCard>
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <UCard>
            <template #header>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white">
                  Feedbacks por tipo
                </h3>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Quantidade de registros em cada categoria.
                </p>
              </div>
            </template>

            <div
              v-if="feedbacksByType.length"
              class="space-y-4"
            >
              <div
                v-for="item in feedbacksByType"
                :key="item.tipo"
                class="space-y-1.5"
              >
                <div class="flex items-center justify-between gap-3 text-sm">
                  <span class="font-medium text-gray-700 dark:text-gray-200">{{ item.label }}</span>
                  <span class="tabular-nums text-gray-500 dark:text-gray-400">{{ item.quantidade }}</span>
                </div>
                <div class="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    class="h-full rounded-full bg-primary transition-all"
                    :style="{ width: `${(item.quantidade / maxFeedbacksByType) * 100}%` }"
                  />
                </div>
              </div>
            </div>
          </UCard>

          <UCard class="lg:col-span-1">
            <template #header>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white">
                  Feedbacks e notas por unidade
                </h3>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Média calculada com todas as notas da unidade.
                </p>
              </div>
            </template>

            <div class="overflow-x-auto">
              <table class="min-w-full text-left text-sm">
                <thead>
                  <tr class="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    <th
                      scope="col"
                      class="pb-3 pr-4 font-medium"
                    >
                      Unidade
                    </th>
                    <th
                      scope="col"
                      class="whitespace-nowrap px-3 pb-3 text-right font-medium"
                    >
                      Feedbacks
                    </th>
                    <th
                      scope="col"
                      class="whitespace-nowrap pl-3 pb-3 text-right font-medium"
                    >
                      Média
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                  <tr
                    v-for="unit in unitSummaries"
                    :key="`${unit.regiao}-${unit.unidade}`"
                    class="align-top"
                  >
                    <td class="py-3 pr-4">
                      <p class="font-medium text-gray-900 dark:text-white">
                        {{ unit.unidade }}
                      </p>
                      <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {{ unit.regiao }}
                      </p>
                    </td>
                    <td class="whitespace-nowrap px-3 py-3 text-right tabular-nums text-gray-600 dark:text-gray-300">
                      {{ unit.quantidade }}
                    </td>
                    <td class="whitespace-nowrap py-3 pl-3 text-right">
                      <span
                        class="inline-flex rounded-full px-2 py-1 text-xs font-medium"
                        :class="ratingClass(unit.media)"
                      >
                        {{ unit.media.toFixed(1) }} · {{ ratingLabel(unit.media) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </UCard>
        </div>
      </section>

      <!-- Loading State - Skeleton -->
      <div
        v-if="pending && !feedbacks"
        class="space-y-4"
      >
        <div
          v-for="i in 3"
          :key="`skeleton-${i}`"
          class="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950"
        >
          <USkeleton
            class="h-4 w-3/4 rounded"
          />
          <USkeleton
            class="h-3 w-full rounded"
          />
          <USkeleton
            class="h-3 w-5/6 rounded"
          />
          <USkeleton
            class="h-2 w-1/3 rounded"
          />
        </div>
      </div>

      <!-- Error State -->
      <UCard
        v-else-if="error"
        class="border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-950/20"
      >
        <template #header>
          <div class="flex items-center gap-3">
            <UIcon
              name="i-lucide-alert-circle"
              class="h-5 w-5 text-red-600 dark:text-red-500"
            />
            <h3 class="font-semibold text-red-900 dark:text-red-200">
              Erro ao carregar feedbacks
            </h3>
          </div>
        </template>

        <p class="text-sm text-red-800 dark:text-red-300">
          {{ error.message || 'Ocorreu um erro ao buscar o histórico. Tente novamente.' }}
        </p>

        <template #footer>
          <UButton
            color="error"
            variant="soft"
            icon="i-lucide-refresh-cw"
            @click="refreshFeedbacks"
          >
            Tentar novamente
          </UButton>
        </template>
      </UCard>

      <!-- Empty State -->
      <div
        v-else-if="!pending && filteredFeedbacks.length === 0"
        class="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-gray-200 py-12 dark:border-gray-800"
      >
        <UIcon
          name="i-lucide-inbox"
          class="h-12 w-12 text-gray-300 dark:text-gray-700"
        />
        <div class="text-center">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ searchQuery ? 'Nenhum feedback encontrado' : 'Nenhum feedback registrado' }}
          </h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{
              searchQuery
                ? 'Tente ajustar sua busca'
                : 'Os feedbacks registrados aparecerão aqui'
            }}
          </p>
        </div>

        <UButton
          v-if="searchQuery"
          color="neutral"
          variant="soft"
          icon="i-lucide-x"
          @click="clearSearch"
        >
          Limpar filtro
        </UButton>
      </div>

      <!-- Feedbacks Table -->
      <div
        v-else
        class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800"
      >
        <table class="min-w-full divide-y divide-gray-200 text-left text-sm dark:divide-gray-800">
          <thead class="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th
                scope="col"
                class="whitespace-nowrap px-4 py-3 font-semibold"
              >
                ID
              </th>
              <th
                scope="col"
                class="whitespace-nowrap px-4 py-3 font-semibold"
              >
                Tipo
              </th>
              <th
                scope="col"
                class="whitespace-nowrap px-4 py-3 font-semibold"
              >
                Região
              </th>
              <th
                scope="col"
                class="whitespace-nowrap px-4 py-3 font-semibold"
              >
                Unidade
              </th>
              <th
                scope="col"
                class="whitespace-nowrap px-4 py-3 font-semibold"
              >
                Nota
              </th>
              <th
                scope="col"
                class="min-w-72 px-4 py-3 font-semibold"
              >
                Descrição
              </th>
              <th
                scope="col"
                class="whitespace-nowrap px-4 py-3 font-semibold"
              >
                Nome
              </th>
              <th
                scope="col"
                class="whitespace-nowrap px-4 py-3 font-semibold"
              >
                Telefone
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
            <tr
              v-for="feedback in filteredFeedbacks"
              :key="feedback.id"
              class="align-top hover:bg-gray-50 dark:hover:bg-gray-900/50"
            >
              <td class="whitespace-nowrap px-4 py-3">
                {{ feedback.id }}
              </td>
              <td class="whitespace-nowrap px-4 py-3">
                {{ feedback.tipo }}
              </td>
              <td class="whitespace-nowrap px-4 py-3">
                {{ feedback.regiao }}
              </td>
              <td class="min-w-64 px-4 py-3">
                {{ feedback.unidade }}
              </td>
              <td class="whitespace-nowrap px-4 py-3">
                {{ feedback.nota }}
              </td>
              <td class="min-w-72 whitespace-pre-wrap px-4 py-3">
                {{ feedback.descricao }}
              </td>
              <td class="whitespace-nowrap px-4 py-3">
                {{ feedback.nome ?? '—' }}
              </td>
              <td class="whitespace-nowrap px-4 py-3">
                {{ feedback.telefone ?? '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UPageSection>
  </div>
</template>
