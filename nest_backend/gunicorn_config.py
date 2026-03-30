# Gunicorn configuration for production deployment

import os
import multiprocessing

# Server socket
bind = "0.0.0.0:8000"
backlog = 512

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1  # Common formula
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
timeout = 120
keepalive = 5

# Logging
accesslog = "-"  # Log to stdout for Azure
errorlog = "-"   # Log to stderr for Azure
loglevel = os.getenv("LOG_LEVEL", "info").lower()
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = "epics-api"

# Application
max_requests = 1000
max_requests_jitter = 50
daemon = False
preload_app = False

# Server mechanics
capture_output = True
raw_env = []

# For Azure App Service compatibility
forwarded_allow_ips = "*"
secure_scheme_headers = {
    "X-FORWARDED-PROTOCOL": "ssl",
    "X-FORWARDED-PROTO": "https",
    "X-FORWARDED-SSL": "on",
}
