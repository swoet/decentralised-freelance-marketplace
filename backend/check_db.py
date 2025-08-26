import psycopg2
import sys

try:
    # Connect to database
    conn = psycopg2.connect(
        host='localhost',
        database='freelance_marketplace', 
        user='postgres',
        password='password'
    )
    cur = conn.cursor()
    
    # Check alembic version
    cur.execute("SELECT version_num FROM alembic_version")
    version = cur.fetchone()
    print(f"Current migration version: {version[0] if version else 'None'}")
    
    # Check tables in marketplace schema
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'marketplace' ORDER BY table_name")
    tables = cur.fetchall()
    print(f"Tables in marketplace schema ({len(tables)}):")
    for table in tables:
        print(f"  - {table[0]}")
    
    conn.close()
    print("Database check completed successfully")
    
except Exception as e:
    print(f"Database check failed: {e}")
    sys.exit(1)
