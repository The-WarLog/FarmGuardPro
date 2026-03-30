#!/usr/bin/env python3
"""
Initialize database for Azure deployment.
Run this once after deployment to create all tables.

Usage:
    python init_db.py
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Validate required env vars before initializing
required_vars = ["DATABASE_URL", "JWT_SECRET_KEY", "API_KEY"]
missing_vars = [var for var in required_vars if not os.getenv(var)]

if missing_vars:
    print(f"❌ ERROR: Missing required environment variables: {', '.join(missing_vars)}")
    print("Set them in Azure App Service > Configuration > Application settings")
    sys.exit(1)

try:
    from db.database import create_db_and_tables, ping_database
    
    print("🔍 Checking database connectivity...")
    if not ping_database():
        print("❌ ERROR: Cannot connect to database")
        print("Check DATABASE_URL in Azure App Service configuration")
        sys.exit(1)
    
    print("✅ Database connection successful")
    print("📋 Creating tables...")
    create_db_and_tables()
    print("✅ Tables created successfully")
    print("\n🎉 Database initialization complete!")
    print("Your EPICS API is ready for use.")
    
except Exception as e:
    print(f"❌ ERROR during initialization: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
