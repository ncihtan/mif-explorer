# mIF Explorer

A browser-based explorer for multiplexed immunofluorescence (mIF) imaging metadata in the [Human Tumor Atlas Network](https://humantumoratlas.org) (HTAN). It answers the question researchers keep asking: *which HTAN images contain the markers I care about, in the tissue I care about?*

> **Status: prototype.** Built in a few days at the Sage Bionetworks **Home Week hackathon, autumn 2025**. It is a proof of concept, not a maintained product. There are no tests and the code has not been reviewed for production use. It is published here so the idea and the approach are not lost.

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

In `public/data/`, generated from HTAN Release 7.0:

- **5,982 image files** across **566 participants**
- **616 antibody panels** with curated targets, of **714** the release references
- **621 markers**, 474 of them carrying protein name, UniProt accession, function and subcellular location
- **13 HTAN centres** — BU, CHOP, DFCI, Duke, HMS, HTAPP, MSK, OHSU, Stanford, Vanderbilt, WUSTL, TNP-TMA, TNP-SARDANA
- **11 assay types** — CODEX, CyCIF, t-CyCIF, MxIF, mIHC, IMC, MIBI, SABER, GeoMX-DSP, RareCyte Orion, H&E
- **24 diagnoses**

`*_small.json` variants are trimmed fixtures useful for development. This is metadata only — no pixel data. Files are identified by their Synapse entity ID (`entity_id`); the images themselves live in HTAN's Synapse projects and are governed by HTAN's data access terms.

### Where it comes from

These files are built by [`ncihtan/channel-metadata-agent`](https://github.com/ncihtan/channel-metadata-agent), stage 3.1:

```
BigQuery (entities_v7_0 ⋈ ImagingLevel2 ⋈ Diagnosis) ──► manifest
Synapse channel metadata ──► curated markers ──► panels
UniProt ──► library
```

The manifest is re-queried on each run, so file counts track the release rather than a hackathon snapshot. Marker curation is frozen in that repo, and `public/data/coverage_report.json` records how much of the release it covers: currently 98 panels (736 files) have no curated markers, because the curation pipeline skipped the tab-delimited channel metadata files. Those files appear in the manifest and contribute to counts, but expose no targets.

Each marker carries its type in `categories` — `protein_single`, `cd_marker`, `nuclear_marker`, `chemical_stain`, `blank_or_background` and so on — so blanks and stains are filterable apart from real protein targets.

To regenerate, run stage 3.1 in that repo and copy `explorer_data/*.json` into `public/data/`.

## Architecture

The interesting part is that there is no backend. The whole corpus loads into the browser at startup and is indexed in memory:

```
public/data/*.json ──► DataService ──► inverted indexes ──► SearchService ──► React views
                                        (diagnosis, centre,    (set intersection)
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
public/data/               generated metadata, see above
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

- 98 of the 714 panels the release references have no curated markers, so 736 files show no targets. Tracked in [channel-metadata-agent#1](https://github.com/ncihtan/channel-metadata-agent/issues/1).
- `index.html` links a `/index.css` that does not exist; styling comes entirely from the Tailwind CDN script.
- The Gemini API key is client-side (see above).
- No tests.

## Where it could go

The hackathon scope was deliberately narrow. The directions that seemed most worth taking further:

- Query BigQuery from the app rather than regenerating static JSON, so the views track the release directly
- Reconcile channel names against target names — the panel metadata carries both, and they disagree in interesting ways
- Cross-panel comparison: given a cell type, which centres could in principle detect it, and which have
- Thumbnails or a Minerva link per file, so the interface reaches the images rather than stopping at the metadata

## Credits

Prototyped at the Sage Bionetworks Home Week hackathon, autumn 2025, using HTAN imaging metadata. HTAN is supported by the National Cancer Institute; see the [HTAN Data Portal](https://humantumoratlas.org) for data access terms and the [publication guidelines](https://humantumoratlas.org/data-access) that apply to its data.
