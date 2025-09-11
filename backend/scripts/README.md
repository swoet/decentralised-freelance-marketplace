# Migration Scripts

This directory contains utility scripts for safely managing Alembic database migrations.

## Scripts Overview

### `check_migrations.py`
Safety checker for Alembic migration files that validates migrations against best practices.

**Features:**
- Validates migration file structure
- Checks for dangerous operations
- Verifies schema usage
- Ensures proper rollback functions
- Compares database state with migration files

**Usage:**
```bash
# Check all migrations
python scripts/check_migrations.py

# Check specific migration file
python scripts/check_migrations.py --file alembic/versions/abc123def456_add_tables.py

# Check migrations and database state
python scripts/check_migrations.py --check-db

# Check migrations in different directory
python scripts/check_migrations.py --alembic-dir /path/to/alembic
```

**Example Output:**
```
🔍 Alembic Migration Safety Checker
==================================

📊 Checking database state...
Current database revision: abc123def456
Latest migration revision: abc123def456
✅ Database is up to date

Checking 3 migration files...

📄 alembic/versions/def456ghi789_add_ai_tables.py
=================================================
⚠️ [WARNING] (line 25): Table operation without schema specification: create_table
   💡 Suggestion: Add schema='marketplace' parameter

📊 Summary:
   Errors: 0
   Warnings: 1
   Info: 0

⚠️ Migration validation passed with warnings. Review before proceeding.
```

### `deploy_migrations.py`
Comprehensive deployment script for safely applying Alembic migrations with rollback capabilities.

**Features:**
- Automated database backup before migration
- Migration safety validation
- Automatic rollback on failure
- Database state verification
- Backup cleanup and management

**Usage:**
```bash
# Safe deployment with all checks
python scripts/deploy_migrations.py

# Dry run to see what would happen
python scripts/deploy_migrations.py --dry-run

# Skip backup (not recommended for production)
python scripts/deploy_migrations.py --skip-backup

# Skip safety checks (not recommended)
python scripts/deploy_migrations.py --skip-safety-checks

# Force deployment without prompts
python scripts/deploy_migrations.py --force

# Custom backup directory
python scripts/deploy_migrations.py --backup-dir /path/to/backups
```

**Example Output:**
```
⚠️  This will apply database migrations to your current database.
   Make sure you're targeting the correct database!
   DATABASE_URL: postgresql://user:pass@localhost:5432/marketplace_db

Continue? (y/N): y

[2024-01-01 12:00:00] INFO: Starting migration deployment process
[2024-01-01 12:00:01] INFO: Checking prerequisites...
[2024-01-01 12:00:01] SUCCESS: Prerequisites check passed
[2024-01-01 12:00:02] INFO: Running migration safety checks...
[2024-01-01 12:00:03] SUCCESS: Migration safety checks passed
[2024-01-01 12:00:03] INFO: Checking for pending migrations...
[2024-01-01 12:00:04] INFO: Current revision: abc123def456
[2024-01-01 12:00:04] INFO: Target revision: def456ghi789
[2024-01-01 12:00:04] INFO: Creating database backup...
[2024-01-01 12:00:10] SUCCESS: Backup created successfully: backups/backup_20240101_120010.sql
[2024-01-01 12:00:10] INFO: Applying migrations...
[2024-01-01 12:00:15] SUCCESS: Migrations applied successfully
[2024-01-01 12:00:15] INFO: Verifying migration application...
[2024-01-01 12:00:16] SUCCESS: Migration verification successful
[2024-01-01 12:00:16] SUCCESS: Migration deployment completed successfully

✅ Migration deployment completed successfully!
```

### `check_db_state.py`
Simple script to check current database state and compare with migration files (created earlier).

## Environment Setup

Ensure these environment variables are set:

```bash
# Required
export DATABASE_URL="postgresql://user:password@localhost:5432/marketplace_db"

# Optional
export ALEMBIC_CONFIG="alembic.ini"  # Path to alembic config
```

## Pre-commit Integration

Add to `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: local
    hooks:
      - id: check-migrations
        name: Check Alembic migrations
        entry: python scripts/check_migrations.py
        language: python
        files: 'alembic/versions/.*\.py$'
        pass_filenames: false
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Migration Tests

on: [push, pull_request]

jobs:
  validate-migrations:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v3
        with:
          python-version: '3.9'
      
      - name: Install dependencies
        run: pip install -r requirements.txt
      
      - name: Validate migrations
        run: python scripts/check_migrations.py
        
      - name: Test migration deployment (dry run)
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test_db
        run: python scripts/deploy_migrations.py --dry-run --force
```

## Production Deployment Workflow

1. **Development**:
   ```bash
   # Make model changes
   # Generate migration
   alembic revision --autogenerate -m "Add new feature"
   
   # Check migration safety
   python scripts/check_migrations.py --file alembic/versions/new_migration.py
   
   # Test locally
   python scripts/deploy_migrations.py --dry-run
   ```

2. **Staging**:
   ```bash
   # Deploy to staging with full safety checks
   python scripts/deploy_migrations.py
   ```

3. **Production**:
   ```bash
   # Deploy to production with backup
   python scripts/deploy_migrations.py --force
   ```

## Troubleshooting

### Common Issues

**"Migration safety checks failed"**
- Review the specific warnings/errors reported
- Fix migration files as suggested
- Re-run safety checks

**"Cannot connect to database"**
- Verify DATABASE_URL is correct
- Check database server is running
- Verify network connectivity

**"Backup failed"**
- Check disk space
- Verify pg_dump is installed and accessible
- Check database permissions

**"Migration verification failed"**
- Database may be in inconsistent state
- Check for partial migration application
- Consider manual inspection and fix

### Recovery Procedures

**If migration fails:**
1. Script will automatically attempt rollback
2. If rollback fails, database restore from backup will be attempted
3. Manual intervention may be required

**Manual rollback:**
```bash
# Rollback one migration
alembic downgrade -1

# Rollback to specific revision
alembic downgrade abc123def456
```

**Manual restore:**
```bash
# From backup file
psql $DATABASE_URL < backups/backup_20240101_120010.sql
```

## Best Practices

1. **Always run safety checks** before applying migrations
2. **Test migrations in staging** environment first
3. **Keep backups** for production deployments
4. **Review generated migrations** before applying
5. **Coordinate with team** for breaking changes
6. **Monitor migration performance** in production
7. **Document complex migrations** with comments

## Script Dependencies

- Python 3.7+
- `alembic`
- `psycopg2-binary` (for PostgreSQL)
- `subprocess` (built-in)
- `pathlib` (built-in)

## File Structure

```
scripts/
├── README.md                 # This file
├── check_migrations.py       # Migration safety checker
├── deploy_migrations.py      # Safe deployment script
└── check_db_state.py         # Database state checker (existing)
```

## Support

For issues with these scripts:
1. Check the troubleshooting section above
2. Review the main MIGRATION_GUIDE.md
3. Contact the development team

---

**⚠️ Important:** Always test these scripts in a development environment before using in production!
