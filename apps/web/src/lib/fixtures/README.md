# Fixtures

Raw HTML snapshots from teanglann.ie and focloir.ie captured during selector validation.
Used for regression testing — if parsers break after a site redesign, run against these
files first to isolate whether the issue is a selector change or a network problem.

## Structure

```
fixtures/
  teanglann/<word>.html   — https://www.teanglann.ie/en/fgb/<word>
  focloir/<word>.html     — https://www.focloir.ie/en/dictionary/ei/<word>
```

## Words validated (25)

cat, bád, beir, fear, bean, teach, lámh, ceol, bia, leabhar, scoil, uisce, tír,
oíche, lá, bóthar, grian, gaoth, cloch, rí, abair, déan, mór, beag, fada

## Known selector fragility

### teanglann.ie (`TeanglannService`)

| Pattern | Example words | Notes |
|---|---|---|
| Definition in `span.fgb.trans` | cat, beir, bean | Standard — works reliably |
| Definition in bare `span.fgb.r` (no `.trans` wrapper) | lámh sense 2, scoil sense 2 | Fixed: bare `.r` handler added |
| General gloss before first sense number | scoil ("School."), lámh ("Hand, arm.") | Fixed: prelude definition carried into sense 1 |
| No definition at all — entry-by-example only | uisce sense 2, fada senses 2–3, lámh sense 15, beag sense 3 | Known gap; `definition` field will be `""` |
| Sense numbers inside `span.fgb.example` | cat senses 2–3 | Fixed: embedded-sense detection |
| Category label as only sense descriptor | bean sense 4 ("Toilet") | Fixed: `.fgb.c` tip title used as definition |

### focloir.ie (`FocloirService`)

| Pattern | Example words | Notes |
|---|---|---|
| Translations in `div.trcnt > div.trgp` | cat, bean | Standard — works reliably |
| Translations wrapped in `span.fwkstrcnt` | teach, fear senses 5–7 | Fixed: removed direct-child `>` selector |
| Sense with no `span.sensenum` | fada | Fixed: auto-incremented fallback number |
| 307 redirect to `/spellcheck/` | any unknown word | Detected via `maxRedirects: 0` |
| Irish-only words absent from NEID | bád, beir, lámh, … | Expected — focloir is EN→GA only |

## Re-capturing fixtures

```bash
# From the monorepo root
npm run dev:proxy   # port 3001

# Then re-run the capture script (apps/proxy/scripts/capture-fixtures.ts)
```

## Running parsers against fixtures

The fixtures are plain HTML files — feed them directly to the service `parse()` methods
in unit tests to avoid live network calls during CI.
