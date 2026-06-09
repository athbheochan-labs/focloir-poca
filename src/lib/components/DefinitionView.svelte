<script lang="ts">
  import { cn } from '$lib/utils';
  import { activeEntry, searchDirection } from '$lib/stores/search';
  import type { FocloirSense } from '$lib/types';
  import { trackEvent } from '$lib/analytics';
  import { ExternalLink } from 'lucide-svelte';

  type Tab = 'teanglann' | 'focloir';

  let activeTab = $state<Tab>('teanglann');

  // Switch to the best available source when the entry changes
  $effect(() => {
    const entry = $activeEntry;
    if (entry) activeTab = entry.teanglann ? 'teanglann' : 'focloir';
  });

  // Group focloir senses into consecutive POS blocks for cleaner display
  function groupByPos(senses: FocloirSense[]) {
    const groups: { pos: string; senses: FocloirSense[] }[] = [];
    for (const s of senses) {
      const last = groups.at(-1);
      if (last && last.pos === s.partOfSpeech) last.senses.push(s);
      else groups.push({ pos: s.partOfSpeech, senses: [s] });
    }
    return groups;
  }

  const TEANGLANN_BASE = 'https://www.teanglann.ie/en/fgb';
  const FOCLOIR_BASE = 'https://www.focloir.ie/en/dictionary/ei';
</script>

