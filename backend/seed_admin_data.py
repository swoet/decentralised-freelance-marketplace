# -*- coding: utf-8 -*-
#!/usr/bin/env python3
"""
Seed admin dashboard with sample data for testing
"""
import sys
import os
from datetime import datetime, timedelta
import random

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.db import SessionLocal
from app.models.user import User
from app.models.project import Project
from app.models.activity import ActivityLog, SystemMetrics, RevenueRecord, AIRequestLog, DisputeCase
import uuid


def seed_activities(db):
    """Seed activity logs"""
    print("Seeding activity logs...")
    
    # Get some users
    users = db.query(User).limit(10).all()
    if not users:
        print("No users found. Please create users first.")
        return
    
    activity_types = [
        ('user_signup', 'New user registered'),
        ('project_created', 'New project posted'),
        ('payment_completed', 'Payment processed successfully'),
        ('ai_match', 'AI matched freelancer to project'),
    ]
    
    # Create activities for the last 7 days
    for i in range(20):
        user = random.choice(users)
        activity_type, desc_template = random.choice(activity_types)
        
        activity = ActivityLog(
            user_id=user.id,
            activity_type=activity_type,
            description=f"{desc_template} - {user.email}",
            timestamp=datetime.utcnow() - timedelta(days=random.randint(0, 7)),
            extra_data={"source": "seed_script"}
        )
        db.add(activity)
    
    db.commit()
    print(f"[OK] Created 20 activity logs")


def seed_system_metrics(db):
    """Seed system metrics"""
    print("Seeding system metrics...")
    
    # Blockchain transactions metric
    for i in range(30):
        metric = SystemMetrics(
            metric_name="blockchain_transactions",
            metric_value=random.randint(100, 500),
            recorded_at=datetime.utcnow() - timedelta(days=i),
            extra_data={"network": "sepolia"}
        )
        db.add(metric)
    
    # API calls metric
    for i in range(30):
        metric = SystemMetrics(
            metric_name="api_calls",
            metric_value=random.randint(1000, 5000),
            recorded_at=datetime.utcnow() - timedelta(days=i),
            extra_data={"version": "v1"}
        )
        db.add(metric)
    
    db.commit()
    print(f"[OK] Created system metrics")


def seed_revenue_records(db):
    """Seed revenue records"""
    print("Seeding revenue records...")
    
    # Get users and projects
    users = db.query(User).limit(10).all()
    projects = db.query(Project).limit(5).all()
    
    if not users:
        print("No users found. Skipping revenue records.")
        return
    
    transaction_types = ['platform_fee', 'subscription', 'premium_listing']
    
    # Create revenue records for the last 60 days
    for i in range(50):
        client = random.choice(users)
        freelancer = random.choice(users) if random.random() > 0.5 else None
        project = random.choice(projects) if projects and random.random() > 0.3 else None
        
        revenue = RevenueRecord(
            project_id=project.id if project else None,
            client_id=client.id,
            freelancer_id=freelancer.id if freelancer else None,
            amount=random.uniform(5.0, 500.0),
            currency="USD",
            transaction_type=random.choice(transaction_types),
            payment_method=random.choice(['stripe', 'blockchain', 'escrow']),
            created_at=datetime.utcnow() - timedelta(days=random.randint(0, 60)),
            extra_data={"source": "seed_script"}
        )
        db.add(revenue)
    
    db.commit()
    print(f"[OK] Created 50 revenue records")


def seed_ai_request_logs(db):
    """Seed AI request logs"""
    print("Seeding AI request logs...")
    
    users = db.query(User).limit(10).all()
    if not users:
        print("No users found. Skipping AI request logs.")
        return
    
    request_types = ['matching', 'content_gen', 'skill_analysis']
    endpoints = ['/ai/matching', '/ai/content', '/ai/skills']
    
    # Create logs for the last 7 days
    for i in range(100):
        user = random.choice(users)
        success = random.random() > 0.1  # 90% success rate
        
        log = AIRequestLog(
            user_id=user.id if random.random() > 0.2 else None,
            request_type=random.choice(request_types),
            endpoint=random.choice(endpoints),
            tokens_used=random.randint(100, 2000),
            latency_ms=random.randint(50, 1500),
            success=success,
            error_message=None if success else "API rate limit exceeded",
            created_at=datetime.utcnow() - timedelta(days=random.randint(0, 7)),
            extra_data={"model": "gpt-4"}
        )
        db.add(log)
    
    db.commit()
    print(f"[OK] Created 100 AI request logs")


def seed_disputes(db):
    """Seed dispute cases"""
    print("Seeding dispute cases...")
    
    users = db.query(User).limit(10).all()
    projects = db.query(Project).limit(5).all()
    
    if not users or not projects:
        print("Not enough users or projects. Skipping disputes.")
        return
    
    categories = ['payment', 'quality', 'communication', 'deadline']
    statuses = ['pending', 'investigating', 'resolved', 'closed']
    priorities = ['low', 'medium', 'high', 'critical']
    
    dispute_templates = [
        ("Payment Not Received", "Freelancer completed work but payment was not released"),
        ("Poor Quality Work", "Deliverables do not meet the specified requirements"),
        ("Missed Deadline", "Project deadline was not met without prior communication"),
        ("Scope Creep", "Client requesting work beyond original project scope"),
        ("Communication Issues", "Lack of response to messages and updates"),
    ]
    
    for i in range(5):
        plaintiff = random.choice(users)
        defendant = random.choice([u for u in users if u.id != plaintiff.id])
        project = random.choice(projects)
        title, description = random.choice(dispute_templates)
        
        dispute = DisputeCase(
            project_id=project.id,
            raised_by=plaintiff.id,
            against_user=defendant.id,
            status=random.choice(statuses),
            priority=random.choice(priorities),
            category=random.choice(categories),
            title=title,
            description=description,
            evidence={"screenshots": [], "messages": []},
            resolution=None,
            resolved_by=None,
            resolved_at=None,
            created_at=datetime.utcnow() - timedelta(days=random.randint(0, 30)),
            updated_at=datetime.utcnow()
        )
        db.add(dispute)
    
    db.commit()
    print(f"[OK] Created 5 dispute cases")


def main():
    print("[START] Seeding Admin Dashboard Data")
    print("=" * 50)
    
    db = SessionLocal()
    
    try:
        seed_activities(db)
        seed_system_metrics(db)
        seed_revenue_records(db)
        seed_ai_request_logs(db)
        seed_disputes(db)
        
        print("\n" + "=" * 50)
        print("[SUCCESS] Admin dashboard data seeded successfully!")
        print("\nNext Steps:")
        print("1. Login to admin dashboard with super admin credentials")
        print("2. Navigate to dashboard to see stats and activity")
        print("3. Check analytics pages for revenue and user data")
        
    except Exception as e:
        print(f"[ERROR] Error seeding data: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
