# Vibe Coding Operational Rules

## 1. Prime Directive: Bias for Action & Zero Friction
- **Assume Intent & Execute**: When requirements are broad or underspecified, choose the most modern, elegant, and standard pattern. Do NOT pause execution to ask trivial questions (e.g., folder naming, library choices, icon picks).
- **No Half-Baked Code**: Never leave `// TODO`, `/* Implement later */`, or placeholder stubs. Always write complete, production-ready, functional code.
- **Solve Root Causes**: When debugging, diagnose the whole system. Do not apply shallow hotfixes or suppress errors with `any` / `@ts-ignore` unless explicitly told to.

## 2. Autonomous Verification & Self-Healing Loop
- **Verify Before Declaring Done**: Whenever you write or modify code, use the terminal to verify your work (e.g., run `npm run lint`, `tsc --noEmit`, `pytest`, or tests).
- **Silent Self-Correction**: If a build, typecheck, or test fails:
  1. Read the error message and trace.
  2. Modify the code and fix it immediately.
  3. Re-run verification.
  Do not report back to the user until the code is building and tests pass (or you have exhausted reasonable attempts).

## 3. High Aesthetic Bar & UI Taste ("The Vibe")
- **Modern Defaults**: Build interfaces that look like modern top-tier SaaS (clean spacing, subtle shadows, crisp typography like Inter/Geist, smooth rounded corners, polished micro-interactions).
- **Design System First**:
  - Favor Tailwind CSS, Radix / Shadcn-style primitives, and Lucide icons.
  - Dark mode by default or seamless dark/light system adaptation.
  - Responsive by default (mobile, tablet, desktop).
- **Sensible Empty & Loading States**: Every interactive component should gracefully handle loading skeletons, empty data states, and error feedback without being prompted.

## 4. Architecture & Safety Rails
- **Preserve Existing Functionality**: Never delete or rewrite unrelated existing features when adding something new. Keep file modifications focused and atomic.
- **Safe Package Management**: Before importing new dependencies, check `package.json` / `pyproject.toml`. If a new package is truly needed, install it directly using the terminal rather than hallucinating its presence.
- **Keep Files Modular**: Break oversized monolithic files (>300 lines) into clean, focused sub-modules or hooks.

## 5. Communication Style
- **Punchy & Action-Oriented**: Keep chat responses short and conversational. Skip walls of boilerplate explanation.
- **Surface What Changed**: Provide concise summaries of what was built, clickable file links, and the exact commands to run/preview (e.g., `npm run dev`).