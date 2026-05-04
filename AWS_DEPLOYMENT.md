# ☁️ AWS EC2 Deployment Guide – EchoNote

This guide walks through deploying EchoNote on an AWS Learner Lab EC2 instance.

---

## Prerequisites

- AWS Learner Lab account with EC2 access
- GitHub repository with your code
- Basic Linux/terminal knowledge

---

## Step 1: Launch EC2 Instance

1. Log in to AWS Learner Lab → Start Lab → Open AWS Console
2. Go to **EC2 → Launch Instance**
3. Configure:
   - **Name:** `echonote-server`
   - **AMI:** Ubuntu Server 22.04 LTS (Free tier eligible)
   - **Instance type:** `t2.micro` (Free tier) or `t2.small`
   - **Key pair:** Create new → Download `.pem` file (keep it safe!)
   - **Security Group:** Create new with these rules:

| Type | Protocol | Port | Source |
|------|----------|------|--------|
| SSH | TCP | 22 | My IP |
| HTTP | TCP | 80 | Anywhere |
| Custom TCP | TCP | 5000 | Anywhere |

4. Click **Launch Instance**

---

## Step 2: Connect to EC2

```bash
# Make key file secure
chmod 400 your-key.pem

# Connect via SSH
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

---

## Step 3: Install Dependencies on EC2

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
sudo apt-get install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo apt-get install -y git

# Verify installations
docker --version
docker-compose --version
git --version
```

> **Note:** Log out and log back in after adding yourself to the docker group:
> ```bash
> exit
> ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
> ```

---

## Step 4: Clone and Configure

```bash
# Clone your repository
git clone https://github.com/yourusername/echonote.git
cd echonote

# Create .env file
cp .env.example .env
nano .env
```

Edit `.env` with production values:
```
NODE_ENV=production
PORT=5000
DB_HOST=db
DB_PASSWORD=strong_password_here
JWT_SECRET=very_long_random_secret_key_here
OPENAI_API_KEY=your_actual_openai_key
FRONTEND_URL=http://<EC2_PUBLIC_IP>:5000
```

---

## Step 5: Deploy with Docker Compose

```bash
# Build and start all services
docker-compose up -d --build

# Check running containers
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f db
```

---

## Step 6: Verify Deployment

```bash
# Check health endpoint
curl http://localhost:5000/api/health

# Expected response:
# {"status":"healthy","timestamp":"...","version":"1.0.0"}
```

Open your browser: `http://<EC2_PUBLIC_IP>:5000`

---

## Step 7: Setup Nginx (Optional – for Port 80)

```bash
# Install Nginx
sudo apt-get install -y nginx

# Create config
sudo nano /etc/nginx/sites-available/echonote
```

Paste this Nginx config:
```nginx
server {
    listen 80;
    server_name <EC2_PUBLIC_IP>;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/echonote /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Now access app at: `http://<EC2_PUBLIC_IP>` (no port needed)

---

## Step 8: Setup CI/CD (GitHub Actions)

In your GitHub repository, add these **Secrets** (Settings → Secrets → Actions):

| Secret Name | Value |
|-------------|-------|
| `EC2_HOST` | Your EC2 public IP |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | Contents of your `.pem` file |
| `DOCKER_USERNAME` | Your Docker Hub username |
| `DOCKER_PASSWORD` | Your Docker Hub password |

Now every push to `main` will automatically:
1. Run tests
2. Build Docker image
3. Push to Docker Hub
4. Deploy to your EC2 instance

---

## Useful Commands

```bash
# Restart containers
docker-compose restart

# Stop all services
docker-compose down

# Pull latest code and redeploy
git pull origin main
docker-compose up -d --build --force-recreate

# View all logs
docker-compose logs -f

# Access MySQL container
docker exec -it echonote-db mysql -u echonote_user -pechonote_pass echonote_db

# Check container resource usage
docker stats
```

---

## Troubleshooting

**App not accessible?**
- Check Security Group allows port 5000 (or 80)
- Run `docker-compose ps` to ensure containers are running
- Check logs: `docker-compose logs backend`

**Database connection error?**
- Wait 30s after startup for MySQL to be ready
- Check: `docker-compose logs db`

**Transcription not working?**
- Verify `OPENAI_API_KEY` in `.env`
- Check backend logs: `docker-compose logs backend`
- Without API key, demo mode generates placeholder text
