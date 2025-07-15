# Whispr Deployment Configuration

This document outlines the configuration changes made to deploy Whispr behind the OSDG reverse proxy at `osdg.iiit.ac.in/whispr/`.

## Summary of Changes

### 1. Docker Compose Configuration (`docker-compose.yml`)

**Key Changes:**

- ✅ Removed host port bindings (80:80, 443:443) from nginx service
- ✅ Added custom subnet `172.25.1.0/24` for whispr-network
- ✅ Assigned static IP `172.25.1.2` to nginx container
- ✅ Updated environment variables for production deployment
- ✅ Fixed frontend API URL to use relative path

**Network Configuration:**

```yaml
networks:
  whispr-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.25.1.0/24
```

**Nginx Service:**

```yaml
nginx:
  # ... other config
  networks:
    whispr-network:
      ipv4_address: 172.25.1.2
```

### 2. System Nginx Configuration

**For your system administrator**, update the system nginx configuration to:

```nginx
# Handle /whispr and ensure it's redirected to /whispr/
location = /whispr {
    return 301 /whispr/;
}
location /whispr/ {
    proxy_pass http://172.25.1.2/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Prefix /whispr;
}
```

### 3. Next.js Configuration (`frontend/next.config.js`)

**Changes:**

- ✅ Added `basePath: "/whispr"` for proper URL routing
- ✅ Added `trailingSlash: true` for consistent routing
- ✅ Updated image domains to include `osdg.iiit.ac.in`

### 4. Container Nginx Configuration (`nginx/conf.d/default.conf`)

**Changes:**

- ✅ Added `X-Forwarded-Prefix` header for proper path handling
- ✅ Updated CORS origin to `https://osdg.iiit.ac.in`
- ✅ Added proper proxy headers for reverse proxy setup

### 5. Backend Configuration

**Environment Variables Added:**

```env
CORS_ORIGINS=https://osdg.iiit.ac.in
FRONTEND_URL=https://osdg.iiit.ac.in
COOKIE_DOMAIN=osdg.iiit.ac.in
COOKIE_SECURE=true
COOKIE_SAMESITE=lax
CAS_SERVICE_URL=https://osdg.iiit.ac.in/whispr/api/verify/callback
```

## Deployment Steps

### 1. Production Deployment

```bash
# Stop any running containers
make down

# Build and start production containers
make build
make up

# Verify containers are running
make ps

# Check logs if needed
make logs
```

### 2. Development with Proxy Testing

```bash
# Start development with proxy simulation
make dev

# Access via: http://localhost:8080/whispr/
```

### 3. System Integration

1. **Update system nginx** with the configuration in `NGINX_SYSTEM_CONFIG.md`
2. **Reload system nginx**: `sudo nginx -s reload`
3. **Test access**: `https://osdg.iiit.ac.in/whispr/`

## Network Architecture

```
Internet
    ↓
System Nginx (osdg.iiit.ac.in)
    ↓ [/whispr/]
Container Nginx (172.25.1.2:80)
    ↓ [/api/] → Backend (backend:8000)
    ↓ [/] → Frontend (frontend:3000)
```

## Verification Checklist

- [ ] Docker containers start without port conflicts
- [ ] Nginx container gets IP `172.25.1.2`
- [ ] System nginx configuration updated
- [ ] Application accessible at `https://osdg.iiit.ac.in/whispr/`
- [ ] API endpoints work correctly
- [ ] Authentication cookies are properly set
- [ ] Static assets load correctly
- [ ] CAS authentication redirects properly

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure no other services use ports 80/443 in containers
2. **IP Assignment**: Verify the nginx container gets `172.25.1.2`
3. **Path Issues**: Check that all URLs include the `/whispr` prefix
4. **CORS Errors**: Verify backend CORS_ORIGINS includes `https://osdg.iiit.ac.in`

### Debugging Commands

```bash
# Check container IPs
docker inspect whispr-nginx | grep IPAddress

# Check nginx logs
make logs nginx

# Check backend logs
make logs backend

# Shell into nginx container
make shell-nginx

# Test internal connectivity
docker exec whispr-nginx wget -qO- http://frontend:3000
```

## Development vs Production

### Development (`make dev`)

- Nginx exposed on port 8080
- Local domain cookies
- HTTP connections allowed
- Direct container port access

### Production (`make up`)

- No exposed ports
- Production domain cookies
- HTTPS required
- Access only through system proxy

## Files Modified

1. `docker-compose.yml` - Main production configuration
2. `docker-compose.dev.yml` - Development overrides
3. `frontend/next.config.js` - Next.js base path configuration
4. `nginx/conf.d/default.conf` - Container nginx configuration
5. `backend/.env.production` - Production environment template
6. `NGINX_SYSTEM_CONFIG.md` - System nginx configuration guide

## Next Steps

1. Share `NGINX_SYSTEM_CONFIG.md` with your system administrator
2. Test the deployment in a staging environment first
3. Monitor logs during initial deployment
4. Update DNS/SSL certificates if needed
5. Test all authentication flows, especially CAS integration