{#if $activeEntry}
  {@const entry = $activeEntry}
  {@const t = entry.teanglann}
  {@const f = entry.focloir}
  {@const hw = t?.headword ?? f?.headword ?? entry.word}

  <div class="flex h-full flex-col">

    <!-- ── Headword + meta ──────────────────────────────────────── -->
    <header class="shrink-0 border-b border-border px-8 pb-5 pt-7">
      <p class="mb-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {$searchDirection === 'ga-en' ? 'Gaeilge → Béarla' : 'Béarla → Gaeilge'}
      </p>

      <h1 class="font-serif text-5xl font-light italic leading-tight text-foreground">
        {hw}
      </h1>

      <!-- Meta line: POS · inflection text -->
      {#if t?.partOfSpeech || t?.inflectionText}
        <p class="mt-2 text-sm text-muted-foreground">
          {[t.partOfSpeech, t.inflectionText].filter(Boolean).join(' · ')}
        </p>
      {:else if f?.senses[0]?.partOfSpeech}
        <p class="mt-2 text-sm text-muted-foreground">{f.senses[0].partOfSpeech}</p>
      {/if}
    </header>

    <!-- ── Source tabs ───────────────────────────────────────────── -->
    <div class="shrink-0 border-b border-border px-8" role="tablist" aria-label="Source">
      {#each ([['teanglann', 'Ó Dónaill', !!t], ['focloir', 'focloir.ie', !!f]] as const) as [id, label, available]}
        <button
          type="button"
          role="tab"
          id="tab-{id}"
          aria-selected={activeTab === id}
          aria-controls="panel-{id}"
          onclick={() => { if (available) { activeTab = id; trackEvent('source_tab', { tab: id }); } }}
          class={cn(
            '-mb-px inline-block border-b-2 pb-3 pt-3 text-sm transition-colors',
            id !== 'teanglann' && 'ml-6',
            activeTab === id
              ? 'border-primary font-medium text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
            !available && 'cursor-not-allowed opacity-35',
          )}
        >
          {label}
        </button>
      {/each}
    </div>

    <!-- ── Tab panels ────────────────────────────────────────────── -->
    <div class="min-h-0 flex-1 overflow-y-auto">

      <!-- Ó Dónaill panel -->
      <div
        id="panel-teanglann"
        role="tabpanel"
        aria-labelledby="tab-teanglann"
        hidden={activeTab !== 'teanglann'}
        class="px-8 py-6"
      >
        {#if t}
          <!-- Numbered senses -->
          <ol class="space-y-6">
            {#each t.senses as sense (sense.number)}
              <li class="flex gap-4">
                <span
                  class="w-5 shrink-0 pt-0.5 text-sm font-semibold leading-6 text-primary"
                  aria-label="Sense {sense.number}"
                >
                  {sense.number}
                </span>
                <div class="min-w-0 flex-1">
                  {#if sense.definition}
                    <p class="leading-6 text-foreground">{sense.definition}</p>
                  {/if}
                  {#if sense.examples.length}
                    <ul class="mt-2 space-y-1.5 pl-0">
                      {#each sense.examples.filter(e => e.irish || e.english) as ex}
                        <li class="text-sm">
                          {#if ex.irish}
                            <span class="font-serif italic text-foreground">{ex.irish}</span>
                          {/if}
                          {#if ex.irish && ex.english}
                            <span class="text-muted-foreground/60"> / </span>
                          {/if}
                          {#if ex.english}
                            <span class="text-muted-foreground">{ex.english}</span>
                          {/if}
                        </li>
                      {/each}
                    </ul>
                  {/if}
                </div>
              </li>
            {/each}
          </ol>

          <!-- Compounds grid -->
          {#if t.compoundWords.length}
            <section class="mt-10" aria-labelledby="compounds-heading">
              <h2
                id="compounds-heading"
                class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Focail ghaolmhara
              </h2>
              <div class="flex flex-wrap gap-2">
                {#each t.compoundWords as cw (cw.word)}
                  <a
                    href={cw.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onclick={() => trackEvent('compound_click', { word: cw.word, headword: hw })}
                    class="inline-flex items-center gap-1 rounded px-2.5 py-1 text-sm bg-secondary text-secondary-foreground transition-opacity hover:opacity-75"
                  >
                    {cw.word}
                    <ExternalLink size={11} aria-hidden="true" class="opacity-50" />
                  </a>
                {/each}
              </div>
            </section>
          {/if}

          <!--
            Féach freisin (see also) — structure ready for when the proxy
            exposes cross-reference headwords from teanglann's .exacts section.
          -->

          <!-- Attribution -->
          <div class="mt-10 border-t border-border pt-4">
            <a
              href="{TEANGLANN_BASE}/{encodeURIComponent(entry.word)}"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 rounded px-2 py-1 text-xs bg-secondary text-secondary-foreground transition-opacity hover:opacity-75"
            >
              teanglann.ie
              <ExternalLink size={10} aria-hidden="true" class="opacity-50" />
            </a>
          </div>

        {:else}
          <p class="text-sm text-muted-foreground">
            Níl iontráil ar fáil in Ó Dónaill don fhocal seo.
          </p>
          {#if entry.errors.find(e => e.source === 'teanglann')}
            <p class="mt-1 text-xs text-muted-foreground/50">
              {entry.errors.find(e => e.source === 'teanglann')?.message}
            </p>
          {/if}
        {/if}
      </div>

      <!-- focloir.ie panel -->
      <div
        id="panel-focloir"
        role="tabpanel"
        aria-labelledby="tab-focloir"
        hidden={activeTab !== 'focloir'}
        class="px-8 py-6"
      >
        {#if f}
          <div class="space-y-8">
            {#each groupByPos(f.senses) as group}
              <div>
                {#if group.pos}
                  <p class="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.pos}
                  </p>
                {/if}

                <ol class="space-y-5">
                  {#each group.senses as sense (sense.number)}
                    <li class="flex gap-4">
                      <span
                        class="w-5 shrink-0 pt-0.5 text-sm font-semibold leading-6 text-primary"
                        aria-label="Sense {sense.number}"
                      >
                        {sense.number}
                      </span>
                      <div class="min-w-0 flex-1">
                        <!-- Domain / register labels -->
                        {#if sense.labels.length}
                          <div class="mb-1.5 flex flex-wrap gap-1">
                            {#each sense.labels as label}
                              <span
                                class="rounded px-1.5 py-0.5 text-xs bg-secondary text-secondary-foreground"
                              >
                                {label}
                              </span>
                            {/each}
                          </div>
                        {/if}

                        <!-- English meaning -->
                        {#if sense.meaning}
                          <p class="leading-6 text-foreground">{sense.meaning}</p>
                        {/if}

                        <!-- Irish translations -->
                        {#if sense.translations.length}
                          <p class="mt-1.5 text-sm">
                            {#each sense.translations as tr, i}
                              <span class="font-serif italic text-foreground">{tr.irish}</span>
                              {#if tr.labels.length}
                                {#each tr.labels as lbl}
                                  <span class="ml-1 rounded px-1 py-0.5 text-xs bg-secondary text-secondary-foreground">{lbl}</span>
                                {/each}
                              {/if}
                              {#if i < sense.translations.length - 1}
                                <span class="text-muted-foreground">, </span>
                              {/if}
                            {/each}
                          </p>
                        {/if}
                      </div>
                    </li>
                  {/each}
                </ol>
              </div>
            {/each}
          </div>

          <!-- Attribution -->
          <div class="mt-10 border-t border-border pt-4">
            <a
              href="{FOCLOIR_BASE}/{encodeURIComponent(entry.word)}"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 rounded px-2 py-1 text-xs bg-secondary text-secondary-foreground transition-opacity hover:opacity-75"
            >
              focloir.ie
              <ExternalLink size={10} aria-hidden="true" class="opacity-50" />
            </a>
          </div>

        {:else}
          <p class="text-sm text-muted-foreground">
            Níl iontráil ar fáil ar focloir.ie don fhocal seo.
          </p>
          {#if entry.errors.find(e => e.source === 'focloir')}
            <p class="mt-1 text-xs text-muted-foreground/50">
              {entry.errors.find(e => e.source === 'focloir')?.message}
            </p>
          {/if}
        {/if}
      </div>

    </div>
  </div>
{/if}
