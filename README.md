# Stadium IQ — FIFA World Cup 2026 Smart Stadium Operations

A GenAI-enabled smart stadium operations platform designed for the **FIFA World Cup 2026**, built with React 19, Vite, Tailwind CSS v4, and Google Gemini 1.5 Flash. Real-time crowd management, AI multilingual assistance, volunteer dispatch, transportation coordination, and sustainability monitoring.

## Problem Statement Alignment

**Smart Stadiums & Tournament Operations** — This solution enhances stadium operations and the overall tournament experience for fans, organizers, volunteers, and venue staff by leveraging Generative AI across every dimension:

| Requirement                    | Implementation                                                                                                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **GenAI-enabled**              | Google Gemini 1.5 Flash integration via secure API proxy + smart demo mode fallback                                                                                            |
| **Navigation**                 | Interactive SVG stadium map with keyboard-navigable zones, gate directions, AI navigation tips                                                                                 |
| **Crowd management**           | Real-time density monitoring, critical gate alerts, zone occupancy tracking, live simulation engine                                                                            |
| **Accessibility**              | Dedicated Accessibility Hub with service map, accessible gates with features, AI-powered accessibility assistant, wheelchair routes, sign language info, service animal relief |
| **Transportation**             | Post-match transport hub with CO₂ tracking, eco scores, AI departure recommendations                                                                                           |
| **Sustainability**             | Full dashboard: energy, water, waste, solar, CO₂ savings, eco mode, FIFA 2026 goals tracking                                                                                   |
| **Multilingual assistance**    | 7 languages (EN, ES, FR, AR, PT, JA, HI) in AI chat with keyboard-navigable language selector                                                                                  |
| **Operational intelligence**   | Command Center with 4 KPIs, AI-recommended incident actions, critical gate alerts, live system status                                                                          |
| **Real-time decision support** | Live simulation engine, AI incident recommendations, AI volunteer assignment, AI departure recommendations                                                                     |
| **FIFA World Cup 2026**        | AT&T Stadium (Arlington, TX), Brazil vs France quarter-final, FIFA sustainability goals                                                                                        |

## Tech Stack

| Category  | Technology                                                   |
| --------- | ------------------------------------------------------------ |
| Framework | React 19 (JSX)                                               |
| Build     | Vite 8                                                       |
| Styling   | Tailwind CSS v4 + PostCSS                                    |
| AI        | Google Generative AI (Gemini 1.5 Flash)                      |
| Server    | Express.js (API proxy with Helmet, CORS, rate limiting)      |
| Security  | Helmet, DOMPurify, CSRF protection, API key auth             |
| Icons     | Lucide React + Material Symbols                              |
| Testing   | Vitest + Testing Library + jest-axe (unit), Playwright (E2E) |
| Linting   | oxlint + Prettier                                            |

## Features

- **WC 26 Ops Center** — Real-time KPIs, zone/gate status, AI-recommended incident management
- **GenAI Assistant** — Multilingual chat with Gemini AI (or demo mode), 7 languages, markdown rendering
- **Crowd & Navigation** — Interactive SVG stadium map, keyboard navigation, zone selection, AI navigation tips
- **Volunteer Dispatch** — AI-powered task assignment, volunteer roster with language/skill matching
- **Transport Hub** — Post-match departure options, CO₂ tracking, AI recommendations, multi-sort
- **Sustainability Dashboard** — Energy, water, waste, solar metrics, eco mode toggle, FIFA goals tracking
- **Accessibility Hub** — Dedicated view for accessible gates, service locations (wheelchair, hearing loops, braille), AI-powered accessibility assistant with quick queries

## Getting Started

```bash
# Install dependencies
npm install

# Start development (Vite + Express proxy)
npm run dev

# Run tests
npm test                 # Unit tests
npm run test:coverage    # With coverage report
npm run test:e2e         # Playwright E2E tests
npm run test:a11y        # Accessibility-specific tests

# Lint & format
npm run lint
npm run format

# Build for production
npm run build
```

### API Key Configuration

For full GenAI features, create a `.env` file:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

The app gracefully falls back to **Demo Mode** with smart keyword-based responses when no API key is configured.

## Project Structure

```
src/
├── components/     # UI components (lazy-loaded)
│   ├── CommandCenter.jsx
│   ├── AIAssistant.jsx
│   ├── CrowdMap.jsx
│   ├── VolunteerDispatch.jsx
│   ├── TransportHub.jsx
│   ├── Sustainability.jsx
│   ├── Layout.jsx / Header.jsx / Sidebar.jsx
│   └── *.test.jsx  # Unit tests per component
├── context/        # StadiumContext (real-time simulation engine)
├── hooks/          # Custom hooks (useGemini)
├── utils/          # Constants, helpers, design tokens
├── data/           # Mock data (AT&T Stadium)
└── main.jsx        # Entry point
```

## Security

- Helmet.js with strict Content Security Policy
- DOMPurify XSS sanitization for AI responses
- API keys stored in `.env` (never in source)
- Rate limiting (30 req/min per IP)
- CSRF protection
- CORS restricted to allowed origins
- Request body size limits (10kb)
- Input validation + sanitization
- HTTPS redirect in production
- Security headers (HSTS, X-Frame-Options, Permissions-Policy)

## Testing

- **100% component coverage** with Vitest + Testing Library
- **jest-axe** automated accessibility checks in every component test
- **Playwright E2E** across Chromium, Firefox, and mobile Chrome
- **Coverage thresholds:** 80%+ statements, 70%+ branches, 80%+ functions, 80%+ lines

## Accessibility (WCAG 2.1 AA Compliant)

- Skip navigation links (static + dynamic)
- Comprehensive ARIA: roles, labels, live regions, expanded/current states
- Full keyboard navigation (arrows, tab, enter/space)
- `prefers-reduced-motion` support
- Screen reader utilities (`.sr-only`, `.sr-live-region`)
- Semantic HTML landmarks
- Focus trap management
- Color contrast optimized palette
- Automated a11y regression testing
