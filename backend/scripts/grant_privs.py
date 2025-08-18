import os
from urllib.parse import urlparse
from sqlalchemy import create_engine, text


def main():

	app_db_url = os.getenv("DATABASE_URL")
	if not app_db_url:
		# Fallback to app settings if env not provided
		import sys
		sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'app'))
		from app.core.config import settings
		app_db_url = settings.DATABASE_URL_FIXED

	super_url = os.getenv("PG_SUPER_URL")
	if not super_url:
		raise SystemExit("PG_SUPER_URL env var is required, e.g. postgresql://postgres:YOURPASS@localhost:5432/postgres")

	# Parse pieces from the application DATABASE_URL
	parsed = urlparse(app_db_url)
	app_username = parsed.username
	app_password = parsed.password
	app_host = parsed.hostname or "localhost"
	app_port = parsed.port or 5432
	app_dbname = parsed.path.lstrip('/')

	print("Target DB:", app_dbname, "User:", app_username, "Host:", app_host, "Port:", app_port)

	engine = create_engine(super_url, pool_pre_ping=True)
	with engine.connect() as conn:
		conn.execution_options(isolation_level="AUTOCOMMIT")
		# Ensure role exists and password is set
		conn.execute(text(
			"""
			DO $$
			BEGIN
				IF NOT EXISTS (
					SELECT FROM pg_roles WHERE rolname = :role
				) THEN
					EXECUTE format('CREATE ROLE %I LOGIN PASSWORD %L', :role, :pwd);
				ELSE
					EXECUTE format('ALTER ROLE %I LOGIN PASSWORD %L', :role, :pwd);
				END IF;
			END
			$$;
			"""
		), {"role": app_username, "pwd": app_password})

		# Grant create schema on the database and transfer ownership if possible
		conn.execute(text("""GRANT CREATE ON DATABASE """ + app_dbname + " TO \"" + app_username + "\""))
		try:
			conn.execute(text("""ALTER DATABASE """ + app_dbname + " OWNER TO \"" + app_username + "\""))
		except Exception as e:
			print("ALTER DATABASE owner skipped (needs superuser or current owner):", e)

		# Create a dedicated schema owned by the app user
		conn.execute(text("""
		DO $$
		BEGIN
			IF NOT EXISTS (
				SELECT 1 FROM information_schema.schemata WHERE schema_name = 'marketplace'
			) THEN
				EXECUTE format('CREATE SCHEMA %I AUTHORIZATION %I', 'marketplace', :role);
			END IF;
			BEGIN
				EXECUTE format('ALTER SCHEMA %I OWNER TO %I', 'marketplace', :role);
			EXCEPTION WHEN insufficient_privilege THEN
				RAISE NOTICE 'ALTER SCHEMA owner skipped';
			END;
		END$$;
		"""), {"role": app_username})

		# Ensure public schema is owned by app user (best-effort)
		try:
			conn.execute(text("ALTER SCHEMA public OWNER TO \"" + app_username + "\""))
		except Exception as e:
			print("ALTER SCHEMA public owner skipped:", e)

		# Default privileges for future objects in marketplace
		conn.execute(text("""
		ALTER DEFAULT PRIVILEGES IN SCHEMA marketplace GRANT ALL ON TABLES TO """ + '"' + app_username + '"'))

	print("Privileges and schema setup attempted. Now run: alembic upgrade head")


if __name__ == "__main__":
	main()


