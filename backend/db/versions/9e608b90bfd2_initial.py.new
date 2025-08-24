"""initial

Revision ID: 9e608b90bfd2
Revises: None
Create Date: 2025-08-18 16:53:50.245948

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '9e608b90bfd2'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create initial tables."""
    # Create schema and set search path
    op.execute('CREATE SCHEMA IF NOT EXISTS marketplace')
    op.execute('SET search_path TO marketplace, public')
    
    # Create users table
    op.execute("""
    CREATE TABLE IF NOT EXISTS marketplace.users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR NOT NULL UNIQUE,
        hashed_password VARCHAR NOT NULL,
        full_name VARCHAR,
        role VARCHAR NOT NULL,
        is_active BOOLEAN NOT NULL,
        is_verified BOOLEAN NOT NULL,
        two_fa_enabled BOOLEAN NOT NULL,
        two_fa_secret VARCHAR,
        wallet_address VARCHAR,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ
    )""")
    
    # Create audit_logs table
    op.execute("""
    CREATE TABLE IF NOT EXISTS marketplace.audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        action VARCHAR NOT NULL,
        resource_type VARCHAR NOT NULL,
        resource_id VARCHAR NOT NULL,
        user_id UUID REFERENCES marketplace.users(id),
        details JSONB,
        ip_address VARCHAR,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ
    )""")
    
    # Create organizations table
    op.execute("""
    CREATE TABLE IF NOT EXISTS marketplace.organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        description TEXT,
        owner_id UUID NOT NULL REFERENCES marketplace.users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ
    )""")
    
    # Create portfolios table
    op.execute("""
    CREATE TABLE IF NOT EXISTS marketplace.portfolios (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR NOT NULL,
        description TEXT,
        url VARCHAR,
        user_id UUID NOT NULL REFERENCES marketplace.users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ
    )""")
    
    # Create projects table
    op.execute("""
    CREATE TABLE IF NOT EXISTS marketplace.projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID NOT NULL REFERENCES marketplace.users(id),
        org_id UUID REFERENCES marketplace.organizations(id),
        title VARCHAR NOT NULL,
        description TEXT NOT NULL,
        budget_min INTEGER,
        budget_max INTEGER,
        status VARCHAR NOT NULL DEFAULT 'draft',
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ
    )""")
    
    # Create bids table
    op.execute("""
    CREATE TABLE IF NOT EXISTS marketplace.bids (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES marketplace.projects(id),
        freelancer_id UUID NOT NULL REFERENCES marketplace.users(id),
        amount INTEGER NOT NULL,
        proposal TEXT NOT NULL,
        status VARCHAR NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ
    )""")
    
    # Create milestones table
    op.execute("""
    CREATE TABLE IF NOT EXISTS marketplace.milestones (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES marketplace.projects(id),
        title VARCHAR NOT NULL,
        description TEXT,
        amount INTEGER NOT NULL,
        due_date TIMESTAMPTZ,
        status VARCHAR NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ
    )""")
    
    # Create escrow_contracts table
    op.execute("""
    CREATE TABLE IF NOT EXISTS marketplace.escrow_contracts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES marketplace.projects(id),
        contract_address VARCHAR NOT NULL,
        status VARCHAR NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ
    )""")
    
    # Create messages table
    op.execute("""
    CREATE TABLE IF NOT EXISTS marketplace.messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id UUID NOT NULL REFERENCES marketplace.users(id),
        receiver_id UUID NOT NULL REFERENCES marketplace.users(id),
        content TEXT NOT NULL,
        project_id UUID REFERENCES marketplace.projects(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ
    )""")
    
    # Create reviews table
    op.execute("""
    CREATE TABLE IF NOT EXISTS marketplace.reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES marketplace.projects(id),
        reviewer_id UUID NOT NULL REFERENCES marketplace.users(id),
        reviewee_id UUID NOT NULL REFERENCES marketplace.users(id),
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ
    )""")


def downgrade() -> None:
    """Drop all tables and schema."""
    tables = [
        'reviews', 'messages', 'escrow_contracts', 'milestones', 
        'bids', 'projects', 'portfolios', 'organizations', 
        'audit_logs', 'users'
    ]
    
    # Drop tables in reverse order to handle dependencies
    for table in tables:
        op.execute(f'DROP TABLE IF EXISTS marketplace.{table} CASCADE')
    
    # Drop schema
    op.execute('DROP SCHEMA IF EXISTS marketplace CASCADE')
