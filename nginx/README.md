# Nginx Configuration for Whispr

This directory contains the Nginx configuration for the Whispr application.

## Overview

Nginx serves as a reverse proxy in this architecture, routing requests to the appropriate services:

- Frontend requests go to the Next.js application
- API requests go to the FastAPI backend
- Static assets are served directly by Nginx

## Configuration Files

### conf.d/default.conf

This is the main configuration file for Nginx. It defines the server blocks and routing rules.

```nginx
server {
    listen 80;
    server_name localhost;

    # Frontend
    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support for Next.js development
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## HTTPS Configuration

For production, you should enable HTTPS. Here's how to modify the configuration:

1. Create SSL certificates and place them in the `certs` directory
2. Update the Nginx configuration to use HTTPS:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/certs/your-cert.pem;
    ssl_certificate_key /etc/nginx/certs/your-key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Frontend
    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support for Next.js development
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. Update the `.env` file to use HTTPS:
   - Set `COOKIE_SECURE=True`
   - Update any URLs to use `https://`

## Performance Optimizations

You can enhance the Nginx configuration with performance optimizations:

### Caching

Add caching for static assets:

```nginx
# In the server block
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    proxy_pass http://frontend:3000;
    expires 30d;
    add_header Cache-Control "public, no-transform";
}
```

### Compression

Enable gzip compression:

```nginx
# In the http block
gzip on;
gzip_comp_level 5;
gzip_min_length 256;
gzip_proxied any;
gzip_vary on;
gzip_types
  application/javascript
  application/json
  application/x-javascript
  text/css
  text/javascript
  text/plain
  text/xml;
```

### Connection Optimizations

Optimize connection handling:

```nginx
# In the http block
keepalive_timeout 65;
keepalive_requests 100;
client_body_timeout 10;
client_header_timeout 10;
send_timeout 10;
```

## Security Enhancements

Consider adding security headers:

```nginx
# In the server block
add_header X-Content-Type-Options nosniff;
add_header X-Frame-Options SAMEORIGIN;
add_header X-XSS-Protection "1; mode=block";
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'";
add_header Referrer-Policy "strict-origin-when-cross-origin";
```

## Rate Limiting

Implement rate limiting to prevent abuse:

```nginx
# In the http block
limit_req_zone $binary_remote_addr zone=api:10m rate=5r/s;

# In the location block for API
location /api/ {
    limit_req zone=api burst=10 nodelay;
    proxy_pass http://backend:8000/;
    # Other proxy settings...
}
```

## Monitoring

For production, consider adding monitoring endpoints:

```nginx
# In the server block
location /nginx_status {
    stub_status on;
    access_log off;
    allow 127.0.0.1;
    deny all;
}
```