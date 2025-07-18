# How to Properly Run the Whispr Application

1. **Build the containers** (if not built yet or when making changes to Dockerfiles):
   ```bash
   make build
   ```

2. **Start the application with proper service ordering**:
   ```bash
   make start
   ```
   This command will:
   - Start the database first
   - Wait for PostgreSQL to initialize
   - Start the backend next
   - Wait for the backend to initialize
   - Finally start the frontend and nginx
   
   This ensures that each service is ready before dependent services try to connect.

3. **For first-time setup only** (if the frontend hasn't been initialized):
   ```bash
   make setup-frontend
   ```

4. **Access the application**:
   - Frontend: http://localhost
   - Backend API: http://localhost/api
   - API Documentation: http://localhost/api/docs

5. **View logs** (if you need to monitor the application):
   ```bash
   make logs
   ```

6. **Shut down when done**:
   ```bash
   make down
   ```

## Troubleshooting Common Issues

### Frontend Dependencies

If you encounter errors related to missing dependencies in the frontend container, you can install them using:

```bash
make shell-frontend
```

Once inside the container:

```bash
cd /app
npm install <package-name>
```

#### Common Dependency Issues:

1. **Missing autoprefixer error**: 
   ```
   Error: Cannot find module 'autoprefixer'
   ```
   
   Fix with:
   ```bash
   make shell-frontend
   cd /app
   npm install autoprefixer
   ```

2. **Missing PostCSS**:
   ```
   Error: Cannot find module 'postcss'
   ```
   
   Fix with:
   ```bash
   make shell-frontend
   cd /app
   npm install postcss
   ```