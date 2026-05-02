# Plan: doro-cli on Mobile

- **Feature**: Research and plan for running doro-cli on mobile devices.
- **Branch**: `feature/mobile`
- **Status**: `Research`
- **Depends On**: N/A
- **Summary**: This plan explores viable paths to bring doro-cli to mobile. It evaluates zero-code workarounds (SSH, Termux) through to medium-effort in-repo additions (web terminal server) and a longer-term PWA approach. A concrete implementation path is recommended based on effort vs. value.

---

## Context

`doro-cli` is a Node.js ≥22, `neo-blessed`-based TUI application. Its architecture has two
strengths relevant to mobile:

1. **Pure timer logic** — `src/stateMachine.ts` has zero Node.js-specific imports and can
   run in a browser or React Native environment unchanged.
2. **xterm.js + node-pty already in the repo** — both packages are listed as `devDependencies`
   (used by visual regression tests in `tests/`), so a web-terminal bridge requires no new
   production dependencies.

---

## Possible Approaches

### Option A — SSH into a Remote Host (Zero Code)

Run doro-cli on a Linux server or desktop, then connect from a mobile SSH client.

| Aspect | Detail |
|---|---|
| **Mobile SSH clients** | Termius (iOS/Android), Blink Shell (iOS), JuiceSSH (Android), Mosh for flaky connections |
| **Code changes** | None |
| **Audio** | Works if the server has audio; silent on the mobile side (acceptable for remote use) |
| **Pros** | Full feature parity, zero maintenance overhead for the project |
| **Cons** | Requires an always-on server or desktop; not fully offline/mobile-native |

**Best for**: power users with a home server or cloud VM.

---

### Option B — Termux (Android) / iSH (iOS) Native Terminal

Install Node.js inside a mobile Linux environment and run doro-cli directly on the device.

| Aspect | Detail |
|---|---|
| **Android** | Termux supports Node.js via `pkg install nodejs`. As of early 2025, Termux stable ships Node 20.x; Node 22 availability should be verified against the current Termux package index before recommending it. |
| **iOS** | iSH (Alpine Linux userspace) can run Node.js but performance is limited; not recommended for production use. |
| **Code changes** | Possibly none for core timer; audio will silently fail on Termux (acceptable). May need a `--no-audio` flag or graceful silence. |
| **Packaging** | `@yao-pkg/pkg` (already a devDependency) can produce a self-contained binary targeting `node22-linux-arm64`, removing the Node.js install requirement. |
| **Pros** | Fully offline, runs on-device, no server required |
| **Cons** | Node 22 may require Termux nightly/unstable repos (verify before documenting); audio is a no-op; small terminal size handling is assumed to work based on existing responsive design — this should be tested on a real device during implementation. |

**Best for**: Android users comfortable with a terminal.

---

### Option C — Web Terminal Bridge / `--serve` Mode (Medium Effort ★ Recommended)

Add a `--serve [port]` flag to `src/cli.ts` that starts a minimal HTTP server embedding
xterm.js and piping a `node-pty` pseudo-terminal to a WebSocket. Any device on the same
network (including a mobile phone) can open the URL in a browser and interact with doro-cli
through the full TUI.

```
doro --serve        # starts on http://localhost:7625
doro --serve 9000   # custom port
```

The server:
1. Serves a single HTML page (similar to `tests/terminal.html`) with xterm.js loaded from a CDN.
2. Opens a WebSocket; on connect it spawns `node-pty` with `doro` (no `--serve` flag) and
   bridges PTY ↔ WebSocket.
3. Resizes the PTY when the xterm.js `Terminal` fires a `resize` event.
4. Shuts down when all clients disconnect (or on SIGINT).

**Files to create/modify:**

| File | Change |
|---|---|
| `src/cli.ts` | Parse `--serve [port]` flag; call new `serve()` function |
| `src/serve.ts` | New module: HTTP + WebSocket + node-pty bridge |
| `README.md` | Document `--serve` mode |

**Dependencies needed:**

- `node-pty` — already a devDependency; promote to `dependencies`.
- `ws` — lightweight WebSocket server (~55 kB, no sub-dependencies). Note: Node.js 22 ships experimental _client-side_ WebSocket support (`--experimental-websocket`) but does not include a built-in WebSocket _server_ API. The `ws` package is required for the server side.

| Aspect | Detail |
|---|---|
| **New npm packages** | `ws` for WebSocket server (or verify if a future Node.js LTS ships a built-in server API) |
| **Audio** | Works on the server; the mobile browser receives xterm output only (no audio forwarded — acceptable) |
| **Pros** | Any browser on the LAN works (no app install on mobile); reuses existing xterm + node-pty infra; single codebase |
| **Cons** | Requires the serve host to run Node.js; LAN-only without extra tunneling (ngrok, Tailscale) |

**Best for**: users who want to use doro from mobile without a dedicated SSH client.

---

### Option D — Progressive Web App (High Effort, Long-term)

Port `src/stateMachine.ts` (which has zero Node.js imports) and the audio synth logic into a
standalone React/Vite PWA. The PWA runs entirely in the browser, installs to the home screen,
and works fully offline via a service worker.

| Aspect | Detail |
|---|---|
| **Reusable today** | `src/stateMachine.ts`, `src/constants.ts`, `src/audio/synth.ts` |
| **New work** | Mobile-first UI (replaces `neo-blessed`); service worker; push/local notifications for timer end |
| **Audio** | Web Audio API — programmatic synthesis identical to the current approach |
| **Pros** | True native-feel mobile app; fully offline; can use iOS/Android home screen install |
| **Cons** | Largest scope; diverges from the CLI as a separate product; ongoing maintenance |

**Best for**: a future v2 companion app.

---

## Recommendation & Phased Plan

| Phase | Approach | Effort | Value |
|---|---|---|---|
| **Now** | Document SSH + Termux paths in `README.md` | XS | High (immediate user value) |
| **Short-term** | Implement `--serve` mode (Option C) | M | High (LAN mobile access without extra tools) |
| **Long-term** | Evaluate PWA (Option D) as a separate repository | XL | Very High (true mobile app) |

---

### Checklist

- [ ] **(Mandatory)** Add "Mobile / Remote Access" section to `README.md` documenting SSH and Termux paths.
- [ ] **(Mandatory)** Create `src/serve.ts` — HTTP + WebSocket + node-pty bridge for `--serve` mode.
- [ ] **(Mandatory)** Update `src/cli.ts` to parse `--serve [port]` and invoke `serve.ts`.
- [ ] **(Mandatory)** Promote `node-pty` from `devDependencies` to `dependencies` in `package.json`.
- [ ] **(Optional)** Add graceful audio-fallback / `--no-audio` flag to support Termux where audio APIs are unavailable.
- [ ] **(Optional)** Open a tracking issue for the PWA companion app (Option D) as future work.
- [ ] **(Mandatory)** Verify changes by running the type checker and unit tests.
