# SportScout Voice

React/Vite sports scouting for badminton and volleyball. Thai and English speech use a shared, editable vocabulary first; uncertain or complex phrases can fall back to Gemini. Rules confirm only complete, legal observations. Low provider word confidence or interrupted audio requires review.

## Run and verify

```sh
npm ci
npm run dev:server
npm run lint
npm test
npm run check:vercel-api
npm run build:vercel
```

The Node development server binds to 127.0.0.1:3000. Set HOST explicitly to expose it on a network. `npm run dev` alone starts only Vite; API calls require the server. `npm run build` preserves the original worker build for the previous hosting platform.

## Vercel

Import `Blubadin/SP-Voice-`, choose root `SportScout-Voice`, and use the committed `vercel.json`. The static output is `dist/client`; `api/[...path].ts` adapts the shared API to a Node function. The PCM worklet remains a public JavaScript asset. No database or secret is required for local rules and supported browser recognition.

For cloud features, enter your own Gemini or Deepgram key in Settings. Verification happens server-side. On Vercel without a database, the key stays in page memory until reload; it is never persisted to localStorage or returned by the API. Deepgram receives a short-lived grant for the browser WebSocket. Gemini and Deepgram are separate services and keys.

Optional server secrets: GEMINI_API_KEY, DEEPGRAM_API_KEY, GEMINI_MODEL, GEMINI_AUDIO_MODEL and fallback model names. On Vercel shared credentials require SCOUT_ACCESS_TOKEN as a Bearer authorization header. Public users can use their own keys instead. Do not put secrets in VITE_ variables. Vercel ignores caller-supplied owner-email headers; encrypted owner-managed storage is only available on the original trusted platform with DB, KEY_ENCRYPTION_SECRET, SETTINGS_OWNER_EMAIL and TRUST_PLATFORM_IDENTITY=true.

Expensive API requests have a bounded per-instance limit (60/minute/client). This is a warm-instance safeguard, not a globally coordinated quota; for an account-wide public service, use a distributed limiter or platform firewall. Interpretation has a six-second provider budget and eight-second client timeout. Recorded audio retains the longer provider budget.

## Correctness and speed

- All final speech mutations share one ordered queue. AI, local rules, split action/outcome speech and later self-corrections use the same rally lifecycle. Explicit “แรลลี่ใหม่”, “แต้มต่อไป” or “next rally” separates rallies.
- A single sorted score replay produces the board and every event snapshot. A rally scores once; reviewed events affect scores only after confirmation. Manual +1 uses ordinary set and match transitions. Manual negative adjustments are explicit score baselines.
- Match format is applied: badminton 21 with cap30, best-of-three 11 with win-by-two and no cap, single30 with cap30; volleyball best-of-five or best-of-three, deciding set15, win-by-two.
- Custom skill aliases reach local extraction, AI vocabulary and speech hints; disabled skills leave the local dictionary. Conflicting aliases are rejected.
- Inline outcome corrections use the latest explicit correction; source and target zones stay separate. Setter/libero role words do not create extra contacts.
- PCM uses 1024-sample packets (about21ms at48kHz), drains the partial tail and waits for provider finalization. Reconnects and lost buffers are visible and require review. No confidence value is presented as measured accuracy.
- Session storage has independent localStorage/IndexedDB writes, waits for transactions, recovers the newer timestamped snapshot and deletes removed sessions from the mirror. Both failing shows an export warning. Data remains local; there is no cross-device sync.
- Secondary tabs load on demand. Text Test Lab uses scenario labels for accuracy denominators, reports N/A without samples, and does not claim to measure microphone latency.

The Vercel build also compiles the API to JavaScript and invokes it using native Node ESM without tsx. Relative runtime imports use `.js` specifiers so production can resolve every module.

## Limits of verification

Automated tests use real React context flows with mocked providers, PCM transports and provider responses. They do not measure Thai speech accuracy, noisy-court latency, Bluetooth routing or physical microphones. Browser recognition uses the operating system's microphone selection; the selected app device controls Deepgram/recorded audio. For field validation, record utterance-end-to-score time and compare transcript/event/score against annotated real audio; retain review for uncertain speech.
