# mIF Explorer

A browser-based explorer for multiplexed immunofluorescence (mIF) imaging metadata in the [Human Tumor Atlas Network](https://humantumoratlas.org) (HTAN). It answers the question researchers keep asking: *which HTAN images contain the markers I care about, in the tissue I care about?*

> **Status: prototype.** Built in a few days at the Sage Bionetworks **Home Week hackathon, autumn 2025**. It is a proof of concept, not a maintained product. The data snapshot is frozen, there are no tests, and the code has not been reviewed for production use. It is published here so the idea and the approach are not lost.

---

## What it does

HTAN imaging metadata is spread across file manifests, antibody panel definitions, and marker annotations. Individually each table is legible; together they are hard to query without writing code. mIF Explorer joins them client-side and puts four views over the result:

| View | What it shows |
|------|---------------|
| **Dashboard** | Corpus summary — file counts by centre, by diagnosis, by assay type |
| **File Explorer** | Filterable file manifest, each row linked to its participant, panel and Synapse entity |
| **Panel Explorer** | Antibody panels and their targets, with the files acquired using each panel |
| **Antibody Explorer** | Marker library — protein name, UniProt ID, function, subcellular location, functional category — with the panels and files each marker appears in |

Filters compose across all of it: pick a diagnosis, a centre, an assay type, an antibody, or a marker category and the other views narrow to match.

Alongside those is a **conversational interface** (Gemini, via function calling) that translates biological questions into filter queries. Ask *"which panels let me see NK cells?"* and it identifies the canonical markers from the model's own knowledge, then checks which of those actually exist in the HTAN panels and reports back with the panel IDs. The tools exposed to the model are `filter_files`, `search_library`, and `find_panels` — the model reasons about biology, the dataset answers about itself.

## The data

A frozen snapshot taken during the hackathon, in `data/`:

- **5,995 image files** across **566 participants**
- **713 antibody panels**
- **346 antibody targets**, 324 of them annotated with protein name, UniProt accession, function and subcellular location
- **13 HTAN centres** — BU, CHOP, DFCI, Duke, HMS, HTAPP, MSK, OHSU, Stanford, Vanderbilt, WUSTL, TNP-TMA, TNP-SARDANA
- **11 assay types** — CODEX, CyCIF, t-CyCIF, MxIF, mIHC, IMC, MIBI, SABER, GeoMX-DSP, RareCyte Orion, H&E
- **25 diagnoses**

`*_small.json` variants are trimmed fixtures useful for development. This is metadata only — no pixel data. Files are identified by their Synapse entity ID (`entity_id`); the images themselves live in HTAN's Synapse projects and are governed by HTAN's data access terms.

Because the snapshot is frozen, counts here will diverge from live HTAN. Treat it as an illustration of what the interface can do, not as an authoritative index.

## Architecture

The interesting part is that there is no backend. The whole corpus loads into the browser at startup and is indexed in memory:

```
data/*.json ──► DataService ──► inverted indexes ──► SearchService ──► React views
                               (diagnosis, centre,     (set intersection)
                                assay, panel, antibody)
```

`services/dataService.ts` builds one inverted index per filter dimension — `Map<value, Set<file>>` — at load time. `services/searchService.ts` then resolves a multi-dimensional filter by unioning within each dimension and intersecting across them, always iterating the smaller set. Filtering is proportional to the size of the result, not the size of the corpus, which is what keeps the UI responsive as filters are toggled.

```
App.tsx                    view switching
components/                Dashboard, FileExplorer, PanelExplorer, AntibodyExplorer, ChatInterface, Layout
hooks/useData.tsx          loads and exposes the corpus
hooks/useFilters.tsx       shared filter state
services/dataService.ts    fetch + index construction
services/searchService.ts  set-intersection filtering, stats, library search
services/geminiService.ts  Gemini chat with function calling into the search layer
data/                      frozen metadata snapshot
types.ts                   shared types
```

React 19, TypeScript, Vite, Recharts, Tailwind (via CDN).

## Running it

**Prerequisites:** Node.js 20+

```bash
npm install
cp .env.local.example .env.local   # then add your key, or edit .env.local directly
npm run dev                        # http://localhost:3000
```

Set `GEMINI_API_KEY` in `.env.local` to a [Google AI Studio](https://aistudio.google.com/apikey) key. The four data views work without it; only the chat interface needs it.

The key is inlined into the client bundle at build time by `vite.config.ts`, which is fine for local use and **not** acceptable for a public deployment. Anything hosted would need the model call proxied through a server that holds the key.

## Known limitations

These are the rough edges a prototype is allowed to have, recorded so nobody rediscovers them:

- `npm run build` does not produce a working bundle — the JSON in `data/` is fetched at runtime but is not in `public/`, so Vite will not copy it into `dist/`. Dev server only.
- `index.html` links a `/index.css` that does not exist; styling comes entirely from the Tailwind CDN script.
- The snapshot has small integrity gaps: 13 repeated `file_id` values, and one `panel_id` referenced by the manifest that has no panel definition. Files under that panel contribute to file counts but expose no targets.
- The Gemini API key is client-side (see above).
- No tests.

## Where it could go

The hackathon scope was deliberately narrow. The directions that seemed most worth taking further:

- Read live from the HTAN Synapse tables or BigQuery instead of a frozen snapshot
- Normalise markers to a shared vocabulary so equivalent targets across centres collapse into one entity
- Reconcile channel names against target names — the panel metadata carries both, and they disagree in interesting ways
- Cross-panel comparison: given a cell type, which centres could in principle detect it, and which have
- Thumbnails or a Minerva link per file, so the interface reaches the images rather than stopping at the metadata

## Credits

Prototyped at the Sage Bionetworks Home Week hackathon, autumn 2025, using HTAN imaging metadata. HTAN is supported by the National Cancer Institute; see the [HTAN Data Portal](https://humantumoratlas.org) for data access terms and the [publication guidelines](https://humantumoratlas.org/data-access) that apply to its data.
