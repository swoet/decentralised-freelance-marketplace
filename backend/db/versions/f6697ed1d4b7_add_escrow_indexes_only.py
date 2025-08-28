"""add_escrow_indexes_only

Revision ID: f6697ed1d4b7
Revises: '31c0f0a57975'
Create Date: 2025-08-28 01:55:14.853193

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f6697ed1d4b7'
down_revision = '31c0f0a57975'
branch_labels = None
depends_on = None

SCHEMA = 'marketplace'


def upgrade() -> None:
    """Add missing columns and indexes to escrow_contracts table."""
    
    # Get connection to check for existing columns in the marketplace schema
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_columns = [col['name'] for col in inspector.get_columns('escrow_contracts', schema=SCHEMA)]
    
    # Add missing columns only if they don't exist
    if 'client_id' not in existing_columns:
        op.add_column('escrow_contracts', 
            sa.Column('client_id', sa.UUID(), nullable=True), schema=SCHEMA
        )
    
    if 'freelancer_id' not in existing_columns:
        op.add_column('escrow_contracts', 
            sa.Column('freelancer_id', sa.UUID(), nullable=True), schema=SCHEMA
        )
    
    if 'total_amount' not in existing_columns:
        op.add_column('escrow_contracts', 
            sa.Column('total_amount', sa.Numeric(), nullable=True), schema=SCHEMA
        )

    # Create foreign key constraints (only if they don't exist)
    existing_constraints = [fk['name'] for fk in inspector.get_foreign_keys('escrow_contracts', schema=SCHEMA)]
    
    if 'fk_escrow_contracts_client_id_users' not in existing_constraints and 'client_id' in [col['name'] for col in inspector.get_columns('escrow_contracts', schema=SCHEMA)]:
        op.create_foreign_key(
            'fk_escrow_contracts_client_id_users',
            'escrow_contracts', 'users',
            ['client_id'], ['id'],
            source_schema=SCHEMA, referent_schema=SCHEMA
        )
    
    if 'fk_escrow_contracts_freelancer_id_users' not in existing_constraints and 'freelancer_id' in [col['name'] for col in inspector.get_columns('escrow_contracts', schema=SCHEMA)]:
        op.create_foreign_key(
            'fk_escrow_contracts_freelancer_id_users',
            'escrow_contracts', 'users',
            ['freelancer_id'], ['id'],
            source_schema=SCHEMA, referent_schema=SCHEMA
        )
    
    # Add indexes for common query patterns (with schema and if_not_exists for idempotency)
    op.create_index(
        'ix_escrow_contracts_client_id', 
        'escrow_contracts', 
        ['client_id'],
        if_not_exists=True,
        schema=SCHEMA
    )
    
    op.create_index(
        'ix_escrow_contracts_freelancer_id', 
        'escrow_contracts', 
        ['freelancer_id'],
        if_not_exists=True,
        schema=SCHEMA
    )
    
    op.create_index(
        'ix_escrow_contracts_project_id', 
        'escrow_contracts', 
        ['project_id'],
        if_not_exists=True,
        schema=SCHEMA
    )
    
    op.create_index(
        'ix_escrow_contracts_status', 
        'escrow_contracts', 
        ['status'],
        if_not_exists=True,
        schema=SCHEMA
    )
    
    op.create_index(
        'ix_escrow_contracts_chain_id', 
        'escrow_contracts', 
        ['chain_id'],
        if_not_exists=True,
        schema=SCHEMA
    )
    
    op.create_index(
        'ix_escrow_contracts_contract_address', 
        'escrow_contracts', 
        ['contract_address'],
        unique=True,
        if_not_exists=True,
        schema=SCHEMA
    )
    
    # Composite indexes for user-specific queries
    op.create_index(
        'ix_escrow_contracts_client_status', 
        'escrow_contracts', 
        ['client_id', 'status'],
        if_not_exists=True,
        schema=SCHEMA
    )
    
    op.create_index(
        'ix_escrow_contracts_freelancer_status', 
        'escrow_contracts', 
        ['freelancer_id', 'status'],
        if_not_exists=True,
        schema=SCHEMA
    )
    
    # Index for created_at for ordering
    op.create_index(
        'ix_escrow_contracts_created_at', 
        'escrow_contracts', 
        ['created_at'],
        if_not_exists=True,
        schema=SCHEMA
    )


def downgrade() -> None:
    """Remove the indexes and constraints added in upgrade."""
    
    # Drop indexes first (with schema)
    op.drop_index('ix_escrow_contracts_created_at', table_name='escrow_contracts', schema=SCHEMA)
    op.drop_index('ix_escrow_contracts_freelancer_status', table_name='escrow_contracts', schema=SCHEMA)
    op.drop_index('ix_escrow_contracts_client_status', table_name='escrow_contracts', schema=SCHEMA)
    op.drop_index('ix_escrow_contracts_contract_address', table_name='escrow_contracts', schema=SCHEMA)
    op.drop_index('ix_escrow_contracts_chain_id', table_name='escrow_contracts', schema=SCHEMA)
    op.drop_index('ix_escrow_contracts_status', table_name='escrow_contracts', schema=SCHEMA)
    op.drop_index('ix_escrow_contracts_project_id', table_name='escrow_contracts', schema=SCHEMA)
    op.drop_index('ix_escrow_contracts_freelancer_id', table_name='escrow_contracts', schema=SCHEMA)
    op.drop_index('ix_escrow_contracts_client_id', table_name='escrow_contracts', schema=SCHEMA)
    
    # Drop foreign key constraints
    op.drop_constraint('fk_escrow_contracts_freelancer_id_users', 'escrow_contracts', type_='foreignkey', schema=SCHEMA)
    op.drop_constraint('fk_escrow_contracts_client_id_users', 'escrow_contracts', type_='foreignkey', schema=SCHEMA)
    
    # Drop only the columns we added (not the ones from previous migrations)
    op.drop_column('escrow_contracts', 'total_amount', schema=SCHEMA)
    op.drop_column('escrow_contracts', 'freelancer_id', schema=SCHEMA)
    op.drop_column('escrow_contracts', 'client_id', schema=SCHEMA)