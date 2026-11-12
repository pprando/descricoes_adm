<script setup lang="ts">
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'pt-BR'
  }
})

const title = 'Acompanhamento de Descrições ADM'
const description = 'Consulte e acompanhe o histórico de descrições administrativas.'

const { data: managerSession, refresh: refreshManagerSession } = await useFetch<{
  authenticated: boolean
  configured: boolean
}>('/api/auth/session', {
  key: 'manager-session'
})
const logoutError = ref('')

const logout = async () => {
  logoutError.value = ''

  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await refreshManagerSession()
    await navigateTo('/')
  } catch (error) {
    console.error('Erro ao encerrar sessão do gestor:', error)
    logoutError.value = 'Não foi possível encerrar a sessão. Tente novamente.'
  }
}

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description
})
</script>

<template>
  <UApp>
    <div class="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <header class="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <NuxtLink
            to="/"
            class="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            aria-label="Acompanhamento de Descrições ADM - início"
          >
            <img
              src="/brasaopmdmescuro.png"
              alt=""
              class="h-9 w-auto max-w-[32vw] shrink-0 object-contain dark:hidden sm:h-12 lg:h-14"
            >
            <img
              src="/brasaopmdmclaro.png"
              alt=""
              class="hidden h-9 w-auto max-w-[32vw] shrink-0 object-contain dark:block sm:h-12 lg:h-14"
            >
            <span class="min-w-0">
              <span class="block truncate text-sm font-semibold sm:text-base">Acompanhamento ADM</span>
              <span class="hidden text-xs text-gray-500 sm:block dark:text-gray-400">Histórico de descrições</span>
            </span>
          </NuxtLink>

          <nav
            class="flex shrink-0 items-center gap-1 sm:gap-2"
            aria-label="Navegação principal"
          >
            <NuxtLink
              v-if="managerSession?.authenticated"
              to="/"
              class="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
              active-class="bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
              aria-label="Início"
            >
              <span class="hidden sm:inline">Início</span>
              <UIcon
                name="i-lucide-house"
                class="size-5 sm:hidden"
                aria-hidden="true"
              />
            </NuxtLink>
            <UColorModeButton
              color="neutral"
              variant="ghost"
              size="sm"
              aria-label="Alternar tema claro e escuro"
            />
            <UButton
              v-if="managerSession?.authenticated"
              to="/historico"
              icon="i-lucide-history"
              size="sm"
            >
              Histórico
            </UButton>
            <UButton
              v-if="managerSession?.authenticated"
              icon="i-lucide-log-out"
              color="neutral"
              variant="ghost"
              size="sm"
              aria-label="Sair da área dos gestores"
              @click="logout"
            >
              Sair
            </UButton>
          </nav>
        </div>
      </header>

      <p
        v-if="logoutError"
        class="mx-auto max-w-6xl px-4 pt-3 text-sm text-red-600 sm:px-6 dark:text-red-400"
        role="alert"
      >
        {{ logoutError }}
      </p>

      <main class="min-h-[calc(100vh-9rem)]">
        <NuxtPage />
      </main>

      <footer class="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div class="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-5 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:text-gray-400">
          <span>Acompanhamento de Descrições ADM</span>
          <span>Consulte os registros em um só lugar.</span>
        </div>
      </footer>
    </div>
  </UApp>
</template>
