# EHealth Med AI - Frontend

Frontend application for the EHealth Med AI platform, built with Next.js 14, React 18, and TypeScript.

## Features

- 🎨 Modern, responsive UI with Tailwind CSS
- 🔐 Secure authentication with JWT
- 📊 Dashboard with analytics
- 🤖 Voice AI configuration interface
- 📋 Requirements management
- 🔒 Security and access control
- 📞 Telephony integration
- 🔗 EHR integrations
- 📈 Analytics and reporting

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: JWT with secure token management

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Backend server running (see backend README)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Running the Application

### Development
```bash
npm run dev
```

The application will run on `http://localhost:3000`

### Production Build
```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── app/
│   ├── admin/              # Admin dashboard
│   ├── architecture/       # Architecture pages
│   │   ├── voice-ai/      # Voice AI configuration
│   │   ├── security/      # Security settings
│   │   └── ...
│   ├── dashboard/         # User dashboard
│   ├── login/             # Login page
│   ├── signup/            # Signup page
│   ├── requirements/      # Requirements management
│   └── ...
├── components/
│   └── Logo.tsx          # Logo component
├── hooks/
│   └── useAuth.ts        # Authentication hook
├── lib/
│   ├── api.ts            # API client
│   ├── auth.ts           # Auth utilities
│   └── security.ts       # Security utilities
├── middleware/
│   └── auth.tsx          # Auth middleware
├── .env.local            # Environment variables (not in git)
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

## Key Pages

- `/` - Landing page
- `/login` - User login
- `/signup` - User registration
- `/dashboard` - Main dashboard
- `/admin` - Admin dashboard
- `/architecture/voice-ai` - Voice AI configuration
- `/requirements` - Requirements management
- `/assumptions-constraints` - Assumptions & Constraints
- `/analytics` - Analytics dashboard
- `/integrations` - Webhooks and integrations

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL (default: `http://localhost:5000/api`)

## Features

### Authentication
- JWT-based authentication
- Google OAuth support
- Secure token storage
- Session management

### Voice AI Configuration
- STT (Speech-to-Text) configuration
- NLU (Natural Language Understanding) configuration with OpenAI
- TTS (Text-to-Speech) configuration with ElevenLabs
- Agent testing interface

### Requirements Management
- Create and manage requirements
- Filter by category, type, and status
- Group by category and subcategory
- Search functionality

## Development

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting (if configured)

### Building
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## Security

- All API calls use secure authentication
- Input sanitization on all user inputs
- CSRF protection
- Secure token storage

## License

MIT

