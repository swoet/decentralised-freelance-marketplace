#!/usr/bin/env python3

import sqlite3
import os
from datetime import datetime

def init_database():
    # Remove existing database if it exists
    db_path = "freelance_marketplace.db"
    if os.path.exists(db_path):
        os.remove(db_path)
    
    # Create connection to SQLite database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute("""
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email VARCHAR(255) UNIQUE NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            hashed_password VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL DEFAULT 'client',
            is_active BOOLEAN DEFAULT 1,
            is_verified BOOLEAN DEFAULT 0,
            wallet_address VARCHAR(255),
            bio TEXT,
            skills TEXT,  -- JSON string for now
            location VARCHAR(255),
            profile_picture VARCHAR(255),
            hourly_rate DECIMAL(10, 2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create projects table
    cursor.execute("""
        CREATE TABLE projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            budget DECIMAL(10, 2) NOT NULL,
            client_id INTEGER NOT NULL,
            freelancer_id INTEGER,
            status VARCHAR(50) DEFAULT 'open',
            skills_required TEXT,  -- JSON string
            deadline DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (client_id) REFERENCES users(id),
            FOREIGN KEY (freelancer_id) REFERENCES users(id)
        )
    """)
    
    # Create messages table  
    cursor.execute("""
        CREATE TABLE messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            project_id INTEGER,
            content TEXT NOT NULL,
            is_read BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sender_id) REFERENCES users(id),
            FOREIGN KEY (receiver_id) REFERENCES users(id),
            FOREIGN KEY (project_id) REFERENCES projects(id)
        )
    """)
    
    # Create alembic version table for compatibility
    cursor.execute("""
        CREATE TABLE alembic_version (
            version_num VARCHAR(32) PRIMARY KEY
        )
    """)
    
    # Insert a dummy alembic version
    cursor.execute("INSERT INTO alembic_version (version_num) VALUES ('sqlite_init')")
    
    conn.commit()
    conn.close()
    
    print(f"✅ SQLite database '{db_path}' created successfully!")
    print("✅ Basic tables created: users, projects, messages")
    print("✅ Database is ready for authentication!")

if __name__ == "__main__":
    init_database()