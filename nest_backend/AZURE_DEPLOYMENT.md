# Azure deployment configuration

## Quick Deployment Steps

### 1. Prerequisites
- Azure subscription
- Azure CLI installed locally
- PostgreSQL database created in Azure
- Container Registry (optional, for private images)

### 2. Set Up Environment Variables in Azure

Go to **Azure Portal > App Service > Configuration > Application settings** and add:

```
DATABASE_URL = postgresql://username@servername:password@servername.postgres.database.azure.com:5432/dbname?sslmode=require
JWT_SECRET_KEY = (generate: openssl rand -hex 32)
API_KEY = (from openweathermap.org)
CORS_ORIGINS = https://yourdomain.com
ENVIRONMENT = production
LOG_LEVEL = INFO
```

### 3. Deploy with Docker (Option A - Recommended)

```bash
# Build image
docker build -t epics-api:latest .

# Tag for Azure Container Registry
docker tag epics-api:latest <registry>.azurecr.io/epics-api:latest

# Push to Azure
docker push <registry>.azurecr.io/epics-api:latest

# Deploy to App Service
az webapp config container set \
  --name <app-name> \
  --resource-group <group-name> \
  --docker-custom-image-name <registry>.azurecr.io/epics-api:latest \
  --docker-registry-server-url https://<registry>.azurecr.io
```

### 4. Deploy with Code (Option B - Using ZIP)

```bash
# Create deployment package
zip -r deploy.zip . -x ".git/*" ".venv/*" "__pycache__/*" "*.pyc"

# Deploy
az webapp up --name <app-name> --resource-group <group-name> --runtime "python:3.11"
```

### 5. Configure Startup Command

In Azure Portal > App Service > Configuration > General:

**Startup Command:**
```
sh startup.sh
```

Or directly:
```
gunicorn -c gunicorn_config.py main:app
```

### 6. Test Deployment

```bash
# Check health
curl https://<app-name>.azurewebsites.net/health

# Test API
curl https://<app-name>.azurewebsites.net/api/weather?city=London

# View logs
az webapp log tail --name <app-name> --resource-group <group-name>
```

### 7. Database Migration (First-time only)

After deployment, run:
```bash
az webapp remote-exec -g <group-name> -n <app-name> --command "python init_db.py"
```

## Scaling Recommendations

- **App Service Plan**: Standard tier (B2 or higher for ML workloads)
- **Instances**: Start with 1, auto-scale to 3-5 based on CPU/Memory
- **Database**: Standard tier PostgreSQL with auto-backups
- **Storage**: Use Azure Blob Storage for file uploads (optional)

## Monitoring

Enable in Azure Portal:
- Application Insights
- Diagnostic logs (stdout/stderr)
- App Service Plan metrics

## Common Issues

| Issue | Solution |
|-------|----------|
| Cold start (2-3 min) | Normal for transformers/torch; use Always On in App Service Plan |
| Database connection error | Check DATABASE_URL, firewall rules, connection timeout |
| Model download timeout | Increase App Service timeout; pre-warm models in startup |
| JWT token errors | Verify JWT_SECRET_KEY is set and consistent across instances |

## Cost Optimization

- Use Always On = false for dev/test
- Scale down during off-hours with auto-scaling
- Use App Service Reserved Instance for predictable load
- Monitor with Cost Management tool

## Security Checklist

- [ ] HTTPS only enabled
- [ ] CORS restricted to your domain
- [ ] JWT_SECRET_KEY is strong (32+ chars)
- [ ] API_KEY not exposed in logs
- [ ] Database firewall only allows App Service
- [ ] No debug mode in production
- [ ] Regular security updates for dependencies

For more info: https://docs.microsoft.com/en-us/azure/app-service/
