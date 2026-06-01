"""
Run this script once after each DB wipe to create the admin user.
Usage: python create_admin.py

Defaults: username=admin, password=admin123, email=admin@kronos.local
Override with env vars: ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_EMAIL
"""
import os
from dotenv import load_dotenv

load_dotenv()

from datetime import datetime
from database import SessionLocal
from models import User, UserRole
from core.security import hash_password

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@kronos.local")

db = SessionLocal()
try:
    existing = db.query(User).filter(User.username == ADMIN_USERNAME).first()
    if existing:
        print(f"Admin user '{ADMIN_USERNAME}' already exists.")
    else:
        now = datetime.utcnow()
        admin = User(
            fname="Admin",
            lname="User",
            email=ADMIN_EMAIL,
            username=ADMIN_USERNAME,
            password=hash_password(ADMIN_PASSWORD),
            u_role=UserRole.admin,
            createdAt=now,
            updatedAt=now,
        )
        db.add(admin)
        db.commit()
        print(f"Admin user '{ADMIN_USERNAME}' created successfully.")
        print(f"Login: username={ADMIN_USERNAME}, password={ADMIN_PASSWORD}")
finally:
    db.close()
