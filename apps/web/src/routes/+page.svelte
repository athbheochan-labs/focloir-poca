<script lang="ts">
  import SearchBar from '$lib/components/SearchBar.svelte';
  import { searchQuery } from '$lib/stores/search';
</script>

<svelte:head>
  <title>Foclóir Póca</title>
</svelte:head>

<main class="min-h-screen bg-background text-foreground">
  <div class="mx-auto max-w-2xl px-4 py-16">
    <h1 class="mb-8 text-3xl font-bold tracking-tight">Foclóir Póca</h1>
    <SearchBar />
    {#if $searchQuery}
      <p class="mt-4 text-sm text-muted-foreground">
        Query: <span class="font-medium text-foreground">{$searchQuery}</span>
      </p>
    {/if}
  </div>
</main>
