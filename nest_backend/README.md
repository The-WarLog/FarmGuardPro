# EPICS Backend API

A modern FastAPI backend with JWT authentication, PostgreSQL database, and Azure cloud-ready deployment.

## Features

✨ **Core Features**
- FastAPI web framework with async/await patterns
- JWT authentication (register, login, protected endpoints)
- User profile management with relationships
- Weather API integration (OpenWeatherMap)
- PostgreSQL database with SQLModel ORM
- Pydantic validation for request/response
- CORS middleware for cross-origin requests
- Comprehensive error handling

🔒 **Security**
- Password hashing with pbkdf2
- JWT tokens with configurable expiration
- HTTPBearer token extraction
- Type-safe database operations
- Environment variable validation

☁️ **Cloud Ready**
- Docker multi-stage build optimized for size
- Gunicorn production ASGI server
- Azure App Service compatibility
- Health check endpoint
- Structured logging for cloud analysis
- Non-root Docker user

## Project Structure

```
.
├── main.py                          # FastAPI app entry point
├── controller/
│   ├── add_user.py                 # Auth endpoints (register, login, me)
│   ├── addprofilesdeatils.py       # Profile endpoints (CRUD)
│   └── weatherinfo.py              # Weather API integration
├── routes/
│   ├── auth_route.py               # Auth router
│   ├── user_route.py               # Profile router
│   └── weather_route.py            # Weather router
├── db/
│   └── database.py                 # SQLAlchemy setup, session management
├── model/
│   ├── user.py                     # User SQLModel
│   └── user_profile_details.py     # UserProfileDetails SQLModel
├── JWT/
│   ├── jwt_handler.py              # Custom JWT encode/decode
│   ├── dependencies.py             # FastAPI Depends() helpers
│   ├── security.py                 # Password hashing
│   └── config.py                   # JWT configuration
├── test_login.html                 # Frontend test page
├── requirements.txt                # Python dependencies
├── Dockerfile                      # Multi-stage Docker build
├── docker-compose.yml              # Local dev with PostgreSQL
├── gunicorn_config.py              # Production server config
├── startup.sh                       # Azure App Service startup
├── init_db.py                      # Database initialization
├── .env.example                    # Environment template
├── AZURE_DEPLOYMENT.md             # Azure deployment guide
├── DEPLOYMENT_CHECKLIST.md         # Pre/post deployment tasks
└── README.md                       # This file
```

## Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL 13+ or Azure PostgreSQL
- OpenWeatherMap API key (free tier)

### Local Development

1. **Clone & Install**
   ```bash
   cd nest_backend
   pip install -r requirements.txt
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Run Server**
   ```bash
   uvicorn main:app --reload
   ```

4. **Test API**
   - Open `test_login.html` in browser
   - Or: `curl http://localhost:8000/health`

### Docker Development

1. **Using Docker Compose** (includes PostgreSQL)
   ```bash
   docker-compose up
   ```

2. **Docker Standalone**
   ```bash
   docker build -t epics-api:latest .
   docker run -p 8000:8000 \
     -e DATABASE_URL="postgresql://..." \
     -e JWT_SECRET_KEY="..." \
     -e API_KEY="..." \
     epics-api:latest
   ```

## API Endpoints

### Authentication
```
POST   /api/auth/register      # Register new user
POST   /api/auth/login         # Login (returns JWT token)
GET    /api/auth/me            # Get current user [Protected]
```

### Profile Management
```
GET    /api/profile/user-bio   # Get user profile [Protected]
POST   /api/profile/add-bio    # Create profile [Protected]
```

### Weather
```
GET    /api/weather?city=London  # Get weather for city
GET    /api/weather/{city}       # Get weather for city (path param)
```

### Health
```
GET    /                        # Health check
GET    /health                  # Health check
```

## Authentication Flow

1. **Register**: POST `/api/auth/register` with email & password
   ```json
   {
     "email": "user@example.com",
     "password": "SecurePassword123!"
   }
   ```
   Returns: `{"access_token": "eyJ0eXAi...", "token_type": "Bearer"}`

2. **Login**: POST `/api/auth/login` with email & password
   Returns: Same as register

3. **Protected Requests**: Include token in header
   ```
   Authorization: Bearer eyJ0eXAi...
   ```

4. **Get Current User**: GET `/api/auth/me` with token
   Returns: Current user data

## Database Schema

