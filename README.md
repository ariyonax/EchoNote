

> A full-stack cloud-native web application for converting audio recordings into searchable, organized transcripts using AI.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Local Development Setup](#local-development-setup)
- [Docker Setup](#docker-setup)
- [AWS EC2 Deployment](#aws-ec2-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [API Reference](#api-reference)
- [Default Credentials](#default-credentials)

---

## ✨ Features

- 🔐 **JWT Authentication** – Signup, login, role-based access (user/admin)
- 🎵 **Audio Upload** – Supports MP3, WAV, M4A (up to 50MB)
- 🤖 **AI Transcription** – OpenAI Whisper API integration with demo mode
- 📁 **Notes Management** – Categorize, edit, search transcripts
- 📊 **Dashboards** – User and Admin dashboards with analytics
- 📥 **Download** – Export transcripts as TXT or PDF
- 🐳 **Docker Ready** – Full containerization with Docker Compose
- ⚙️ **CI/CD** – GitHub Actions pipeline for automated deployment
- ☁️ **Cloud Deployed** – AWS EC2 deployment ready

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express.js |
| Database | MySQL 8.0 |
| AI API | OpenAI Whisper |
| Containerization | Docker, Docker Compose |
| CI/CD | GitHub Actions |
| Cloud | AWS EC2 |
| Logging | Winston |
| Auth | JWT + bcrypt |

---

## 📁 Project Structure

```
echonote/
├── client/                    # Frontend
│   ├── html/                  # All HTML pages
│   │   ├── index.html         # Landing page
│   │   ├── login.html
│   │   ├── signup.html
│   │   ├── dashboard.html
│   │   ├── upload.html
│   │   ├── transcripts.html
│   │   ├── viewer.html
│   │   ├── search.html
│   │   └── admin.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── app.js             # Shared API client & utilities
│       └── sidebar.js         # Sidebar component
│
├── server/                    # Backend
│   ├── index.js               # Express app entry point
│   ├── routes/
│   │   ├── auth.js
│   │   ├── audio.js
│   │   ├── transcripts.js
│   │   └── admin.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── audioController.js
│   │   ├── transcriptController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   ├── auth.js            # JWT middleware
│   │   └── upload.js          # Multer config
│   ├── config/
│   │   ├── database.js        # MySQL pool
│   │   └── logger.js          # Winston logger
│   ├── services/
│   │   └── transcriptionService.js
│   └── uploads/               # Audio file storage
│
├── database/
│   └── schema.sql             # DB initialization
│
├── tests/                     # Jest test files
│   ├── auth.test.js
│   ├── transcripts.test.js
│   └── admin.test.js
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml          # GitHub Actions pipeline
│
├── Dockerfile
├── docker-compose.yml
├── jest.config.js
├── package.json
├── .env.example
└── README.md
```

---

## 🚀 Local Development Setup

### Prerequisites

- Node.js 18+
- MySQL 8.0
- Git

### Steps

```bash
# 1. Clone repository
git clone https://github.com/yourusername/echonote.git
cd echonote

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env with your values

# 4. Initialize database
mysql -u root -p < database/schema.sql

# 5. Start development server
npm run dev
```

Open http://localhost:5000 in your browser.

---

## 🐳 Docker Setup

```bash
# Start all services (backend + MySQL)
docker-compose up --build

# Run in background
docker-compose up -d --build

# Stop services
docker-compose down

# View logs
docker-compose logs -f backend

# Rebuild after code changes
docker-compose up --build --force-recreate
```

The app will be available at http://localhost:5000

---

## ☁️ AWS EC2 Deployment

See [AWS_DEPLOYMENT.md](AWS_DEPLOYMENT.md) for the complete step-by-step guide.

### Quick Summary

```bash
# On EC2 instance
sudo apt-get update
sudo apt-get install -y docker.io docker-compose git

git clone https://github.com/yourusername/echonote.git
cd echonote

# Create .env with production values
cp .env.example .env
nano .env

# Launch application
docker-compose up -d --build
```

---

## ⚙️ CI/CD Pipeline

The GitHub Actions pipeline (`.github/workflows/ci-cd.yml`) automatically:

1. **Runs tests** on every push/PR
2. **Builds Docker image** after tests pass
3. **Pushes to Docker Hub** on `main` branch
4. **Deploys to EC2** via SSH
5. **Health checks** the deployed app

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `DOCKER_USERNAME` | Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub password |
| `EC2_HOST` | EC2 public IP or DNS |
| `EC2_USER` | EC2 SSH username (usually `ubuntu`) |
| `EC2_SSH_KEY` | EC2 private key (PEM file contents) |

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login & get JWT |
| GET | `/api/auth/profile` | Get user profile |

### Audio
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/audio/upload` | Upload audio file |
| GET | `/api/audio/uploads` | List user uploads |
| GET | `/api/audio/status/:id` | Get upload status |
| DELETE | `/api/audio/:id` | Delete upload |

### Transcripts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transcripts` | List transcripts |
| GET | `/api/transcripts/:id` | Get single transcript |
| PUT | `/api/transcripts/:id` | Edit transcript |
| DELETE | `/api/transcripts/:id` | Delete transcript |
| GET | `/api/transcripts/search?q=` | Full-text search |
| GET | `/api/transcripts/:id/download/txt` | Download as TXT |
| GET | `/api/transcripts/:id/download/pdf` | Download as PDF |
| GET | `/api/transcripts/categories` | List categories |

### Admin (Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Platform statistics |
| GET | `/api/admin/users` | All users |
| DELETE | `/api/admin/users/:id` | Delete user |

---

## 🔑 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@echonote.com | admin123 |

> ⚠️ Change the admin password immediately in production!

---

## 🧪 Running Tests

```bash
# Run all tests
npm test

# With coverage report
npm run test:coverage
```

---

## 📝 License

MIT License – Free for educational use.
