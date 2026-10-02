# SportScout Voice

Existing React/Vite prototype updated for court geometry, confirmed-data integrity, event validation and score replay. Visual theme and navigation are retained.

## Run

`npm ci` then `npm run dev` starts the frontend. `npm run dev:server` starts the optional Node/Express interpreter server with Vite middleware. Server configuration belongs in `.env`: `GEMINI_API_KEY` and `GEMINI_MODEL`. Neither value is bundled into the browser. Do not use `VITE_` secret names.

The published Sites version is a static frontend. Hosted Gemini interpretation, Gemini Live transcription and AI coach summaries are **NOT AVAILABLE**. Text entry and experimental local rule extraction work without a cloud key. Every locally extracted event requires human review before entering official statistics or scoring. Browser SpeechRecognition support and Bluetooth routing vary by browser/device and have not been device-tested.

Data is local to the browser (localStorage with IndexedDB mirroring); there is no server account or cross-device sync.

## Verify

- `npm run lint`: TypeScript `--noEmit`
- `npm test`: deterministic node:test suite
- `npm run build`: production frontend

See `AUDIT.md` for the implementation and verification boundaries.

## Thai UI and working transcription
UI defaults to Thai; TH/EN and Settings > Website language switch presentation independently of spoken-language settings. Canonical action/zone values remain English in storage and exports.

Microphone access requires HTTPS (or localhost), browser permission, and real audio hardware. Settings can discover microphones and choose an input. Browser recognition requires a supported SpeechRecognition implementation and network access to its speech service. It needs no app API key; the OS/browser can choose a different mic than MediaRecorder. Stop waits for asynchronous final recognition. Gemini mode sends actual recorded audio after release, not realtime streaming.

### Enable cloud features
Create a key at https://aistudio.google.com/apikey. Configure `GEMINI_API_KEY` as a **server-side Sites secret** through Sites environment variables. Never paste it into the frontend, localStorage, or a VITE_ variable. `GEMINI_MODEL` and `GEMINI_AUDIO_MODEL` optionally select an accessible model (default gemini-3.8-flash). Provider quota/billing and model availability depend on the Google account. Click Settings > Test Gemini connection for a real provider request.

The deployed Worker serves the existing UI and `/api/health`, `/api/transcribe`, `/api/interpret`, `/api/coach-summary`, `/api/verify-provider`. A missing key is visible; local review and recorded-statistics summaries still work. Interpretation cannot silently confirm invalid AI values.

Local development: `npm install`, copy `.env.example` to `.env`, optionally set a key, then `npm run dev:server`. Production: `npm run build`; outputs a Worker with public assets, no embedded secrets. `npm run dev` is UI-only.

### Verification for this phase
TypeScript, production build, and 30 automated tests cover deterministic parsing/replay/heatmap, Thai SSR, no-key API behavior, mocked provider payload/transcription, delayed speech final results, and cancelled permission startup. These do not verify real hardware, actual browser speech services, Gemini credentials, quota, or spoken-language accuracy. Device and live-provider tests are still required.

### API key entry
Settings now has a password field and “Test and save key”. Only the configured owner (server `SETTINGS_OWNER_EMAIL`, compared with the platform's authenticated email) can update it. A real provider request must succeed before replacing the existing key. D1 stores only AES-GCM ciphertext; `KEY_ENCRYPTION_SECRET` is a separate server secret. Health returns configuration state, never the key. The initial server `GEMINI_API_KEY` is the fallback until a verified settings key is saved. Keys are never placed in browser storage or build output. Encryption-secret rotation requires re-encrypting the stored record or clearing it and re-entering a key.

This phase passes 32 automated tests. A real provider request using the supplied key succeeded (HTTP 200); no real microphone/device transcription test was performed.

### Provider overload fix
2026-09-30: production calls failed with generic provider errors. An exact JSON-generation request to gemini-3.8-flash returned HTTP 503 UNAVAILABLE (high demand), while gemini-3.5-flash succeeded. Production text/audio model settings switched to gemini-3.5-flash. Requests retry HTTP 500/502/503/504 at most twice within a shared 43-second timeout. Authentication/client errors do not retry. UI now shows sanitized provider status/message rather than treating every error as an invalid key. 34 automated tests cover overload recovery and secret redaction.

Production verification after model change: hosted `/api/health`, `/api/verify-provider`, and `/api/interpret` returned HTTP 200; interpretation produced one event for `A หยอดได้แต้ม`. A synthetic silent PCM WAV exposed a hallucinated transcript, so the server now detects digitally silent PCM WAV and returns an empty transcript without calling AI. Microphone capture also suppresses cloud transcription if measured audio is exactly digital silence. This does not guarantee no hallucination in noisy recordings or verify real-device speech accuracy. 35 automated tests pass.

### Recovery from ongoing provider outages
A primary model's transient 5xx response switches the next attempt to the configured `GEMINI_AUDIO_FALLBACK_MODEL` / `GEMINI_FALLBACK_MODEL`, within the existing attempt/time limits. Final provider failure logs HTTP status and model only. Failed audio is retained in page memory for explicit retry or download (cleared on refresh/new recording); retries require event review. A cloud failure can use an actual final browser-recognition transcript, with an explicit warning and mandatory event review. It never invents a transcript. Error text wraps instead of truncating on mobile. 37 tests cover model failover and preserving recorded bytes. Model availability remains an external dependency; these changes cannot guarantee uptime.

### Scouting vocabulary, confirmation and delay fixes
AI interpretation now receives a shared sport-specific vocabulary and rules before every request: Thai A/B aliases, skill synonyms, origin/target cues, self-corrections, and single-point scoring phrases. Unknown actors remain unknown. The local fallback also recognizes เอ/ทีมเอ, บี/ทีมบี, ตำแหน่ง/จาก, spaced + 1 and บวกหนึ่ง. Rules are shipped with the app, not a separately trained model.

Auto transcription now uses a real final browser transcript first, skipping the recorded-audio cloud request when available. Explicit Gemini mode continues to transcribe actual audio. This removes one cloud stage on supported browsers, but does not guarantee device or provider latency.

The scoreboard reads confirmed-event replay directly. Edits expose a point preview and Save and confirm. Rejected confirmations return validation reasons instead of silently downgrading. Confirmed review events store `confirmedAt`; score replay uses acceptance time so a reviewed point accepted after a manual baseline adds once, while the original observation timestamp stays intact. Edit/delete recompute replay and event score snapshots.

Regression tests cover actual React context flow (unknown actor -> edit -> confirm -> board 1 -> switch actor -> delete), Thai spoken aliases and corrections, baseline replay, and automatic speech without audio upload. Browser/device latency still needs field measurement.

### Fast path for unambiguous commands
A closed, fully anchored vocabulary grammar handles explicit A/B aliases + one known action + optional explicitly directed zones + explicit point phrases locally. It validates every event, emits an accurately labelled RULES provider (no AI confidence or request), and can update confirmed scoring immediately. Unknown actors, negative/contradictory phrasing, corrections, ambiguous placements, extra words and multiple actions fall through to AI. The user example is covered by a real React flow test which asserts zero inference requests and A score 1. Complex AI interpretation now uses gemini-3.5-flash-lite first, with Flash fallback; one live interpretation of the example took about 11 seconds, versus about 41 seconds when waiting for Flash first. These individual calls do not establish device latency guarantees.
