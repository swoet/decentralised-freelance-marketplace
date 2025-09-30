"""Add is_read column to messages table

Revision ID: 71991348e38b
Revises: 1afb57cc0162
Create Date: 2025-09-30 15:12:08.712610

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '71991348e38b'
down_revision: Union[str, Sequence[str], None] = '1afb57cc0162'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add is_read column to messages table if it doesn't exist
    op.execute("""
        DO $$ 
        BEGIN 
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'marketplace' 
                AND table_name = 'messages' 
                AND column_name = 'is_read'
            ) THEN
                ALTER TABLE marketplace.messages 
                ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT FALSE;
            END IF;
        END $$;
    """)


def downgrade() -> None:
    """Downgrade schema."""
    # Remove is_read column
    op.execute("""
        ALTER TABLE marketplace.messages 
        DROP COLUMN IF EXISTS is_read;
    """)
