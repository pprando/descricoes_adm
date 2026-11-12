<script setup lang="ts">
useSeoMeta({
  title: 'Início',
  description: 'Acesse o histórico e consulte as descrições registradas no sistema.'
})
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
    <section class="grid items-center gap-10 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16 dark:border-gray-800 dark:bg-gray-900">
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
