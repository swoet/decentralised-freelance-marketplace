"""Enhance escrow contract table with indexes and constraints

Revision ID: 001_enhance_escrow_contract
Revises: 
Create Date: 2024-08-26 11:35:18.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_enhance_escrow_contract'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add indexes and constraints to escrow_contracts table for better performance."""
    
    # Add indexes for common query patterns
    op.create_index(
        'ix_escrow_contracts_client_id', 
        'escrow_contracts', 
        ['client_id']
    )
    
    op.create_index(
        'ix_escrow_contracts_freelancer_id', 
        'escrow_contracts', 
        ['freelancer_id']
    )
    
    op.create_index(
        'ix_escrow_contracts_project_id', 
        'escrow_contracts', 
        ['project_id']
    )
    
    op.create_index(
        'ix_escrow_contracts_status', 
        'escrow_contracts', 
        ['status']
    )
    
    op.create_index(
        'ix_escrow_contracts_chain_id', 
        'escrow_contracts', 
        ['chain_id']
    )
    
    op.create_index(
        'ix_escrow_contracts_contract_address', 
        'escrow_contracts', 
        ['contract_address'],
        unique=True
    )
    
    # Composite index for user-specific queries
    op.create_index(
        'ix_escrow_contracts_client_status', 
        'escrow_contracts', 
        ['client_id', 'status']
    )
    
    op.create_index(
        'ix_escrow_contracts_freelancer_status', 
        'escrow_contracts', 
        ['freelancer_id', 'status']
    )
    
    # Index for created_at for ordering
    op.create_index(
        'ix_escrow_contracts_created_at', 
        'escrow_contracts', 
        ['created_at']
    )


def downgrade() -> None:
    """Remove the indexes added in upgrade."""
    
    op.drop_index('ix_escrow_contracts_created_at', table_name='escrow_contracts')
    op.drop_index('ix_escrow_contracts_freelancer_status', table_name='escrow_contracts')
    op.drop_index('ix_escrow_contracts_client_status', table_name='escrow_contracts')
    op.drop_index('ix_escrow_contracts_contract_address', table_name='escrow_contracts')
    op.drop_index('ix_escrow_contracts_chain_id', table_name='escrow_contracts')
    op.drop_index('ix_escrow_contracts_status', table_name='escrow_contracts')
    op.drop_index('ix_escrow_contracts_project_id', table_name='escrow_contracts')
    op.drop_index('ix_escrow_contracts_freelancer_id', table_name='escrow_contracts')
    op.drop_index('ix_escrow_contracts_client_id', table_name='escrow_contracts')
