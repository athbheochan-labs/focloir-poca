<script lang="ts">
  import SearchBar from '$lib/components/SearchBar.svelte';
  import ResultsList from '$lib/components/ResultsList.svelte';
  import DefinitionView from '$lib/components/DefinitionView.svelte';
  import { activeEntry } from '$lib/stores/search';
</script>

<svelte:head>
  <title>Foclóir Póca</title>
</svelte:head>

<div class="flex h-screen flex-col overflow-hidden">
  <!-- Nav -->
  <header class="flex shrink-0 items-center gap-3 border-b border-border bg-card px-4 py-3">
    <span class="font-serif italic text-lg leading-none text-foreground">Foclóir</span>
    <span class="text-xs font-semibold uppercase tracking-widest text-primary">Póca</span>
  </header>

  <!-- Body — two panels -->
  <div class="flex min-h-0 flex-1">

    <!-- Left panel: search + results list -->
    <aside class="flex w-80 shrink-0 flex-col border-r border-border bg-card lg:w-96">
      <!-- Search bar — dark pill matching the design -->
      <div class="shrink-0 bg-foreground px-3 py-2">
        <SearchBar />
      </div>
      <!-- Results -->
      <div class="min-h-0 flex-1 overflow-y-auto">
        <ResultsList />
      </div>
    </aside>

    <!-- Right panel: word detail -->
    <main class="flex min-h-0 flex-1 flex-col bg-background">
      {#if !$activeEntry}
        <div class="flex flex-1 flex-col items-center justify-center">
          <p class="select-none font-serif text-8xl font-light italic text-muted-foreground/20">
            focal
          </p>
          <p class="mt-4 text-sm text-muted-foreground">
            Clóscríobh focal le cuardach a dhéanamh.
          </p>
        </div>
      {:else}
        <DefinitionView />
      {/if}
    </main>

  </div>

  <!-- Brand bottom bar -->
  <div class="h-1 shrink-0 bg-primary"></div>
</div>
