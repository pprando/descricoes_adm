<script setup lang="ts">
interface ManagerSession {
  authenticated: boolean
  configured: boolean
}

useSeoMeta({
  title: 'Início',
  description: 'Acesse o histórico e consulte as descrições registradas no sistema.'
})

const managerSession = useNuxtData<ManagerSession>('manager-session').data
const password = ref('')
const loginError = ref('')
const isLoggingIn = ref(false)

const login = async () => {
  loginError.value = ''
  isLoggingIn.value = true

  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { password: password.value }
    })
    password.value = ''
    await refreshNuxtData('manager-session')
    await navigateTo('/historico')
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 401) {
      loginError.value = 'A senha informada está incorreta.'
    } else if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 503) {
      loginError.value = 'O acesso ainda não foi configurado. Contate o responsável pelo sistema.'
    } else {
      console.error('Erro ao autenticar gestor:', error)
      loginError.value = 'Não foi possível validar a senha. Tente novamente.'
    }
  } finally {
    isLoggingIn.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
    <section
      v-if="!managerSession?.authenticated"
      class="mx-auto max-w-lg rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-10 dark:border-gray-800 dark:bg-gray-900"
    >
      <div class="mb-8 text-center">
        <span class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <UIcon
            name="i-lucide-lock-keyhole"
            class="size-7"
            aria-hidden="true"
          />
        </span>
        <h1 class="mt-5 text-2xl font-semibold tracking-tight text-gray-950 dark:text-white">
          Acesso de gestores
        </h1>
        <p class="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
          Informe a senha de acesso para consultar o histórico de descrições e feedbacks.
        </p>
      </div>

      <UAlert
        v-if="managerSession && !managerSession.configured"
        color="warning"
        variant="subtle"
        title="Acesso não configurado"
        description="A senha ainda não foi configurada no servidor. Contate o responsável pelo sistema."
        class="mb-5"
      />

      <form
        class="space-y-4"
        @submit.prevent="login"
      >
        <UFormField
          label="Senha dos gestores"
          name="password"
        >
          <UInput
            v-model="password"
            type="password"
            autocomplete="current-password"
            placeholder="Digite a senha"
            icon="i-lucide-key-round"
            size="lg"
            class="w-full"
            :disabled="!managerSession?.configured || isLoggingIn"
            required
          />
        </UFormField>

        <p
          v-if="loginError"
          class="text-sm text-red-600 dark:text-red-400"
          role="alert"
        >
          {{ loginError }}
        </p>

        <UButton
          type="submit"
          icon="i-lucide-log-in"
          size="lg"
          block
          :loading="isLoggingIn"
          :disabled="!managerSession?.configured"
        >
          Entrar
        </UButton>
      </form>

      <p class="mt-5 text-center text-xs text-gray-500 dark:text-gray-400">
        Área restrita a gestores autorizados.
      </p>
    </section>

    <section
      v-else
      class="grid items-center gap-10 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16 dark:border-gray-800 dark:bg-gray-900"
    >
      <div>
        <p class="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          <UIcon
            name="i-lucide-folder-clock"
            class="size-4"
            aria-hidden="true"
          />
          Acompanhamento administrativo
        </p>
        <h1 class="max-w-2xl text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl lg:text-5xl dark:text-white">
          Encontre as descrições que você precisa.
        </h1>
        <p class="mt-4 max-w-xl text-base leading-7 text-gray-600 sm:text-lg dark:text-gray-300">
          Consulte os registros em um só lugar. Acesse o histórico para pesquisar descrições e acompanhar as informações cadastradas.
        </p>
        <UButton
          to="/historico"
          icon="i-lucide-history"
          trailing-icon="i-lucide-arrow-right"
          size="lg"
          class="mt-8"
        >
          Acessar histórico
        </UButton>
      </div>

      <NuxtLink
        to="/historico"
        class="group rounded-2xl border border-gray-200 bg-gray-50 p-5 transition hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:p-6 dark:border-gray-700 dark:bg-gray-800/60 dark:hover:bg-primary/10"
        aria-label="Abrir histórico de descrições"
      >
        <div class="flex items-start justify-between gap-4">
          <span class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm dark:bg-gray-900">
            <UIcon
              name="i-lucide-file-search"
              class="size-6"
              aria-hidden="true"
            />
          </span>
          <UIcon
            name="i-lucide-arrow-up-right"
            class="size-5 text-gray-400 transition group-hover:text-primary"
            aria-hidden="true"
          />
        </div>
        <h2 class="mt-6 text-lg font-semibold text-gray-900 dark:text-white">
          Histórico de descrições
        </h2>
        <p class="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
          Pesquise os registros e visualize detalhes como região, unidade e descrição.
        </p>
        <span class="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">
          Ir para o histórico
          <UIcon
            name="i-lucide-arrow-right"
            class="size-4 transition group-hover:translate-x-1"
            aria-hidden="true"
          />
        </span>
      </NuxtLink>
    </section>
  </div>
</template>
