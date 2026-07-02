<script setup lang="ts">
interface Feedback {
  descricao: string
  created_at: string
}

definePageMeta({
  layout: 'default'
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

// Usar sem await para evitar problemas de SSR/Hidratação
const { data: feedbacks, pending, error, refresh } = useAsyncData<Feedback[]>(
  'historico',
  () => $fetch('/api/historico'),
  {
    transform: (data) => data || [],
    // Watch para refetch quando search mudar
    watch: [searchQuery] as const
  }
)

const filteredFeedbacks = computed(() => {
  if (!feedbacks.value) return []

  if (!searchQuery.value.trim()) {
    return feedbacks.value
  }

  const query = searchQuery.value.toLowerCase()
  return feedbacks.value.filter((feedback) =>
    feedback.descricao.toLowerCase().includes(query)
  )
})

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Data inválida'
    
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    }).format(date)
  } catch (e) {
    console.error('Error formatting date:', e)
    return 'Data inválida'
  }
}

// Timestamp reativo para atualizar "Há Xm" a cada minuto
const now = ref(new Date())

// Só no cliente para evitar mismatch SSR
if (process.client) {
  setInterval(() => {
    now.value = new Date()
  }, 60000) // Atualiza a cada 1 minuto
}

const getTimeAgo = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Data inválida'
    
    const diffInSeconds = Math.floor((now.value.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Agora mesmo'
    if (diffInSeconds < 3600) return `Há ${Math.floor(diffInSeconds / 60)}m`
    if (diffInSeconds < 86400) return `Há ${Math.floor(diffInSeconds / 3600)}h`
    if (diffInSeconds < 604800) return `Há ${Math.floor(diffInSeconds / 86400)}d`
    return 'Há vários dias'
  } catch (e) {
    console.error('Error calculating time ago:', e)
    return 'Data inválida'
  }
}
</script>

<template>
  <div>
    <!-- Hero Section -->
    <UPageHero
      title="Histórico de Feedbacks"
      description="Acompanhe e analise todos os feedbacks registrados no sistema em uma interface intuitiva e responsiva."
      :ui="{
        base: 'relative overflow-hidden',
        container: 'flex items-center justify-between gap-6'
      }"
    />

    <!-- Main Content -->
    <UPageSection
      class="space-y-8"
      :ui="{ container: 'max-w-4xl' }"
    >
      <!-- Search and Stats Bar -->
      <div class="space-y-4">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <!-- Search Input -->
          <div class="w-full sm:flex-1">
            <UInput
              v-model="searchQuery"
              type="search"
              placeholder="Pesquisar por descrição..."
              icon="i-lucide-search"
              size="lg"
              :ui="{ rounded: 'rounded-xl' }"
            />
          </div>

          <!-- Refresh Button -->
          <UButton
            icon="i-lucide-refresh-cw"
            :loading="pending"
            @click="refresh"
            variant="soft"
            color="gray"
            aria-label="Atualizar lista de feedbacks"
          >
            Atualizar
          </UButton>
        </div>

        <!-- Stats -->
        <div
          v-if="!pending && feedbacks && feedbacks.length > 0"
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
                {{ feedbacks.length === 1 ? 'feedback' : 'feedbacks' }}
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
              color="gray"
              variant="ghost"
              @click="searchQuery = ''"
              aria-label="Limpar filtro de pesquisa"
            >
              Limpar
            </UButton>
          </div>
        </div>
      </div>

      <!-- Loading State - Skeleton -->
      <div
        v-if="pending"
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
            icon="i-lucide-refresh-cw"
            @click="refresh"
            color="red"
            variant="soft"
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
          icon="i-lucide-x"
          color="gray"
          variant="soft"
          @click="searchQuery = ''"
        >
          Limpar filtro
        </UButton>
      </div>

      <!-- Feedbacks List -->
      <div
        v-else
        class="space-y-3"
      >
        <TransitionGroup
          name="list"
          tag="div"
        >
          <UCard
            v-for="(feedback, index) in filteredFeedbacks"
            :key="`feedback-${index}`"
            class="group cursor-pointer transition-all duration-200 hover:shadow-md dark:hover:shadow-xl"
            :ui="{
              body: { padding: 'p-4 sm:p-5' },
              header: { padding: '' },
              footer: { padding: '' }
            }"
          >
            <!-- Content -->
            <div class="space-y-3">
              <!-- Description -->
              <p class="whitespace-pre-wrap text-base leading-relaxed text-gray-900 dark:text-gray-100">
                {{ feedback.descricao }}
              </p>

              <!-- Date Info -->
              <div class="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <div class="flex items-center gap-2">
                  <UIcon
                    name="i-lucide-calendar"
                    class="h-4 w-4 text-gray-400 dark:text-gray-600"
                  />
                  <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {{ formatDate(feedback.created_at) }}
                  </span>
                </div>

                <div class="flex items-center gap-2">
                  <UIcon
                    name="i-lucide-clock"
                    class="h-4 w-4 text-gray-400 dark:text-gray-600"
                  />
                  <span class="text-xs text-gray-500 dark:text-gray-500">
                    {{ getTimeAgo(feedback.created_at) }}
                  </span>
                </div>
              </div>
            </div>
          </UCard>
        </TransitionGroup>
      </div>

      <!-- No Results Message -->
      <p
        v-if="!pending && feedbacks && feedbacks.length > 0 && filteredFeedbacks.length === 0 && searchQuery"
        class="text-center text-sm text-gray-500 dark:text-gray-400"
      >
        Nenhum resultado para "<strong>{{ searchQuery }}</strong>"
      </p>
    </UPageSection>
  </div>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.list-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.list-move {
  transition: transform 0.3s ease;
}
</style>
