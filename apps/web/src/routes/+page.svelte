<script lang="ts">
  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
</script>

<svelte:head>
  <title>Foclóir Póca</title>
</svelte:head>

<main class="min-h-screen bg-background text-foreground">
  <div class="mx-auto max-w-2xl px-4 py-16">
    <h1 class="text-3xl font-bold tracking-tight">Foclóir Póca</h1>
    <p class="mt-2 text-muted-foreground">
      Irish dictionary proxy — <code class="text-sm text-foreground">{apiUrl}</code>
    </p>
  </div>
</main>
