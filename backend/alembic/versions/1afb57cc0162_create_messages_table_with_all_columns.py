"""Create messages table with all columns

Revision ID: 1afb57cc0162
Revises: a0d2e1a5f7bb
Create Date: 2025-09-30 14:32:12.040624

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1afb57cc0162'
down_revision: Union[str, Sequence[str], None] = 'a0d2e1a5f7bb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create messages table if it doesn't exist
    op.execute("""
        CREATE TABLE IF NOT EXISTS marketplace.messages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            content TEXT NOT NULL,
            project_id UUID NOT NULL REFERENCES marketplace.projects(id),
            sender_id UUID NOT NULL REFERENCES marketplace.users(id),
            recipient_id UUID REFERENCES marketplace.users(id),
            is_read BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
    """)
    
    # Add indexes for better performance
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_marketplace_messages_project_id 
        ON marketplace.messages(project_id);
    """)
    
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_marketplace_messages_sender_id 
        ON marketplace.messages(sender_id);
    """)
    
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_marketplace_messages_recipient_id 
        ON marketplace.messages(recipient_id);
    """)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('messages', schema='marketplace')
