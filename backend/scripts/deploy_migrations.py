#!/usr/bin/env python3
"""
Safe Alembic Migration Deployment Script

This script safely deploys Alembic migrations with comprehensive checks and rollback capabilities.
"""

import os
import sys
import subprocess
import argparse
from datetime import datetime
from pathlib import Path
from typing import Optional, List
import json
import time

class MigrationDeployer:
    """Handles safe deployment of Alembic migrations"""
    
    def __init__(self, backup_dir: str = "backups", dry_run: bool = False):
        self.backup_dir = Path(backup_dir)
        self.backup_dir.mkdir(exist_ok=True)
        self.dry_run = dry_run
        self.backup_file: Optional[Path] = None
        
    def log(self, message: str, level: str = "INFO"):
        """Log a message with timestamp"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
    
    def run_command(self, command: List[str], check: bool = True) -> subprocess.CompletedProcess:
        """Run a command and return the result"""
        self.log(f"Running: {' '.join(command)}")
        
        if self.dry_run:
            self.log("DRY RUN: Command would be executed", "DRY_RUN")
            return subprocess.CompletedProcess(command, 0, "", "")
        
        try:
            result = subprocess.run(command, capture_output=True, text=True, check=check)
            if result.stdout:
                self.log(f"Output: {result.stdout.strip()}")
            return result
        except subprocess.CalledProcessError as e:
            self.log(f"Command failed: {e}", "ERROR")
            self.log(f"Error output: {e.stderr}", "ERROR")
            raise
    
    def check_prerequisites(self) -> bool:
        """Check that all prerequisites are met"""
        self.log("Checking prerequisites...")
        
        # Check if alembic is available
        try:
            self.run_command(["alembic", "--version"], check=False)
        except FileNotFoundError:
            self.log("Alembic not found in PATH", "ERROR")
            return False
        
        # Check if database connection works
        try:
            result = self.run_command(["alembic", "current"], check=False)
            if result.returncode != 0:
                self.log("Cannot connect to database", "ERROR")
                return False
        except Exception as e:
            self.log(f"Database connection check failed: {e}", "ERROR")
            return False
        
        # Check if we have write permissions for backup directory
        if not self.backup_dir.exists():
            try:
                self.backup_dir.mkdir(parents=True, exist_ok=True)
            except PermissionError:
                self.log(f"Cannot create backup directory: {self.backup_dir}", "ERROR")
                return False
        
        self.log("Prerequisites check passed", "SUCCESS")
        return True
    
    def create_backup(self) -> bool:
        """Create a database backup"""
        if self.dry_run:
            self.log("DRY RUN: Database backup would be created", "DRY_RUN")
            return True
        
        self.log("Creating database backup...")
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.backup_file = self.backup_dir / f"backup_{timestamp}.sql"
        
        # Get database URL from environment
        database_url = os.environ.get("DATABASE_URL")
        if not database_url:
            self.log("DATABASE_URL environment variable not set", "ERROR")
            return False
        
        try:
            with open(self.backup_file, 'w') as f:
                result = subprocess.run(
                    ["pg_dump", database_url],
                    stdout=f,
                    stderr=subprocess.PIPE,
                    text=True,
                    check=True
                )
            
            # Verify backup was created successfully
            if self.backup_file.stat().st_size > 0:
                self.log(f"Backup created successfully: {self.backup_file}", "SUCCESS")
                return True
            else:
                self.log("Backup file is empty", "ERROR")
                return False
                
        except subprocess.CalledProcessError as e:
            self.log(f"Backup failed: {e}", "ERROR")
            self.log(f"Error: {e.stderr}", "ERROR")
            return False
        except Exception as e:
            self.log(f"Backup creation failed: {e}", "ERROR")
            return False
    
    def check_migration_safety(self) -> bool:
        """Run migration safety checks"""
        self.log("Running migration safety checks...")
        
        try:
            # Run the migration checker script
            result = self.run_command([
                "python", "scripts/check_migrations.py", "--check-db"
            ], check=False)
            
            if result.returncode != 0:
                self.log("Migration safety checks failed", "ERROR")
                return False
            
            self.log("Migration safety checks passed", "SUCCESS")
            return True
            
        except Exception as e:
            self.log(f"Safety check failed: {e}", "ERROR")
            return False
    
    def show_pending_migrations(self) -> List[str]:
        """Show pending migrations"""
        self.log("Checking for pending migrations...")
        
        try:
            # Get current revision
            current_result = self.run_command(["alembic", "current"])
            current_rev = current_result.stdout.strip()
            
            # Get head revision
            head_result = self.run_command(["alembic", "heads"])
            head_rev = head_result.stdout.strip()
            
            if current_rev == head_rev:
                self.log("No pending migrations", "INFO")
                return []
            
            # Get migration history to show pending ones
            history_result = self.run_command(["alembic", "history", "--verbose"])
            
            self.log(f"Current revision: {current_rev}")
            self.log(f"Target revision: {head_rev}")
            
            # For simplicity, just return that there are pending migrations
            return [head_rev]
            
        except Exception as e:
            self.log(f"Error checking pending migrations: {e}", "ERROR")
            return []
    
    def apply_migrations(self) -> bool:
        """Apply pending migrations"""
        self.log("Applying migrations...")
        
        try:
            # Dry run first to check for issues
            if not self.dry_run:
                dry_run_result = self.run_command(["alembic", "upgrade", "head", "--sql"])
                self.log("Migration SQL preview generated successfully")
            
            # Apply migrations
            result = self.run_command(["alembic", "upgrade", "head"])
            
            if result.returncode == 0:
                self.log("Migrations applied successfully", "SUCCESS")
                return True
            else:
                self.log("Migration application failed", "ERROR")
                return False
                
        except subprocess.CalledProcessError as e:
            self.log(f"Migration failed: {e}", "ERROR")
            return False
        except Exception as e:
            self.log(f"Unexpected error during migration: {e}", "ERROR")
            return False
    
    def verify_migrations(self) -> bool:
        """Verify that migrations were applied correctly"""
        self.log("Verifying migration application...")
        
        try:
            # Check current revision
            result = self.run_command(["alembic", "current"])
            current_rev = result.stdout.strip()
            
            # Check head revision
            head_result = self.run_command(["alembic", "heads"])
            head_rev = head_result.stdout.strip()
            
            if current_rev == head_rev:
                self.log("Migration verification successful", "SUCCESS")
                return True
            else:
                self.log(f"Migration verification failed: current={current_rev}, expected={head_rev}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"Migration verification error: {e}", "ERROR")
            return False
    
    def rollback_migration(self) -> bool:
        """Rollback to previous revision if something goes wrong"""
        if self.dry_run:
            self.log("DRY RUN: Migration rollback would be performed", "DRY_RUN")
            return True
        
        self.log("Rolling back migration...", "WARNING")
        
        try:
            result = self.run_command(["alembic", "downgrade", "-1"])
            
            if result.returncode == 0:
                self.log("Migration rollback successful", "SUCCESS")
                return True
            else:
                self.log("Migration rollback failed", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"Rollback error: {e}", "ERROR")
            return False
    
    def restore_backup(self) -> bool:
        """Restore from backup if everything fails"""
        if self.dry_run or not self.backup_file:
            self.log("DRY RUN: Database restore would be performed", "DRY_RUN")
            return True
        
        self.log("Restoring from backup...", "WARNING")
        
        database_url = os.environ.get("DATABASE_URL")
        if not database_url:
            self.log("Cannot restore: DATABASE_URL not set", "ERROR")
            return False
        
        try:
            with open(self.backup_file, 'r') as f:
                result = subprocess.run(
                    ["psql", database_url],
                    stdin=f,
                    capture_output=True,
                    text=True,
                    check=True
                )
            
            self.log("Database restored from backup", "SUCCESS")
            return True
            
        except Exception as e:
            self.log(f"Backup restore failed: {e}", "ERROR")
            return False
    
    def deploy(self, skip_backup: bool = False, skip_safety_checks: bool = False) -> bool:
        """Main deployment process"""
        self.log("Starting migration deployment process")
        
        # Step 1: Check prerequisites
        if not self.check_prerequisites():
            return False
        
        # Step 2: Safety checks
        if not skip_safety_checks:
            if not self.check_migration_safety():
                return False
        
        # Step 3: Show pending migrations
        pending = self.show_pending_migrations()
        if not pending:
            self.log("No migrations to apply")
            return True
        
        # Step 4: Create backup
        if not skip_backup:
            if not self.create_backup():
                return False
        
        # Step 5: Apply migrations
        if not self.apply_migrations():
            self.log("Migration failed, attempting rollback...")
            if not self.rollback_migration():
                self.log("Rollback failed, attempting restore from backup...")
                if not skip_backup:
                    self.restore_backup()
            return False
        
        # Step 6: Verify migrations
        if not self.verify_migrations():
            self.log("Verification failed, rolling back...")
            if not self.rollback_migration():
                self.log("Rollback failed, attempting restore from backup...")
                if not skip_backup:
                    self.restore_backup()
            return False
        
        self.log("Migration deployment completed successfully", "SUCCESS")
        
        # Cleanup old backups (keep last 5)
        if not skip_backup and not self.dry_run:
            self.cleanup_old_backups()
        
        return True
    
    def cleanup_old_backups(self, keep: int = 5):
        """Clean up old backup files"""
        try:
            backup_files = sorted(self.backup_dir.glob("backup_*.sql"))
            if len(backup_files) > keep:
                for old_backup in backup_files[:-keep]:
                    old_backup.unlink()
                    self.log(f"Removed old backup: {old_backup}")
        except Exception as e:
            self.log(f"Backup cleanup warning: {e}", "WARNING")

def main():
    parser = argparse.ArgumentParser(description="Safe Alembic migration deployment")
    parser.add_argument("--dry-run", action="store_true",
                        help="Show what would be done without executing")
    parser.add_argument("--skip-backup", action="store_true",
                        help="Skip database backup (not recommended for production)")
    parser.add_argument("--skip-safety-checks", action="store_true",
                        help="Skip migration safety checks (not recommended)")
    parser.add_argument("--backup-dir", default="backups",
                        help="Directory for database backups")
    parser.add_argument("--force", action="store_true",
                        help="Skip confirmation prompts")
    
    args = parser.parse_args()
    
    if not args.force and not args.dry_run:
        print("⚠️  This will apply database migrations to your current database.")
        print("   Make sure you're targeting the correct database!")
        print(f"   DATABASE_URL: {os.environ.get('DATABASE_URL', 'NOT SET')}")
        print()
        
        response = input("Continue? (y/N): ")
        if response.lower() != 'y':
            print("Migration deployment cancelled")
            sys.exit(0)
    
    deployer = MigrationDeployer(
        backup_dir=args.backup_dir,
        dry_run=args.dry_run
    )
    
    success = deployer.deploy(
        skip_backup=args.skip_backup,
        skip_safety_checks=args.skip_safety_checks
    )
    
    if success:
        print("\n✅ Migration deployment completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Migration deployment failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
