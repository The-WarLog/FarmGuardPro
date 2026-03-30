# EPICS Backend - Deployment Checklist

## Pre-Deployment (Local Testing)

- [ ] Update `.env` with actual values (use `.env.example` as template)
- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Test locally: `uvicorn main:app --reload`
- [ ] Test with Docker: `docker-compose up`
- [ ] Verify endpoints with `test_login.html` or Postman:
  - [ ] POST /api/auth/register
  - [ ] POST /api/auth/login
  - [ ] GET /api/auth/me (with token)
  - [ ] GET /api/profile/user-bio (with token)
  - [ ] POST /api/profile/add-bio (with token)
  - [ ] GET /api/weather?city=London
  - [ ] GET /health

## Azure Infrastructure Setup

- [ ] Create Azure PostgreSQL Database
  - [ ] Note connection string for DATABASE_URL
  - [ ] Create database named `epics_db`
  - [ ] Whitelist App Service IP in firewall rules
  
- [ ] Create Azure Container Registry (optional)
  - [ ] Note registry URL and credentials
  
- [ ] Create Azure App Service
  - [ ] Choose Linux runtime stack
  - [ ] Select B2 or Standard tier (for torch/transformers)
  - [ ] Enable Always On for production
  - [ ] Enable Application Insights

## Azure Deployment

- [ ] Clone/push code to Azure repo or local machine
  
- [ ] Configure Environment Variables in Azure Portal:
  ```
  DATABASE_URL = postgresql://username@server:password@server.postgres.database.azure.com:5432/epics_db
  JWT_SECRET_KEY = (generate: openssl rand -hex 32)
  API_KEY = (from openweathermap.org)
  CORS_ORIGINS = https://yourdomain.com (or comma-separated)
  ENVIRONMENT = production
  LOG_LEVEL = INFO
  ```

- [ ] Deploy Container Image:
  ```bash
  # Option 1: Docker via Container Registry
  docker build -t epics-api:latest .
  docker tag epics-api:latest <registry>.azurecr.io/epics-api:latest
  docker push <registry>.azurecr.io/epics-api:latest
  
  # Option 2: ZIP deployment
  zip -r deploy.zip . -x ".git/*" ".venv/*" "__pycache__/*"
  az webapp up --name <app-name> --resource-group <group>
  ```

- [ ] Set Startup Command in Azure:
  - If using Docker: Auto-detected
  - If using ZIP: `sh startup.sh` or `gunicorn -c gunicorn_config.py main:app`

- [ ] Initialize Database:
  ```bash
  # Via SSH/Kudu console or App Service SSH
  python init_db.py
  ```

## Post-Deployment Verification

- [ ] Check Application Logs:
  ```bash
  az webapp log tail -g <resource-group> -n <app-name>
  ```

- [ ] Test Health Endpoint:
  ```bash
  curl https://<app-name>.azurewebsites.net/health
  ```

- [ ] Test Weather API:
  ```bash
  curl https://<app-name>.azurewebsites.net/api/weather?city=London
  ```

- [ ] Test Auth Flow:
  ```bash
  # Update test_login.html with Azure URL
  # Or use curl:
  curl -X POST https://<app-name>.azurewebsites.net/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"Test123!"}'
  ```

- [ ] Monitor in Azure Portal:
  - [ ] Check Application Insights > Performance
  - [ ] Check App Service Plan > Metrics (CPU, Memory)
  - [ ] Check Database > Performance (queries per second)

## Production Optimization

- [ ] Enable HTTPS only: Azure Portal > App Service > TLS/SSL settings
  
- [ ] Configure Auto-scaling:
  - [ ] Minimum instances: 1
  - [ ] Maximum instances: 3-5
  - [ ] Scale up when CPU > 70%
  - [ ] Scale down when CPU < 30%

- [ ] Set up Backups:
  - [ ] PostgreSQL: Enable automated backups
  - [ ] App Service: Enable backup schedule

- [ ] Configure Monitoring Alerts:
  - [ ] HTTP 5xx errors > 5 in 5 minutes
  - [ ] Response time > 2 seconds
  - [ ] CPU > 80%
  - [ ] Database connection failures

- [ ] Enable Logging:
  - [ ] Application Insights → Log Analytics
  - [ ] Export logs to Storage Account (archival)
  - [ ] Configure retention policy

## Security Hardening

- [ ] Review CORS settings:
  - [ ] Change from "*" to specific domain
  - [ ] Verify only your frontend domain is allowed

- [ ] Database Security:
  - [ ] Disable public access (if possible)
  - [ ] Use Private Endpoint for connection
  - [ ] Enable SSL/TLS enforcement
  - [ ] Set strong password for database user

- [ ] Update Dependencies:
  ```bash
  pip list --outdated
  pip install --upgrade <vulnerable-package>
  ```

- [ ] Scan for CVE vulnerabilities:
  ```bash
  pip install safety
  safety check
  ```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Database connection refused" | Check DATABASE_URL, firewall rules, SSL mode, server status |
| "JWT token invalid" | Verify JWT_SECRET_KEY matches across instances |
| "Module not found" | Ensure all packages in requirements.txt are in Docker image |
| "Timeout during startup" | Increase App Service timeout, use Always On tier |
| "413 Payload too large" | Increase App Service request size limit in web.config |
| "No such file: init_db.py" | Verify startup script sets working directory to /app |

## Rollback Plan

If deployment fails:
```bash
# Revert to previous slot
az webapp deployment slot swap -g <group> -n <app> --slot staging

# Or redeploy previous version
az webapp config container set --name <app> --resource-group <group> --docker-custom-image-name <previous-image>
```

## Go-Live Checklist

- [ ] Load test: `locust` or Apache JMeter (target 100+ concurrent users)
- [ ] Security test: OWASP ZAP scan
- [ ] Backup database before go-live
- [ ] Notify team of deployment
- [ ] Monitor closely for 24 hours post-deployment
- [ ] Document any issues for future reference

---

**Deployment Owner**: 
**Date**: 
**Environment**: production
**Notes**: 