### users table
- `id` (Primary Key)
- `email` (Unique, Indexed)
- `password` (Hashed)
- `is_admin` (Boolean, default: false)
- `created_at`, `updated_at` (Timestamps)

### user_profile_details table
- `id` (Primary Key)
- `user_id` (Foreign Key to users)
- `full_name`, `phone_number`, `email` (Unique)
- `address`, `city`, `state`, `pin_code`, `country`
- `created_at`, `updated_at` (Timestamps)

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET_KEY` - 256-bit hex key (generate: `openssl rand -hex 32`)
- `API_KEY` - OpenWeatherMap API key

Optional:
- `CORS_ORIGINS` - Comma-separated allowed domains (default: *)
- `ENVIRONMENT` - development/staging/production
- `LOG_LEVEL` - DEBUG/INFO/WARNING/ERROR
- `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` - Token expiration (default: 1440 = 24h)

See [.env.example](.env.example) for all options.

## Deployment

### Local Testing
```bash
# With PostgreSQL
docker-compose up

# Without Docker (uses existing PostgreSQL)
python init_db.py          # Initialize database
uvicorn main:app --reload  # Start server
```

### Azure Deployment
See [AZURE_DEPLOYMENT.md](AZURE_DEPLOYMENT.md) for step-by-step instructions.

Quick summary:
1. Set environment variables in Azure App Service Configuration
2. Build & push Docker image to Azure Container Registry
3. Deploy to Azure App Service
4. Run `python init_db.py` via SSH/Kudu
5. Test with `test_login.html` against Azure URL

### Pre-Deployment Checklist
See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for comprehensive checklist.

## Technology Stack

**Backend**
- FastAPI 0.104.1 - Web framework
- Uvicorn 0.24.0 - ASGI server (dev)
- Gunicorn 21.2.0 - ASGI server (prod)

**Database**
- SQLModel 0.0.14 - ORM
- SQLAlchemy 2.0.23 - SQL toolkit
- psycopg2-binary 2.9.9 - PostgreSQL driver

**Authentication**
- PyJWT 2.8.1 - JWT utilities
- Custom HMAC-SHA256 implementation

**HTTP Clients**
- aiohttp 3.9.1 - Async HTTP
- requests 2.31.0 - Sync HTTP
- httpx 0.25.1 - Modern HTTP

**ML/AI** (Optional)
- transformers 4.35.2 - NLP models
- torch 2.1.1 - Deep learning
- torchvision 0.16.1 - Vision models

**Cloud**
- azure-identity 1.14.0
- azure-storage-blob 12.19.0
- python-dotenv 1.0.0

See [requirements.txt](requirements.txt) for complete list with versions.

## Development

### Running Tests
```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest tests/ -v
```

### Code Style
```bash
# Format code
black .

# Lint
flake8 .

# Type checking
mypy .
```

### Adding New Endpoints
1. Create controller in `controller/new_feature.py`
2. Create router in `routes/new_feature_route.py`
3. Import and mount in `main.py`
4. Add tests in `tests/test_new_feature.py`

## Troubleshooting

### "Database connection refused"
- Check `DATABASE_URL` is correct
- Verify PostgreSQL server is running
- Check firewall rules (if Azure)
- Test with: `psql $DATABASE_URL`

### "JWT token invalid"
- Ensure `JWT_SECRET_KEY` matches across all instances
- Check token hasn't expired (default: 24h)
- Verify Authorization header format: `Bearer <token>`

### "Module not found" in Docker
- Ensure all imports are in `requirements.txt`
- Rebuild Docker image: `docker build --no-cache .`

### Slow startup (2-3 minutes)
- Normal due to transformers/torch model loading
- Use Azure App Service "Always On" tier
- Pre-warm models in startup

## Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Commit changes: `git commit -am "Add my feature"`
3. Push: `git push origin feature/my-feature`
4. Create Pull Request

## License

MIT

## Support

For issues, questions, or suggestions:
- GitHub Issues: [Create issue](https://github.com/yourusername/epics-backend/issues)
- Email: support@yourdomain.com
- Documentation: [AZURE_DEPLOYMENT.md](AZURE_DEPLOYMENT.md)

## Changelog

### v1.0.0 (2024)
- Initial release with JWT auth, user profiles, weather API
- Docker support with Azure compatibility
- Production-ready with Gunicorn configuration
- Comprehensive deployment documentation

---

**Status**: Production Ready ✅ | **Tested**: Local + Docker | **cloud**: Azure Ready ☁️
