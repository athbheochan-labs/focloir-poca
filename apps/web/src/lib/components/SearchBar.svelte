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

<!--
  Designed to sit on a dark (--foreground) background strip.
  Input and toggle use inverted colours so they read on dark.
-->
<div class="flex items-center gap-2">
  <!-- Direction toggle — segmented-pill style matching the design -->
  <div
    class="flex shrink-0 overflow-hidden rounded-full border border-white/20 text-xs font-semibold"
    role="group"
    aria-label="Search direction"
  >
    <button
      type="button"
      onclick={() => searchDirection.set('ga-en')}
      aria-pressed={$searchDirection === 'ga-en'}
      class={cn(
        'px-3 py-1.5 transition-colors focus-visible:outline-none',
        $searchDirection === 'ga-en'
          ? 'bg-white text-foreground'
          : 'bg-transparent text-white/70 hover:text-white',
      )}
    >
      GA
    </button>
    <button
      type="button"
      onclick={() => searchDirection.set('en-ga')}
      aria-pressed={$searchDirection === 'en-ga'}
      class={cn(
        'px-3 py-1.5 transition-colors focus-visible:outline-none',
        $searchDirection === 'en-ga'
          ? 'bg-white text-foreground'
          : 'bg-transparent text-white/70 hover:text-white',
      )}
    >
      EN
    </button>
  </div>

  <!-- Search input — transparent on dark strip -->
  <div class="relative flex-1">
    <input
      type="text"
      bind:value={inputValue}
      oninput={scheduleUpdate}
      onkeydown={handleKeydown}
      placeholder={$searchDirection === 'ga-en' ? 'Cuardaigh focal…' : 'Search word…'}
      aria-label="Search word"
      class={cn(
        'w-full rounded-md bg-white/10 px-3 py-1.5 text-sm text-white',
        'placeholder:text-white/40 caret-white',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40',
        inputValue && 'pr-7',
      )}
    />
    {#if inputValue}
      <button
        type="button"
        onclick={clear}
        aria-label="Clear search"
        class="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-white/50 transition-colors hover:text-white focus-visible:outline-none"
      >
        <X size={13} aria-hidden="true" />
      </button>
    {/if}
  </div>
</div>
