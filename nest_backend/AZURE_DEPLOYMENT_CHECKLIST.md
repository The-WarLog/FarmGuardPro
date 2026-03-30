# AZURE DEPLOYMENT CHECKLIST

## ⚠️ CRITICAL - Security Issues for Cloud

1. **JWT Secret Key** (JWT/config.py)
   - Current: Has default value "change-this-secret-in-production"
   - Action: Remove default, require env var JWT_SECRET_KEY in Azure
   - Fix:
     ```python
     JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
     if not JWT_SECRET_KEY:
         raise ValueError("JWT_SECRET_KEY environment variable not set")
     ```

2. **Weather API Key** (controller/weatherinfo.py:14)
   - Current: Has hardcoded fallback API key
   - Action: Remove hardcoded key, require env var API_KEY in Azure
   - Fix:
     ```python
     apikey = os.getenv("API_KEY")
     if not apikey:
         raise ValueError("API_KEY environment variable not set")
     ```

3. **Database URL** (db/database.py:11)
   - Current: Loads from DATABASE_URL env var
   - Action: Required - Set in Azure App Service > Configuration > Connection strings
   - Format: postgresql://user:pass@host:5432/dbname

## 🔧 CONFIGURATION NEEDED FOR AZURE

### Environment Variables to Set:
```
DATABASE_URL = postgresql://epics-db-server.postgres.database.azure.com:5432/epics_db?sslmode=require&user=epicsadmin%40epics-db-server&password=YourSecurePassword
JWT_SECRET_KEY = (generate strong key: openssl rand -hex 32)
API_KEY = (your OpenWeatherMap API key)
AZURE_STORAGE_CONNECTION_STRING = (for file uploads, if using blob storage)
CORS_ORIGINS = https://yourdomain.com
```

## 📁 FILE UPLOAD HANDLING

Current: Saves locally (hugging_face.py, plantapi/)
For Azure:
- Option 1: Use Azure Blob Storage
- Option 2: Store in Azure App Service /tmp (temporary, not persistent)
- Current code needs update for cloud persistence

## ⚡ PERFORMANCE CONSIDERATIONS

1. **transformers & torch are heavy** (3-4 GB):
   - Cold start may take 2-3 minutes first time
   - Consider: Azure Container Instances with GPU F-series or Dedicated App Service Plan

2. **Model caching**:
   - First API call loads model from Hugging Face (~2-3 GB download)
   - Subsequent calls are fast
   - Cache models in startup event

3. **Concurrent requests**:
   - Set `workers` in gunicorn config for production
   - Azure App Service: Set WEBSITES_ENABLE_APP_SERVICE_STORAGE=true

## 🚀 DEPLOYMENT STEPS

1. Create PostgreSQL database on Azure
2. Set all environment variables above
3. Deploy code
4. Run: `create_db_and_tables()` (automatic on app startup)
5. Test with test_login.html

## ✅ VALIDATION CHECKLIST

- [ ] JWT_SECRET_KEY is long (32+ chars) and from Azure, not default
- [ ] API_KEY is set in Azure env vars (no hardcoded fallback)
- [ ] DATABASE_URL uses Azure PostgreSQL connection string
- [ ] CORS_ORIGINS set to your frontend domain (not *)
- [ ] Tested register/login flow
- [ ] Tested weather endpoint
- [ ] Tested profile endpoints with JWT
- [ ] No local file paths in code (use env vars for all paths)
- [ ] Added logging for debugging cloud issues (optional but recommended)

## 📝 MONITORING & LOGGING

Add to main.py for production debugging:
```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.on_event("startup")
def startup():
    logger.info("App starting up")
    create_db_and_tables()
    logger.info("Database initialized")
```

## 🐳 ALTERNATIVE: DOCKER FOR AZURE

If using Container Instances:
Create Dockerfile:
```
FROM python:3.11
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "main:app", "--bind", "0.0.0.0:8000"]
```

## DONE ✓
- requirements.txt updated with all dependencies
- All external packages listed
- Production ASGI server (gunicorn) added
- Azure SDK packages added (optional)
