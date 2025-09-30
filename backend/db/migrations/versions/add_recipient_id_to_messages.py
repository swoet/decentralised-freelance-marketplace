"""Add recipient_id to messages table

Revision ID: add_recipient_id
Revises: 5c9cb7e3b9c5
Create Date: 2025-09-30 08:27:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_recipient_id'
down_revision = '5c9cb7e3b9c5'
branch_labels = None
depends_on = None


def upgrade():
    # Add recipient_id column to messages table if it doesn't exist
    op.execute("""
        DO $$ 
        BEGIN 
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'marketplace' 
                AND table_name = 'messages' 
                AND column_name = 'recipient_id'
            ) THEN
                ALTER TABLE marketplace.messages 
                ADD COLUMN recipient_id UUID REFERENCES marketplace.users(id);
            END IF;
        END $$;
    """)


def downgrade():
    # Remove recipient_id column
    op.drop_column('messages', 'recipient_id', schema='marketplace')
