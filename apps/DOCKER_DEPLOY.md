# Docker Deployment Guide

This guide covers deploying both apps using Docker.

## Prerequisites

- Docker installed ([Get Docker](https://docs.docker.com/get-docker/))
- Docker Compose (included with Docker Desktop)
- Environment variables ready

## Quick Start with Docker Compose

### Step 1: Create Environment File

Create a `.env` file in the root directory (`apps/.env`):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://pchluhffsqpisgfoqkdp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Admin App Only
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
QR_SECRET=your-qr-secret-here

# Must be the same in both apps
NEXT_PUBLIC_QR_ENCRYPTION_KEY=your-encryption-key-here
```

### Step 2: Build and Run

```bash
# From the apps directory
docker-compose up --build
```

This will:
- Build both admin and usher apps
- Start admin on `http://localhost:3000`
- Start usher on `http://localhost:3001`

### Step 3: Access Apps

- **Admin**: http://localhost:3000
- **Usher**: http://localhost:3001

## Individual Docker Commands

### Build Admin App

```bash
cd admin
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
  --build-arg SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
  --build-arg QR_SECRET=$QR_SECRET \
  --build-arg NEXT_PUBLIC_QR_ENCRYPTION_KEY=$NEXT_PUBLIC_QR_ENCRYPTION_KEY \
  -t btpass-admin .
```

### Run Admin App

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
  -e SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
  -e QR_SECRET=$QR_SECRET \
  -e NEXT_PUBLIC_QR_ENCRYPTION_KEY=$NEXT_PUBLIC_QR_ENCRYPTION_KEY \
  btpass-admin
```

### Build Usher App

```bash
cd usher
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
  --build-arg NEXT_PUBLIC_QR_ENCRYPTION_KEY=$NEXT_PUBLIC_QR_ENCRYPTION_KEY \
  -t btpass-usher .
```

### Run Usher App

```bash
docker run -p 3001:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
  -e NEXT_PUBLIC_QR_ENCRYPTION_KEY=$NEXT_PUBLIC_QR_ENCRYPTION_KEY \
  btpass-usher
```

## Production Deployment

### Using Docker Compose in Production

1. **Update docker-compose.yml** for production:
   ```yaml
   services:
     admin:
       # ... existing config
       restart: always
       # Add nginx or reverse proxy if needed
   ```

2. **Run in detached mode**:
   ```bash
   docker-compose up -d
   ```

3. **View logs**:
   ```bash
   docker-compose logs -f
   ```

4. **Stop services**:
   ```bash
   docker-compose down
   ```

### Deploy to Cloud Platforms

#### AWS ECS / Fargate

1. Build and push images to ECR
2. Create ECS task definitions
3. Deploy using ECS service

#### Google Cloud Run

```bash
# Build and push
gcloud builds submit --tag gcr.io/PROJECT_ID/btpass-admin

# Deploy
gcloud run deploy btpass-admin \
  --image gcr.io/PROJECT_ID/btpass-admin \
  --platform managed \
  --region us-central1 \
  --set-env-vars NEXT_PUBLIC_SUPABASE_URL=...
```

#### Azure Container Instances

```bash
# Build and push to ACR
az acr build --registry myregistry --image btpass-admin:latest ./admin

# Deploy
az container create \
  --resource-group myResourceGroup \
  --name btpass-admin \
  --image myregistry.azurecr.io/btpass-admin:latest \
  --dns-name-label btpass-admin \
  --ports 3000
```

## Docker Compose with Nginx (Reverse Proxy)

Create `nginx.conf`:

```nginx
upstream admin {
    server admin:3000;
}

upstream usher {
    server usher:3000;
}

server {
    listen 80;
    server_name admin.btpass.com;

    location / {
        proxy_pass http://admin;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 80;
    server_name usher.btpass.com;

    location / {
        proxy_pass http://usher;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Update `docker-compose.yml`:

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - admin
      - usher
```

## Troubleshooting

### Build Fails

1. **Check Docker version**:
   ```bash
   docker --version  # Should be 20.10+
   ```

2. **Clear Docker cache**:
   ```bash
   docker system prune -a
   ```

3. **Check build logs**:
   ```bash
   docker-compose build --no-cache
   ```

### Container Won't Start

1. **Check logs**:
   ```bash
   docker-compose logs admin
   docker-compose logs usher
   ```

2. **Verify environment variables**:
   ```bash
   docker-compose config
   ```

3. **Test container manually**:
   ```bash
   docker run -it --rm btpass-admin sh
   ```

### Port Already in Use

Change ports in `docker-compose.yml`:
```yaml
ports:
  - "3002:3000"  # Use different host port
```

## Performance Optimization

### Multi-stage Builds

The Dockerfiles already use multi-stage builds for smaller images.

### Image Size Optimization

```dockerfile
# Use .dockerignore (already created)
# Remove dev dependencies in production
RUN npm ci --only=production
```

### Caching

Docker Compose caches layers automatically. To force rebuild:

```bash
docker-compose build --no-cache
```

## Security Best Practices

1. **Don't commit `.env` files**
2. **Use secrets management** (Docker Secrets, AWS Secrets Manager, etc.)
3. **Run as non-root user** (already configured)
4. **Keep images updated**:
   ```bash
   docker pull node:18-alpine
   ```

## Monitoring

### Health Checks

Add to `docker-compose.yml`:

```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000"]
  interval: 30s
  timeout: 10s
  retries: 3
```

### Logging

```bash
# View logs
docker-compose logs -f

# Export logs
docker-compose logs > logs.txt
```

## Backup and Restore

### Backup Images

```bash
docker save btpass-admin | gzip > btpass-admin.tar.gz
docker save btpass-usher | gzip > btpass-usher.tar.gz
```

### Restore Images

```bash
gunzip -c btpass-admin.tar.gz | docker load
```
