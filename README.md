# My PFP Glowup ✨

[View Demo](https://fashn-pfp-glowup.vercel.app/)
This demo lets you enter your X handle to generate a full upper-body AI avatar using the FASHN SDK.

## Tech Stack

### Frontend
- **Next.js 14** with App Router and TypeScript
- **React 18** with server and client components
- **Tailwind CSS 4** for styling and responsive design
- **Lucide Icons** for UI iconography

### Backend & APIs
- **FASHN AI** - Generative image models tailored for fashion applications
- **Cloudflare** - Cloudflare Turnstile, Verify web visitors without CAPTCHA
- **Upstash** - Serverless Data Platform
- **Unavatar** - Avatar service

## Getting started

### Prerequisites

- Node.js 18+ 
- Cloudflare Turnstile credentials
  - If you don't want to see the turnstile widget, choose `Invisible` in `Widget Mode` in Cloudflare manage widget page.
- FASHN AI API key
- Upstash redis rest url and rest token

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

```bash
pnpm install
```

2. Copy the environment file and configure your credentials:

```bash
cp .env.example .env.local
```

3. Set up your environment variables in `.env.local`:

```bash
# FASHN AI API key
FASHN_API_KEY=

# Cloudflare turnstile credentials
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

# Upstash credentials
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

### Development

```bash
npm run dev
```

```bash
pnpm run dev
```

Your application will be available at `http://localhost:3000`.

## Building for Production

Create a production build:

```bash
npm run build
```

```bash
pnpm run build
```

## How it works

This app uses our [Face to Model endpoint](https://docs.fashn.ai/api-reference/face-to-model) to transform face images into try-on ready upper-body avatars.

## License

MIT License - see LICENSE file for details

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### How to Contribute

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Follow the existing code style

### Issues

Found a bug or have a feature request? Please [open an issue](https://github.com/fashn-AI/avatar-try-on/issues/new) with:

- Clear description of the problem/feature
- Steps to reproduce (for bugs)
- Expected behavior
- Screenshots (if applicable)

---

<div align="center">
  <p>Made with ❤️ by the FASHN AI Team</p>
  <p>
    <strong>Star ⭐ this repository if you find it helpful!</strong>
  </p>
</div>
