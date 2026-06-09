<script lang="ts">
  import '../app.css';
  import { afterNavigate } from '$app/navigation';
  import { trackPageview } from '$lib/analytics';

  let { children } = $props();

  // Fire one pageview per session load. Subsequent client-side navigations
  // (search query changes) are captured as custom 'search' events instead.
  afterNavigate(({ type }) => {
    if (type === 'enter') trackPageview();
  });
</script>

{@render children()}
