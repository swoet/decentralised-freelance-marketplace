from sqlalchemy import create_engine, text
from app.core.config import settings

def fix_escrow_table():
    engine = create_engine(settings.DATABASE_URL_FIXED)
    
    try:
        with engine.begin() as conn:
            # Check if column already exists
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='escrow_contracts' 
                AND table_schema='marketplace' 
                AND column_name='chain_id'
            """))
            
            if not result.fetchone():
                # Add the missing column
                conn.execute(text("""
                    ALTER TABLE marketplace.escrow_contracts 
                    ADD COLUMN chain_id VARCHAR(50) DEFAULT 'ethereum'
                """))
                print("✅ Added chain_id column to escrow_contracts table")
            else:
                print("ℹ️  chain_id column already exists in escrow_contracts table")
                
    except Exception as e:
        print(f"❌ Error fixing escrow_contracts table: {e}")

if __name__ == "__main__":
    fix_escrow_table()
