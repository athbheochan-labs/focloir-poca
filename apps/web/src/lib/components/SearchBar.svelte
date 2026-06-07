<script lang="ts">
  import { X, ArrowLeftRight } from 'lucide-svelte';
  import { cn } from '$lib/utils';
  import { searchQuery, searchDirection } from '$lib/stores/search';

  let inputValue = $state('');
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function scheduleUpdate() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchQuery.set(inputValue);
      debounceTimer = null;
    }, 200);
  }

  function submit() {
    if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
    searchQuery.set(inputValue);
  }

  function clear() {
    if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
    inputValue = '';
    searchQuery.set('');
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') clear();
    else if (e.key === 'Enter') submit();
  }

  function toggleDirection() {
    searchDirection.update((d) => (d === 'ga-en' ? 'en-ga' : 'ga-en'));
  }

  // Cancel any in-flight debounce when the component is torn down
  $effect(() => () => { if (debounceTimer) clearTimeout(debounceTimer); });
</script>

<div class="flex items-center gap-2">
  <!-- Direction toggle -->
  <button
    type="button"
    onclick={toggleDirection}
    aria-label="Toggle search direction"
    class={cn(
      'flex shrink-0 items-center gap-1.5 rounded-md border border-border',
      'bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground',
      'transition-colors hover:bg-accent hover:text-accent-foreground',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    )}
  >
    <ArrowLeftRight size={14} aria-hidden="true" />
    {$searchDirection === 'ga-en' ? 'GA → EN' : 'EN → GA'}
  </button>

  <!-- Search input -->
  <div class="relative flex-1">
    <input
      type="text"
      bind:value={inputValue}
      oninput={scheduleUpdate}
      onkeydown={handleKeydown}
      placeholder={$searchDirection === 'ga-en' ? 'Cuardaigh focal Gaeilge…' : 'Search English word…'}
      aria-label="Search word"
      class={cn(
        'w-full rounded-md border border-border bg-background px-3 py-2 text-sm',
        'text-foreground placeholder:text-muted-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        inputValue && 'pr-8',
      )}
    />
    {#if inputValue}
      <button
        type="button"
        onclick={clear}
        aria-label="Clear search"
        class={cn(
          'absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5',
          'text-muted-foreground transition-colors hover:text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
      >
        <X size={14} aria-hidden="true" />
      </button>
    {/if}
  </div>
</div>
