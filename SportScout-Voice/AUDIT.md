# SportScout Voice phase audit — 2026-09-30

## REAL IMPLEMENTED

- Badminton geometry: 1340 × 610 at 100 SVG units/m; singles sidelines y=46/564; net x=670; short service lines x=472/868; doubles long service lines x=76/1264; service centre lines restricted to service courts; 4-unit markings. FIVB court: 1800 × 900, centre x=900, attack-line rear edges x=600/1200, 5-unit markings. References: BWF Laws section 4.1 Diagram A and FIVB Official Rules 2025–2028 rules 1.1/1.3.
- Court SVG preserves aspect ratio; each sport has its own physical dimensions. Official lines and optional low-opacity dashed scouting overlays are separate. Court View renders no analytical guides. Net is identified separately in badminton.
- Canonical zones are actor-facing-net. Side A/scout: A left, B right. Side B view rotates only the display by 180 degrees; data is not modified. Voice zones remain zone evidence; centroid markers are never represented as measured coordinates.
- Independent badminton origin/target and volleyball serve-target, attack-origin/target and reception-origin aggregation. Heatmap requires CONFIRMED status and structurally valid events, excludes correction records, separates both court sides and exposes source event IDs. Unknown zones are omitted. Mapped X/Y counts only eligible confirmed events for the selected mode and filters.
- Trajectories require both real, valid zone endpoints and expose source event IDs. All filters apply to the same event list as density.
- Canonical actions/zones and integer reception quality 0–3 are validated. Missing actors stay unknown. Invalid values are retained for review, never clamped or converted into plausible values. Manual confirmation and edits pass the same validation as AI responses. The editor supplies legal vocabulary and an explicit unknown option.
- A single utterance yields ordered events sharing one rally ID. Newest-first storage reverses each extracted batch deliberately for chronological score replay. Local rule extraction handles all six requested test inputs plus the three-shot badminton example; it always requires review.
- Scores/game/set state are replayed from valid confirmed scoring events and explicit SCORE_CORRECTION records. Manual score adjustment appends an auditable correction snapshot with a reason. Undo/edit/delete recalculate official state; displayed event score and segment snapshots are derived again. One rally cannot award two points. Corrections never enter sporting statistics or heatmaps.
- Badminton attempts/winners/errors/in-play/rally count/action and spatial distributions; volleyball serve/ace/error, reception 0–3, attacks/kills/errors/blocked attacks, efficiency, successful block events and digs derive from confirmed records. Skill counters are derived rather than maintained by incremental bookkeeping.
- Fresh sessions contain no fake matches/events/transcripts. Explicit Load Demo remains available and labels demo sessions. Onboarding's optional simulated cycle is labelled DEMO and does not write match data. Developer text benchmarks use actual interpreter output and measured processing time, require manual accuracy evaluation and do not write into the current match.
- Removed fake device labels, unsafe actor defaults, hardcoded semantic confidence, random runtime scouting values, manufactured benchmark counts/latency, fake live session tokens and fabricated coaching narrative. Sample preset text is only explicit sample content and never an automatic speech fallback.
- Push-to-talk suppresses context menus, disables touch callout, uses pointer capture and ignores non-primary mouse buttons. Text entry provides a fallback when speech is unavailable.
- Optional Node server accepts a server-only Gemini key/model and validates interpretation output. This provider code is not verified with a real key and is not deployed with the static Sites frontend.

## STILL DEMO / EXPERIMENTAL / NOT AVAILABLE

- Explicit demo sessions and onboarding animation: DEMO.
- Local Thai/English rule extraction: EXPERIMENTAL; deterministic examples tested, general natural speech not verified. Human review is mandatory.
- Hosted Gemini interpretation, Gemini Live and AI coach summary: NOT AVAILABLE. No provider credentials supplied. No cloud model accuracy or cloud transcription claim.
- Node server provider integration: CONFIGURABLE, NOT VERIFIED against live provider.
- Browser microphone recognition: EXPERIMENTAL, device testing required. No claim of Bluetooth low latency or automatic AirPods integration.

## KNOWN BROWSER LIMITATIONS

- SpeechRecognition availability varies by browser; may require online browser-provider recognition and secure-context microphone permission. It is not guaranteed offline.
- Browser recognition may use the browser/OS-selected microphone rather than the separate getUserMedia stream used for the level meter; routing must be tested. Bluetooth profiles can change audio quality.
- Very short holds can end before microphone permission/startup completes; initial permission should be granted before field use. Browser speech finalization may differ by engine.
- Local storage is device/browser specific and may be cleared. This prototype does not provide cross-device sync.

## ACTUALLY VERIFIED

- TypeScript check and production build passed.
- Deterministic automated tests: all specified example utterances, multi-event single-rally assignment, unknown actors/endpoints, invalid AI reception quality rejection, status exclusion, all six heatmap modes, traceability, empty counters, corrections/edit/delete/undo replay, game/set thresholds and volleyball efficiency.
- React server rendering smoke checks cover initial empty UI and both court SVGs. These are not browser interaction tests.
- Supervised development preview starts successfully after preserving a direct Vite dev script and an optional separate Node-server script.
- No interactive cloud-browser QA: the required control-browser skill is unavailable in this environment.
- Published deployment success is checked via Sites deployment status before handing off its URL.

## REAL DEVICE TESTS REQUIRED

- Android Chrome / actual Samsung A06 and OPPO A74: microphone permissions, final transcript on release, repeated holds, interrupted pointer gestures and portrait/landscape layouts.
- Desktop browsers and iOS Safari: support detection and text-entry fallback; zoom and touch target checks.
- Built-in, wired/USB and actual Bluetooth/AirPods microphones: device discovery, OS routing, disconnection, noise and latency.
- Real court-side Thai speech, player names, action/zone self-corrections and long rally utterances; human-labelled comparison against real Gemini output when credentials are configured.

No unrelated redesign or product expansion was performed.
