"""
Quick fix script to make receiver_id nullable in messages table
"""
from sqlalchemy import create_engine, text
from app.core.config import settings

def fix_receiver_id():
    engine = create_engine(settings.DATABASE_URL_FIXED)
    with engine.connect() as conn:
        # Make receiver_id nullable
        conn.execute(text('ALTER TABLE marketplace.messages ALTER COLUMN receiver_id DROP NOT NULL'))
        conn.commit()
        print('[OK] receiver_id is now nullable')
        
        # Verify the change
        result = conn.execute(text("""
            SELECT column_name, is_nullable 
            FROM information_schema.columns 
            WHERE table_schema = 'marketplace' 
            AND table_name = 'messages' 
            AND column_name = 'receiver_id'
        """))
        row = result.fetchone()
        if row:
            print(f'[OK] Verified: receiver_id is_nullable = {row[1]}')

if __name__ == '__main__':
    fix_receiver_id()
