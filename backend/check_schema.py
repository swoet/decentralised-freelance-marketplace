import os
from sqlalchemy import create_engine, text, inspect

# Allow overriding via environment variable
database_url = os.getenv("DATABASE_URL")

if not database_url:
    # Fallback to app settings if env not provided
    import sys
    sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))
    from app.core.config import settings
    database_url = settings.DATABASE_URL_FIXED

engine = create_engine(database_url, pool_pre_ping=True)

with engine.connect() as connection:
    # Ensure we can see marketplace first
    connection.execute(text("SET search_path TO marketplace, public"))

    inspector = inspect(connection)
    schemas = inspector.get_schema_names()
    print("schemas:", schemas)

    marketplace_tables = inspector.get_table_names(schema="marketplace")
    public_tables = inspector.get_table_names(schema="public")

    print("marketplace tables:", sorted(marketplace_tables))
    print("public tables:", sorted(public_tables))


