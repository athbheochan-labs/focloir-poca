<script lang="ts">
  import { page } from '$app/stores';
</script>

<svelte:head>
  <title>{$page.status} · Foclóir Póca</title>
</svelte:head>

<div class="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
  <p class="font-serif italic text-8xl text-primary mb-2">{$page.status}</p>

  <p class="text-foreground text-lg mb-1">
    {#if $page.status === 404}
      Níor aimsíodh an leathanach seo.
    {:else}
      Tharla earráid gan choinne.
    {/if}
  </p>

  <p class="text-muted-foreground text-sm mb-8">
    {#if $page.status === 404}
      Page not found.
    {:else}
      Something went wrong.
    {/if}
  </p>

  <a
    href="/"
    class="text-sm text-primary underline underline-offset-4 hover:opacity-75 transition-opacity"
  >
    ← Ar ais go dtí an baile · Back home
  </a>
</div>
