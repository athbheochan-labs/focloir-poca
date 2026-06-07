<script lang="ts">
  import SearchBar from '$lib/components/SearchBar.svelte';
  import ResultsList from '$lib/components/ResultsList.svelte';
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

    <!-- Right panel: word detail (next ticket) -->
    <main class="flex min-h-0 flex-1 flex-col items-center justify-center bg-background">
      {#if !$activeEntry}
        <p class="font-serif text-8xl italic font-light text-muted-foreground/25 select-none">
          focal
        </p>
        <p class="mt-4 text-sm text-muted-foreground">
          Clóscríobh focal le cuardach a dhéanamh.
        </p>
      {:else}
        <!-- WordDetail component goes here (ticket #10) -->
        <p class="text-sm text-muted-foreground">
          <span class="font-serif italic text-foreground">
            {$activeEntry.teanglann?.headword ?? $activeEntry.focloir?.headword}
          </span>
          — detail view coming in next ticket.
        </p>
      {/if}
    </main>

  </div>

  <!-- Brand bottom bar -->
  <div class="h-1 shrink-0 bg-primary"></div>
</div>
