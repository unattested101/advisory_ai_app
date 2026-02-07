# Advisory AI App

An AI-powered assistant for financial advisors to streamline client meetings, track action items, analyse market news impact, and manage client portfolios efficiently.

---

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Solution Overview](#-solution-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Setup Instructions](#-setup-instructions)
- [Environment Variables](#-environment-variables)
- [Running the Project Locally](#-running-the-project-locally)
- [API Endpoints](#-api-endpoints)

---

## 🎯 Problem Statement

Financial advisors face several challenges in their day-to-day work:

1. **Meeting Documentation**: Manually taking notes during client meetings leads to missed information and inconsistent documentation.
2. **Question Coverage**: Ensuring all required compliance and advisory questions are covered during meetings is difficult to track.
3. **Action Item Management**: Following up on action items from multiple client meetings becomes overwhelming without proper tracking.
4. **Market News Analysis**: Analysing how market news impacts different clients' portfolios and goals is time-consuming.
5. **Client Communication**: Sending personalised updates to clients about relevant market changes requires significant manual effort.

---

## 💡 Solution Overview

**Advisory AI App** is a comprehensive solution that leverages AI to assist financial advisors with:

1. **AI Meeting Notetaker**: An intelligent bot that joins client meetings, transcribes conversations in real-time via Server-Sent Events (SSE), and tracks question coverage against customisable templates.

2. **Smart Action Item Tracking**: Automatically extracts and tracks action items from meetings with due dates, allowing advisors to monitor pending tasks across all clients.

3. **News Impact Analysis**: AI-powered analysis of market news to determine how it affects each client's portfolio and financial goals, with personalised impact assessments and recommended actions.

4. **Automated Client Communication**: One-click email functionality to send personalised updates to clients about relevant market news and pending action items.

5. **Client Portfolio Dashboard**: Comprehensive view of client portfolios, holdings, goals, and meeting history.

---

## ✨ Features

### Home Page
- **Market News Feed**: View latest financial news categorised by equities, property, bonds, and interest rates
- **AI News Impact Analysis**: Analyse how each news article affects your clients
- **Bulk Email Notifications**: Send personalised impact emails to all affected clients
- **Action Items Dashboard**: View upcoming action items across all clients sorted by urgency

### Notetaker Page
- **Meeting Bot Integration**: Invite an AI bot to join video meetings (Zoom, Google Meet, etc.)
- **Real-time Transcription**: Live transcript streaming via SSE
- **Question Templates**: Pre-defined question templates for different meeting types
- **Coverage Tracking**: Real-time tracking of which required questions have been covered
- **Missing Question Suggestions**: AI suggestions for uncovered topics

### Clients Page
- **Client Directory**: Searchable list of all advisory clients
- **Portfolio Overview**: View holdings, allocations, and total portfolio value
- **Goal Tracking**: Monitor client financial goals with progress indicators
- **Meeting History**: Access past meeting transcripts and action items
- **Individual Action Items**: Track client-specific tasks with email follow-up capability

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.0 | UI component library |
| **TypeScript** | 5.9.3 | Type-safe JavaScript |
| **Vite** | 7.2.4 | Build tool and dev server |
| **Tailwind CSS** | 4.1.18 | Utility-first CSS framework |
| **React Router DOM** | 7.13.0 | Client-side routing |
| **Lucide React** | 0.563.0 | Icon library |

### Development Tools
| Tool | Purpose |
|------|---------|
| **ESLint** | Code linting |
| **TypeScript ESLint** | TypeScript-specific linting rules |

### Backend Requirements
The frontend connects to a backend API server (not included in this repository) that provides:
- Bot management for meeting transcription
- Real-time transcript streaming via SSE
- Client and portfolio data management
- AI-powered news impact analysis
- Email sending capabilities

---

## 📁 Project Structure

```
advisory_ai_app/
├── public/
│   └── vite.svg
├── src/
│   ├── assets/
│   │   └── react.svg
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx      # Main application layout with navigation
│   │   │   └── Sidebar.tsx        # Navigation sidebar component
│   │   ├── ActionItemEmailModal.tsx  # Modal for sending action item emails
│   │   ├── CoverageStatus.tsx     # Question coverage indicator
│   │   ├── MeetingInput.tsx       # Meeting URL input component
│   │   ├── QuestionChecklist.tsx  # Checklist for required questions
│   │   └── TranscriptPanel.tsx    # Real-time transcript display
│   ├── hooks/
│   │   └── useTranscriptStream.ts # Custom hook for SSE transcript streaming
│   ├── pages/
│   │   ├── ClientsPage.tsx        # Client directory and details
│   │   ├── HomePage.tsx           # Dashboard with news and action items
│   │   └── NotetakerPage.tsx      # Meeting notetaker interface
│   ├── services/
│   │   └── api.ts                 # API service functions
│   ├── App.tsx                    # Root component with routing
│   ├── index.css                  # Global styles
│   └── main.tsx                   # Application entry point
├── eslint.config.js
├── index.html
├── package.json
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── README.md
```

---

## ⚙️ Setup Instructions

### Prerequisites

Ensure you have the following installed on your machine:

- **Node.js** (v18.0.0 or higher) - [Download](https://nodejs.org/)
- **npm** (v9.0.0 or higher) or **yarn** (v1.22.0 or higher)
- **Git** - [Download](https://git-scm.com/)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd advisory_ai_app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   Or if using yarn:
   ```bash
   yarn install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```
   Or create a new `.env` file in the project root (see Environment Variables section below).

---

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# API Configuration
VITE_API_URL=http://localhost:3000
```

### Variable Descriptions

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | No | `http://localhost:3000` | Base URL for the backend API server |

> **Note**: All environment variables must be prefixed with `VITE_` to be exposed to the Vite application.

---

## 🚀 Running the Project Locally

### Development Mode

Start the development server with hot module replacement (HMR):

```bash
npm run dev
```

The application will be available at: **http://localhost:5173**

### Production Build

Build the application for production:

```bash
npm run build
```

This creates an optimised build in the `dist/` folder.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

### Linting

Run ESLint to check for code issues:

```bash
npm run lint
```

---

## 🔌 API Endpoints

The frontend communicates with the following backend API endpoints:

### Bot Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bot/invite` | Invite bot to a meeting |
| GET | `/api/bot/:botId/status` | Get bot status |
| POST | `/api/bot/:botId/leave` | Remove bot from meeting |
| GET | `/api/bot/:botId/events` | SSE endpoint for real-time transcript |
| POST | `/api/bot/:botId/check-coverage` | Check question coverage |

### Questions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/questions` | Get predefined questions |
| GET | `/api/questions/templates` | Get question templates |

### Advisory Clients
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/advisory/clients` | Get all clients |
| GET | `/api/advisory/clients/:id` | Get single client |
| GET | `/api/advisory/clients/:id/action-items` | Get client action items |

### News & Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/advisory/news` | Get all news items |
| POST | `/api/advisory/news/:id/impact` | Analyse news impact on clients |
| POST | `/api/advisory/suggestions` | Generate AI suggestions |

### Action Items
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/advisory/action-items/upcoming` | Get upcoming action items |
| PATCH | `/api/advisory/action-items/:meetingId/:itemId/toggle` | Toggle action item status |
| POST | `/api/advisory/action-items/email` | Send action item email |

### Email
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/advisory/email` | Send impact email to client |
| POST | `/api/advisory/email/bulk` | Send bulk impact emails |

---

## 📝 License

This project is private and proprietary.

---

## 🤝 Contributing

Please ensure all code follows the existing patterns and passes linting before submitting pull requests.
