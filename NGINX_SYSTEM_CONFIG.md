# System Nginx Configuration for Whispr

This file contains the configuration that needs to be updated in your system's nginx configuration (the one running on the host system, not the Docker container).

## Updated Configuration

Replace the existing `/whispr` location blocks in your system nginx configuration with:

```nginx
# Handle /whispr and ensure it's redirected to /whispr/
location = /whispr {
    return 301 /whispr/;
}
location /whispr/ {
    proxy_pass http://172.25.1.10:8080/;  # This will proxy to your whispr nginx container
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Prefix /whispr;
}
```

## Key Changes Made

1. **Docker Compose Changes:**

   - Added custom subnet `172.25.1.0/24` for the whispr-network
   - Assigned static IP `172.25.1.2` to the nginx container
   - Removed host port bindings (80:80, 443:443)
   - Updated frontend environment to use relative API URL

2. **Container Nginx Configuration:**

   - Added `X-Forwarded-Prefix` header to handle the `/whispr` path
   - Updated CORS origin to `https://osdg.iiit.ac.in`
   - Added proper proxy headers for reverse proxy setup

3. **Next.js Configuration:**
   - Added `basePath: "/whispr"` to handle the URL prefix
   - Added `trailingSlash: true` for proper routing
   - Updated image domains to include `osdg.iiit.ac.in`

## Deployment Instructions

1. Update your system nginx configuration with the above location blocks
2. Restart your Docker containers: `make down && make up`
3. Reload system nginx: `sudo nginx -s reload`
4. Test access at `https://osdg.iiit.ac.in/whispr/`

## Network Details

- **Subnet**: 172.25.1.0/24
- **Nginx Container IP**: 172.25.1.10
- **Internal Communication**: All containers communicate via Docker network names
- **External Access**: Only through the system nginx proxy at the assigned IP
