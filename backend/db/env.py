from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool, text
from sqlalchemy.engine import Connection

from alembic import context
from app.core.config import settings

# Import all models to register them with SQLAlchemy for Alembic migrations
# These imports are required even though they appear unused
from app.models import (  # type: ignore # noqa
    audit_log,  # type: ignore
    bid,  # type: ignore
    escrow_contract,  # type: ignore
    message,  # type: ignore
    milestone,  # type: ignore
    organization,  # type: ignore
    portfolio,  # type: ignore
    project,  # type: ignore
    review,  # type: ignore
    user,  # type: ignore
)

from app.models.base import Base

# Create new metadata with schema and set it up with Base
target_metadata = Base.metadata
target_metadata.schema = 'marketplace'

# Alembic configuration
config = context.config

# Configure logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set database URL from application settings
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL_FIXED.replace('%', '%%'))

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.

def include_schemas(connection: Connection) -> None:
    """Create schema and set search path."""
    connection.execute(text('CREATE SCHEMA IF NOT EXISTS marketplace'))
    connection.execute(text('SET search_path TO marketplace'))


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        version_table_schema="marketplace",
        version_table="alembic_version",
        include_schemas=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def setup_alembic_version_table(connection: Connection) -> None:
    """Create alembic_version table in marketplace schema."""
    connection.execute(text("""
        CREATE TABLE IF NOT EXISTS marketplace.alembic_version (
            version_num VARCHAR(32) NOT NULL,
            CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
        )
    """))

def setup_schema(connection: Connection) -> None:
    """Create schema and set permissions."""
    connection.execute(text("""
        CREATE SCHEMA IF NOT EXISTS marketplace;
        SET search_path TO marketplace;
        GRANT ALL ON SCHEMA marketplace TO CURRENT_USER;
    """))

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    configuration = config.get_section(config.config_ini_section)
    if configuration is None:
        raise Exception("Configuration section not found")
        
    connectable = engine_from_config(
        dict(configuration),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    # First create schema and version table in a separate transaction
    with connectable.connect() as connection:
        connection.execute(text('CREATE SCHEMA IF NOT EXISTS marketplace'))
        connection.execute(text('SET search_path TO marketplace, public'))
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS marketplace.alembic_version (
                version_num VARCHAR(32) NOT NULL,
                CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
            )
        """))
        connection.commit()

    # Now run migrations in a new transaction
    with connectable.begin() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            include_schemas=True,
            version_table_schema="marketplace",
            version_table="alembic_version",
            include_object=lambda obj, name, type_, reflected, compare_to: True,
            compare_type=True,
        )

        # Run the migrations
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online() 