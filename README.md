# 🏟️ Stadium IQ

### **FIFA World Cup 2026™ — Smart Stadium Operations Platform**

[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Google Gemini 1.5](https://img.shields.io/badge/Google_Gemini-1.5_Flash-4285F4?style=flat-square&logo=google-gemini&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Accessibility](https://img.shields.io/badge/WCAG_2.1-AA_Compliant-2EA44F?style=flat-square)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![Security](https://img.shields.io/badge/Security-Production_Ready-success?style=flat-square&logo=snyk)](https://snyk.io/)

---

**Stadium IQ** is a state-of-the-art, GenAI-enabled stadium operations command center tailored for the **FIFA World Cup 2026™** (headquartered at the AT&T Stadium in Arlington, TX, featuring the France vs. Brazil Quarter-Final match). Built using React 19, Tailwind CSS v4, Express, and Google Gemini 1.5 Flash, it empowers stadium managers, operators, volunteers, and fans with real-time intelligence, interactive crowd routing, and automated operational dispatch.

---

## 🗺️ Table of Contents

- [🎯 Problem Statement Alignment](#-problem-statement-alignment)
- [🛠️ Tech Stack](#️-tech-stack)
- [✨ Core Features](#-core-features)
- [🚀 Getting Started](#-getting-started)
- [📦 Project Architecture](#-project-architecture)
- [🛡️ Security Hardening](#️-security-hardening)
- [🧪 Testing & Quality Assurance](#-testing--quality-assurance)
- [♿ Accessibility (WCAG 2.1 AA)](#-accessibility-wcag-21-aa)

---

## 🎯 Problem Statement Alignment

Stadium IQ addresses the critical operational challenges of hosting large-scale tournaments by merging **Generative AI** with real-time operations:

| Pillar                  | Requirement                | Stadium IQ Implementation                                                                                                            |
| :---------------------- | :------------------------- | :----------------------------------------------------------------------------------------------------------------------------------- |
| **🤖 Generative AI**    | GenAI-enabled platform     | Integration with Google Gemini 1.5 Flash via a secure backend proxy with a local Demo Mode fallback.                                 |
| **🧭 Navigation**       | Smart Navigation           | Interactive SVG stadium map with keyboard-navigable zones, gate status, and AI-generated egress/ingress tips.                        |
| **👥 Crowd Management** | Incident & Density Control | Real-time density monitoring, gate alerts, zone occupancy trackers, and simulation control.                                          |
| **♿ Accessibility**    | Dedicated Hub              | Comprehensive suite detailing accessible gates, wheelchair routing, hearing loop locations, and an AI-powered accessibility advisor. |
| **🌱 Sustainability**   | Green Infrastructure       | Monitoring metrics (energy, water, waste, solar output, CO₂ saved) coupled with a FIFA 2026 goals tracker.                           |
| **🌐 Multilingual**     | Inclusivity & Support      | AI Assistant offering instant translation and assistance across 7 languages (EN, ES, FR, AR, PT, JA, HI).                            |
| **🧠 Intelligence**     | Operational Support        | Live Command Center showcasing real-time KPIs, live incident lists, and automated volunteer dispatch recommendations.                |

---

## 🛠️ Tech Stack

<details>
<summary><b>Click to expand full Tech Stack breakdown</b></summary>

### Frontend

- **Framework:** React 19 (Functional Components, Context API)
- **Styling:** Tailwind CSS v4 (Sleek dark mode, glassmorphism, responsive CSS grid)
- **Icons:** Lucide React & Google Material Symbols
- **State Management:** StadiumContext & AppContext (managing live operational simulation updates)

### Backend & Security

- **Server:** Express.js (serving as a secure middleware and proxy for Google Gemini API)
- **Security Headers:** Helmet.js (strict Content Security Policy, HSTS, frame options)
- **Rate Limiting:** Express Rate Limit (restricting requests to 30 req/min per IP)
- **Sanitization:** DOMPurify for cleansing all user inputs and AI markdown responses

### Testing & Tooling

- **Unit Testing:** Vitest, React Testing Library, `jest-axe` (automated accessibility validation)
- **E2E Testing:** Playwright (cross-browser automation across Chromium, Firefox, WebKit, Mobile Chrome)
- **Linter & Formatter:** oxlint (fast linting) & Prettier

</details>

---

## ✨ Core Features

### 🖥️ 1. WC 26 Operations Command Center

- **Real-Time KPIs:** Live tracking of Stadium Capacity, Active Incidents, Deployed Volunteers, and Eco Power utilization.
- **Incident Intelligence:** Live simulator feeds incident notifications (e.g., gate blockages, medical requests) with immediate, AI-suggested mitigation procedures.
- **System Status:** Health checks for API proxy, AI Engine, and Simulator.

### 🤖 2. GenAI Multilingual Assistant (SSE Streaming)

- Powered by **Google Gemini 1.5 Flash** via Server-Sent Events (SSE) for token-by-token real-time rendering.
- Falls back to batch `/api/chat` if streaming unavailable, and further falls back to Demo Mode if no API key.
- Native rendering of complex Markdown, bullet points, and code snippets.
- Interactive quick-query pills tailored to user role/language.
- Full keyboard accessibility and semantic ARIA configuration.
- 7-language support: EN, ES, FR, AR, PT, JA, HI.

### 🗺️ 3. Crowd Density & Navigation Map with Wayfinding

- Interactive, responsive vector map of **AT&T Stadium**.
- Real-time density coloring (Clear, Moderate, Crowded, Critical).
- Keyboard accessibility: Navigate zones with arrow keys, select zones with Enter/Space.
- **Gate-level navigation**: Each gate row features a directions link that opens Google Maps with transit directions to the exact gate — enabling true fan wayfinding.
- Dynamic gate status side panel containing directions, waiting times, and AI navigation advice.

### 🤝 4. Volunteer Dispatch Engine

- Smart assignment system matching incident criteria to volunteer profiles.
- Profiles include language capabilities, specialized skills (medical, security, customer service), and location coordinates.
- Drag-and-drop / single-click assignment interface.

### 🚍 5. Post-Match Green Transport Hub

- Multi-modal transport tracker (Metrolink, Eco Shuttle, Rideshare, Walking).
- Dynamic eco scores and real-time CO₂ footprint tracker.
- Smart Sorting: Sort options by departure frequency, ETA, capacity, or CO₂ emissions.
- AI Transport Recommendations based on current egress crowd levels.

### 🍃 6. FIFA Sustainability Dashboard

- Live gauges for energy consumption, solar panel efficiency, water recycling rates, and diverted waste.
- **Eco Mode Toggle:** Dynamically simulates power saving across light fixtures, screen brightness, and HVAC.
- Automated tracker comparing current statistics against official FIFA 2026 sustainability targets.

### ♿ 7. Dedicated Accessibility Hub

- Specifically tailored for fans with physical, auditory, or visual impairments.
- Interactive list of accessible gates highlighting specific features (e.g., low-slope ramps, hearing loops).
- Real-time accessibility advisor answering questions on wheelchair rentals, shuttle paths, and sensory rooms.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)

### Setup & Installation

```bash
# Clone the repository
git clone https://github.com/himanshu003388/Stadium-IQ.git
cd Stadium-IQ

# Install dependencies
npm install
```

### Configuration

Create a `.env` file in the root directory to configure the Gemini API:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

> [!NOTE]  
> If no API key is specified, the application will automatically activate **Demo Mode** which simulates smart, context-aware AI interactions using an offline parser.

### Scripts & Development

| Command                 | Description                                                                |
| :---------------------- | :------------------------------------------------------------------------- |
| `npm run dev`           | Launches the React Vite frontend and the Express API proxy simultaneously. |
| `npm run build`         | Compiles production-ready bundle assets.                                   |
| `npm run lint`          | Scans the codebase using `oxlint` for rapid linting.                       |
| `npm run format`        | Enforces formatting style guidelines via Prettier.                         |
| `npm test`              | Runs unit tests using Vitest and React Testing Library.                    |
| `npm run test:coverage` | Generates a Vitest coverage report.                                        |
| `npm run test:e2e`      | Triggers Playwright E2E suites.                                            |
| `npm run test:a11y`     | Executes automated accessibility regression suites.                        |

---

## 📦 Project Architecture

```
Stadium-IQ/
├── .github/workflows/   # CI/CD workflows for automation
├── e2e/                 # E2E integration test suites (Playwright)
├── public/              # Static assets, SVG sprites, service workers
├── server.js            # Express server (middleware, security headers, Gemini proxy)
├── src/
│   ├── components/      # Modular component library
│   │   ├── CommandCenter.jsx      # Live operational dashboard
│   │   ├── AIAssistant.jsx        # Gemini-powered chatbot
│   │   ├── CrowdMap.jsx           # Interactive SVG Map
│   │   ├── VolunteerDispatch.jsx  # Smart volunteer tasking
│   │   ├── TransportHub.jsx       # Sustainability transport options
│   │   ├── Sustainability.jsx     # Green metrics & targets
│   │   ├── AccessibilityHub.jsx   # ADA compliance features
│   │   └── Layout.jsx             # Core shell container
│   ├── context/         # React Context (simulation engine & application state)
│   ├── hooks/           # Custom hooks (Gemini fetch hook)
│   ├── utils/           # Helper utility functions & UI token constants
│   ├── data/            # Static JSON datasets (stadium metadata, zones, volunteers)
│   ├── index.css        # Tailwind styling entries & custom design system tokens
│   └── main.jsx         # App bootstrapping
└── vite.config.js       # Vite build configurations
```

---

## 🛡️ Security Hardening

Stadium IQ incorporates a robust, multi-layer security configuration to protect stadium interfaces:

- **Express Middleware:** Powered by `Helmet` to enforce strict Content Security Policies (CSP), prevent clickjacking, and enforce HSTS.
- **API Defense:** Restricts API endpoint access with rate limit thresholds (30 requests/minute per client IP) to block DDoS and scraping attempts.
- **XSS Mitigation:** Integrates `DOMPurify` to sanitize all incoming prompt queries and outgoing AI markdown formats.
- **CORS Policies:** Configured strictly to limit requests to trusted origins.
- **Data Protection:** Implements payload size limits (10kb) and input validations on all backend controller routes.

---

## 🧪 Testing & Quality Assurance

Our robust verification pipeline ensures operational reliability during peak event hours:

### 🧪 Testing & Quality Assurance

Our robust verification pipeline ensures operational reliability during peak event hours:

- **Unit Testing:** Vitest + React Testing Library for all 11 components, 2 contexts, and 1 custom hook.
- **Server Security Tests:** Dedicated unit test suite for all server.js logic — `validateChatInput`, `sanitizeInput`, `buildSafeContext`, CSRF token generation/validation — including negative-path and boundary tests.
- **Accessibility Tests:** `jest-axe` integrated in every component test to prevent WCAG regression.
- **End-to-End Tests:** Playwright covers all 7 navigation views, AI chat interaction, streaming response, language selection, keyboard navigation, Eco Mode toggle, transport sort, and Google Maps gate navigation links.

---

## ♿ Accessibility (WCAG 2.1 AA)

Designed to be accessible to all global fans and tournament operators:

- **Semantic HTML5:** Built entirely with proper semantic landmark tags (`<header>`, `<main>`, `<nav>`, `<aside>`).
- **Keyboard Traversal:** Complete keyboard focus loop management, arrow-key SVG map navigation, and action execution using Space/Enter.
- **Screen Reader Support:** Configured using ARIA descriptors (`aria-live`, `aria-expanded`, `aria-controls`) and custom `.sr-only` descriptive texts.
- **Visual Design:** Fully complies with WCAG AA color contrast guidelines. Supports user configurations such as `prefers-reduced-motion`.
- **Skip Navigation:** Focus-visible skip links allow power-users to jump directly to operational widgets.

---

<p align="center">
  <b>Built for FIFA World Cup 2026™ Stadium Operations.</b>
</p>
