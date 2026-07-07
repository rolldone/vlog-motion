# Concept: Interactive Video Dashboard

> **Status:** Draft  
> **Created:** 2026-07-06

## Overview

Dashboard full-screen tempat user bisa "memainkan" video yang sudah di-edit di CapCut sambil berinteraksi dengan UI overlay (menu, gallery, inventory, dll). User merekam seluruh session pakai **OBS** → hasilnya jadi video final untuk penonton.

## Goal

Menciptakan experience seperti **interactive movie / game-like video** di mana penonton bisa:
- Menonton video
- Klik tombol/layar untuk trigger event
- Melihat gallery, inventory, mini browser, dll
- Semua itu terasa seperti bagian dari cerita video

## Workflow

```
┌─────────────────────────────────────────────────────┐
│  STEP 1: CapCut                                     │
│  ─────────────────────                               │
│  - Edit video jadi satu file final                  │
│  - Export sebagai .mp4                              │
│  - ✅ Output: file .mp4 (ini yang dipakai step 2)   │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│  STEP 2: Interactive Dashboard                     │
│  ─────────────────────                               │
│  - Load file .mp4 dari step 1                       │
│  - Tambahkan UI overlay interaktif                  │
│  - User record session pakai OBS (screen recording)  │
│  - Output: video final (.mp4)                       │
└─────────────────────────────────────────────────────┘
```

> Step 1 dan Step 2 terpisah. Step 1 hanya menghasilkan file .mp4. Step 2 hanya menerima file .mp4 sebagai input — tidak ada integrasi langsung dengan CapCut.

## Architecture

```
┌──────────────────────────────────────────────┐
│            Interactive Dashboard             │
│  ┌────────────────────────────────────────┐  │
│  │     Video Player (background)          │  │
│  │     - mp4 from CapCut                  │  │
│  │     - Auto-play, loop, synced          │  │
│  └────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────┐  │
│  │     UI Overlay Layer                   │  │
│  │     - Navigation menu                  │  │
│  │     - Gallery viewer                   │  │
│  │     - Inventory panel                  │  │
│  │     - Mini browser                     │  │
│  │     - Interactive buttons              │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│     OBS (External)                          │
│  - Record entire screen                      │
│  - Output: .mp4 final                        │
│  - User controls recording manually          │
└──────────────────────────────────────────────┘
```

## Components

### 1. Video Player
- Full-screen video background
- Format: `.mp4` from CapCut
- Controls: play, pause, seek, volume
- Mungkin butuh **sync mechanism** — video time harus sinkron dengan interaksi

### 2. UI Overlay
- Transparan di atas video
- Navigation menu (sidebar / floating)
- Halaman-halaman: Gallery, Inventory, Mini Browser, dll
- Setiap halaman punya komponen sendiri
- Transisi antar halaman (bisa pakai animation)

### 3. OBS Recording (External)
- User buka OBS → record screen
- Play dashboard di full screen
- Interaksi ter-record semua
- Output: .mp4 final yang siap upload

> Tidak ada replay system — dashboard hanya untuk playback + interaksi. Recording dilakukan di luar (OBS).

## Use Cases

### Content Creator (kamu)
1. Edit video di CapCut → export .mp4
c2. Load .mp4 ke dashboard
3. Build UI overlay (tombol, menu, halaman)
4. Buka OBS → record screen
5. Play dashboard, interaksi, stop recording
6. Upload hasil rekaman OBS → publish

### Penonton
1. Menonton video hasil rekaman OBS
2. Lihat interaksi dengan gallery, inventory, dll
3. Rasanya seperti "main game" atau "interactive movie"

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | React + TypeScript (existing) |
| Video | HTML5 `<video>` element |
| Overlay | React components (absolutely positioned) |
| Recording | OBS (external screen recorder) |
| State | Zustand / React Context |
| Animation | Framer Motion / CSS transitions |

## Open Questions

- [ ] Apakah ada "trigger points" di video yang tentukan kapan UI muncul?
- [ ] Apakah dashboard butuh play/pause controls atau auto-play?
- [ ] Bagaimana workflow OBS recording — fullscreen atau windowed?
- [ ] Apakah butuh backend atau cukup client-side?

## Milestones

1. **MVP** — Load video + basic overlay + simple button click
2. **Record** — Tambahkan rrweb recorder
3. **Replay** — Playback recorded session
4. **Polish** — Animations, transitions, UI refinement
5. **Publish** — Export / deploy dashboard
