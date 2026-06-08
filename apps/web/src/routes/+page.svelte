<script lang="ts">
  import SearchBar from '$lib/components/SearchBar.svelte';
  import ResultsList from '$lib/components/ResultsList.svelte';
  import DefinitionView from '$lib/components/DefinitionView.svelte';
  import { searchQuery, activeEntry } from '$lib/stores/search';
  import { performLookup, clearSearch } from '$lib/services/lookup';
  import { ArrowLeft } from 'lucide-svelte';

  let showDetail = $state(false);

  $effect(() => {
    const word = $searchQuery.trim();
    if (word) performLookup(word);
    else {
      clearSearch();
      showDetail = false;
    }
  });

  $effect(() => {
    if ($activeEntry) showDetail = true;
  });
</script>

<svelte:head><title>Foclóir Póca</title></svelte:head>

<div class="flex h-screen flex-col overflow-hidden">

  <header class="flex shrink-0 items-center gap-3 border-b border-border bg-card px-4 py-3">
    {#if showDetail}
      <button
        type="button"
        onclick={() => (showDetail = false)}
        aria-label="Ar ais chuig na torthaí"
        class="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
      >
        <ArrowLeft size={18} aria-hidden="true" />
      </button>
    {/if}
    <span class="font-serif italic text-lg leading-none text-foreground">Foclóir</span>
    <span class="text-xs font-semibold uppercase tracking-widest text-primary">Póca</span>
  </header>

  <div class="flex min-h-0 flex-1">

    <aside
      class="flex shrink-0 flex-col border-r border-border bg-card
             w-full md:flex md:w-80 lg:w-96
             {showDetail ? 'hidden md:flex' : 'flex'}"
    >
      <div class="shrink-0 bg-foreground px-3 py-2">
        <SearchBar />
      </div>
      <div class="min-h-0 flex-1 overflow-y-auto">
        <ResultsList />
      </div>
    </aside>

    <main
      class="min-h-0 flex-1 flex-col bg-background
             {showDetail ? 'flex' : 'hidden md:flex'}"
    >
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

  <div class="h-1 shrink-0 bg-primary"></div>
</div>
