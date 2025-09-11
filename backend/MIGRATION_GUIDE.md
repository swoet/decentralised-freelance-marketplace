# Alembic Migration Guide

## Overview

This guide covers the safe usage of Alembic for database migrations in the Decentralized Freelance Marketplace platform.

## Table of Contents

1. [Setup and Configuration](#setup-and-configuration)
2. [Migration Best Practices](#migration-best-practices)
3. [Safety Checks](#safety-checks)
4. [Common Operations](#common-operations)
5. [Troubleshooting](#troubleshooting)
6. [CI/CD Integration](#cicd-integration)

## Setup and Configuration

### Current Configuration

- **Schema**: `marketplace` (not default `public`)
- **Alembic version table**: `marketplace.alembic_version`
- **Models location**: `app/models/`
- **Migration files**: `alembic/versions/`

### Environment Setup

```bash
# Ensure you're in the backend directory
cd backend

# Activate virtual environment (if using)
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt
```

## Migration Best Practices

### 1. Always Backup Before Migrations

```bash
# Create database backup
pg_dump -h localhost -U your_username -d marketplace_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Check Current State

```bash
# Show current revision
alembic current

# Show migration history
alembic history --verbose

# Show pending migrations
alembic show head
```

### 3. Create Migrations Safely

```bash
# Auto-generate migration (preferred method)
alembic revision --autogenerate -m "Add new feature tables"

# Manual migration (for complex changes)
alembic revision -m "Manual migration description"
```

### 4. Review Before Applying

Always review the generated migration file before applying:

```python
# Example review checklist:
# - Are column types correct?
# - Are foreign key constraints proper?
# - Are indexes needed?
# - Will this cause downtime?
# - Is the rollback (downgrade) function complete?
```

### 5. Test Migrations

```bash
# Apply migration
alembic upgrade head

# Test rollback (in development only!)
alembic downgrade -1

# Re-apply
alembic upgrade head
```

## Safety Checks

### Pre-Migration Checklist

- [ ] Database backup created
- [ ] Migration file reviewed
- [ ] Downgrade function tested
- [ ] No breaking schema changes without coordination
- [ ] All team members notified of potentially breaking changes

### Migration File Safety

```python
"""Add user profiles table

Revision ID: abc123def456
Revises: previous_revision
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# SAFETY: Always include revision identifiers
revision = 'abc123def456'
down_revision = 'previous_revision'
branch_labels = None
depends_on = None


def upgrade():
    # SAFETY: Use schema-qualified table names
    op.create_table('user_profiles',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['marketplace.users.id']),
        schema='marketplace'
    )
    
    # SAFETY: Create indexes for performance
    op.create_index('ix_user_profiles_user_id', 'user_profiles', ['user_id'], schema='marketplace')


def downgrade():
    # SAFETY: Always implement proper downgrade
    op.drop_index('ix_user_profiles_user_id', 'user_profiles', schema='marketplace')
    op.drop_table('user_profiles', schema='marketplace')
```

### Environment Variables

Ensure these are set:
- `DATABASE_URL`: PostgreSQL connection string
- `ALEMBIC_CONFIG`: Path to alembic.ini (optional)

## Common Operations

### Creating a New Migration

```bash
# 1. Make model changes in app/models/
# 2. Generate migration
alembic revision --autogenerate -m "Add AI matching tables"

# 3. Review generated file in alembic/versions/
# 4. Edit if necessary
# 5. Apply migration
alembic upgrade head
```

### Viewing Migration Status

```bash
# Current revision
alembic current

# Show all revisions
alembic history

# Show specific revision details
alembic show abc123def456
```

### Rolling Back

```bash
# Rollback one migration
alembic downgrade -1

# Rollback to specific revision
alembic downgrade abc123def456

# Rollback to base (DANGEROUS!)
alembic downgrade base
```

### Stamping Database

```bash
# Mark current database as up-to-date with head
alembic stamp head

# Mark specific revision as current
alembic stamp abc123def456
```

## Troubleshooting

### Common Issues

#### 1. "Target database is not up to date"

**Cause**: Database revision doesn't match migration files.

**Solution**:
```bash
# Check current state
alembic current
alembic history

# If database is actually up-to-date, stamp it
alembic stamp head
```

#### 2. "Revision not found"

**Cause**: Missing migration files or revision mismatch.

**Solution**:
```bash
# List all revisions in database vs filesystem
python scripts/check_db_state.py

# If migration files are missing, recreate from scratch
# (Only do this in development!)
```

#### 3. "Table already exists"

**Cause**: Migration trying to create existing table.

**Solutions**:

**Option A**: Skip the specific operation
```python
def upgrade():
    # Check if table exists before creating
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names(schema='marketplace')
    
    if 'existing_table' not in tables:
        op.create_table('existing_table', ...)
```

**Option B**: Stamp the migration as applied
```bash
alembic stamp revision_id
```

#### 4. Permission Errors

**Cause**: Insufficient database privileges.

**Solution**:
```sql
-- Grant necessary permissions
GRANT ALL PRIVILEGES ON SCHEMA marketplace TO your_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA marketplace TO your_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA marketplace TO your_user;
```

### Emergency Recovery

If migrations are completely broken:

1. **Backup current database**
2. **Reset Alembic history**:
   ```bash
   # Clear alembic version table
   psql -d marketplace_db -c "DELETE FROM marketplace.alembic_version;"
   
   # Create fresh baseline
   alembic stamp head
   ```
3. **Re-run problematic migration**

## CI/CD Integration

### Pre-commit Hooks

Create `.pre-commit-config.yaml`:
```yaml
repos:
  - repo: local
    hooks:
      - id: check-migrations
        name: Check Alembic migrations
        entry: python scripts/check_migrations.py
        language: python
        files: 'alembic/versions/.*\.py$'
```

### GitHub Actions

```yaml
name: Migration Tests

on: [push, pull_request]

jobs:
  test-migrations:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_marketplace
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v3
        with:
          python-version: '3.9'
          
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          
      - name: Test migrations
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test_marketplace
        run: |
          # Apply all migrations
          alembic upgrade head
          
          # Test rollback of latest migration
          alembic downgrade -1
          
          # Re-apply
          alembic upgrade head
```

### Production Deployment

```bash
#!/bin/bash
# deploy-migrations.sh

set -e

echo "Starting migration deployment..."

# 1. Backup database
pg_dump $DATABASE_URL > "backup_$(date +%Y%m%d_%H%M%S).sql"

# 2. Check current state
echo "Current revision:"
alembic current

# 3. Show pending migrations
echo "Pending migrations:"
alembic show head

# 4. Confirm with user
read -p "Proceed with migration? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled"
    exit 1
fi

# 5. Apply migrations
echo "Applying migrations..."
alembic upgrade head

# 6. Verify success
echo "Final revision:"
alembic current

echo "Migration deployment complete!"
```

## Best Practices Summary

1. **Always backup** before running migrations in production
2. **Review generated migrations** before applying
3. **Test rollbacks** in development
4. **Use schema-qualified names** (marketplace.table_name)
5. **Include proper indexes** for performance
6. **Implement complete downgrade functions**
7. **Coordinate breaking changes** with team
8. **Monitor migration performance** in production
9. **Keep migration files in version control**
10. **Document complex migrations** with comments

## Resources

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [SQLAlchemy Schema Documentation](https://docs.sqlalchemy.org/en/14/core/schema.html)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

For questions or issues, consult this guide first, then reach out to the development team.
