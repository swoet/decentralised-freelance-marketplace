#!/usr/bin/env python3
"""
Alembic Migration Safety Checker

This script validates Alembic migrations for safety and best practices.
Run this before applying migrations in production.
"""

import os
import sys
import ast
import re
from pathlib import Path
from typing import List, Dict, Any, Tuple
from dataclasses import dataclass
import argparse

@dataclass
class MigrationIssue:
    """Represents a potential issue in a migration file"""
    level: str  # 'error', 'warning', 'info'
    message: str
    line_number: int = None
    suggestion: str = None

class MigrationChecker:
    """Checks Alembic migration files for safety and best practices"""
    
    def __init__(self):
        self.issues: List[MigrationIssue] = []
    
    def check_migration_file(self, file_path: Path) -> List[MigrationIssue]:
        """Check a single migration file"""
        self.issues = []
        
        if not file_path.exists():
            self.issues.append(MigrationIssue(
                level='error',
                message=f"Migration file not found: {file_path}"
            ))
            return self.issues
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Parse the Python AST
            tree = ast.parse(content)
            
            # Run all checks
            self._check_revision_metadata(tree, content)
            self._check_upgrade_function(tree, content)
            self._check_downgrade_function(tree, content)
            self._check_schema_usage(tree, content)
            self._check_dangerous_operations(tree, content)
            self._check_index_usage(tree, content)
            self._check_foreign_keys(tree, content)
            
        except SyntaxError as e:
            self.issues.append(MigrationIssue(
                level='error',
                message=f"Syntax error in migration file: {e}",
                line_number=e.lineno
            ))
        except Exception as e:
            self.issues.append(MigrationIssue(
                level='error',
                message=f"Error reading migration file: {e}"
            ))
        
        return self.issues
    
    def _check_revision_metadata(self, tree: ast.AST, content: str):
        """Check revision metadata is properly set"""
        has_revision = False
        has_down_revision = False
        
        for node in ast.walk(tree):
            if isinstance(node, ast.Assign):
                for target in node.targets:
                    if isinstance(target, ast.Name):
                        if target.id == 'revision':
                            has_revision = True
                        elif target.id == 'down_revision':
                            has_down_revision = True
        
        if not has_revision:
            self.issues.append(MigrationIssue(
                level='error',
                message="Missing 'revision' identifier",
                suggestion="Add: revision = 'your_revision_id'"
            ))
        
        if not has_down_revision:
            self.issues.append(MigrationIssue(
                level='error', 
                message="Missing 'down_revision' identifier",
                suggestion="Add: down_revision = 'parent_revision_id'"
            ))
    
    def _check_upgrade_function(self, tree: ast.AST, content: str):
        """Check upgrade function exists and is not empty"""
        has_upgrade = False
        upgrade_empty = True
        
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef) and node.name == 'upgrade':
                has_upgrade = True
                # Check if function has meaningful content
                if len(node.body) > 1 or (len(node.body) == 1 and not isinstance(node.body[0], ast.Pass)):
                    upgrade_empty = False
        
        if not has_upgrade:
            self.issues.append(MigrationIssue(
                level='error',
                message="Missing 'upgrade' function"
            ))
        elif upgrade_empty:
            self.issues.append(MigrationIssue(
                level='warning',
                message="Empty upgrade function - migration does nothing"
            ))
    
    def _check_downgrade_function(self, tree: ast.AST, content: str):
        """Check downgrade function exists and implements rollback"""
        has_downgrade = False
        downgrade_empty = True
        
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef) and node.name == 'downgrade':
                has_downgrade = True
                # Check if function has meaningful content
                if len(node.body) > 1 or (len(node.body) == 1 and not isinstance(node.body[0], ast.Pass)):
                    downgrade_empty = False
        
        if not has_downgrade:
            self.issues.append(MigrationIssue(
                level='error',
                message="Missing 'downgrade' function"
            ))
        elif downgrade_empty:
            self.issues.append(MigrationIssue(
                level='warning',
                message="Empty downgrade function - rollback not implemented",
                suggestion="Implement proper rollback operations"
            ))
    
    def _check_schema_usage(self, tree: ast.AST, content: str):
        """Check for proper schema usage"""
        lines = content.split('\n')
        
        # Look for table operations without schema
        table_ops = ['create_table', 'drop_table', 'alter_table']
        
        for i, line in enumerate(lines, 1):
            for op in table_ops:
                if op in line and 'schema=' not in line and 'op.' + op in line:
                    self.issues.append(MigrationIssue(
                        level='warning',
                        message=f"Table operation without schema specification: {op}",
                        line_number=i,
                        suggestion="Add schema='marketplace' parameter"
                    ))
    
    def _check_dangerous_operations(self, tree: ast.AST, content: str):
        """Check for potentially dangerous operations"""
        dangerous_patterns = [
            (r'drop_table', 'Dropping table - ensure data is backed up'),
            (r'drop_column', 'Dropping column - potential data loss'),
            (r'alter_column.*nullable=False', 'Making column non-nullable - may fail if NULLs exist'),
            (r'drop_constraint', 'Dropping constraint - verify dependent data'),
        ]
        
        lines = content.split('\n')
        for i, line in enumerate(lines, 1):
            for pattern, warning in dangerous_patterns:
                if re.search(pattern, line):
                    self.issues.append(MigrationIssue(
                        level='warning',
                        message=warning,
                        line_number=i,
                        suggestion="Verify this operation is safe and data is backed up"
                    ))
    
    def _check_index_usage(self, tree: ast.AST, content: str):
        """Check for proper index usage"""
        lines = content.split('\n')
        
        has_create_table = any('create_table' in line for line in lines)
        has_create_index = any('create_index' in line for line in lines)
        
        if has_create_table and not has_create_index:
            self.issues.append(MigrationIssue(
                level='info',
                message="Creating tables without indexes - consider adding indexes for performance",
                suggestion="Add indexes for frequently queried columns"
            ))
    
    def _check_foreign_keys(self, tree: ast.AST, content: str):
        """Check foreign key constraints"""
        lines = content.split('\n')
        
        for i, line in enumerate(lines, 1):
            if 'ForeignKeyConstraint' in line or 'ForeignKey' in line:
                # Check if schema is properly referenced
                if 'marketplace.' not in line:
                    self.issues.append(MigrationIssue(
                        level='warning',
                        message="Foreign key without schema prefix",
                        line_number=i,
                        suggestion="Use 'marketplace.table.column' format"
                    ))

def check_all_migrations(alembic_dir: Path = None) -> Dict[str, List[MigrationIssue]]:
    """Check all migration files in the versions directory"""
    if alembic_dir is None:
        alembic_dir = Path('alembic')
    
    versions_dir = alembic_dir / 'versions'
    
    if not versions_dir.exists():
        print(f"Error: Alembic versions directory not found: {versions_dir}")
        sys.exit(1)
    
    checker = MigrationChecker()
    all_issues = {}
    
    migration_files = sorted(versions_dir.glob('*.py'))
    
    print(f"Checking {len(migration_files)} migration files...\n")
    
    for migration_file in migration_files:
        issues = checker.check_migration_file(migration_file)
        if issues:
            all_issues[str(migration_file)] = issues
    
    return all_issues

def print_issues(all_issues: Dict[str, List[MigrationIssue]]):
    """Print all issues in a formatted way"""
    if not all_issues:
        print("✅ No issues found in migration files!")
        return
    
    total_errors = 0
    total_warnings = 0
    total_info = 0
    
    for file_path, issues in all_issues.items():
        print(f"\n📄 {file_path}")
        print("=" * len(file_path))
        
        for issue in issues:
            icon = {"error": "❌", "warning": "⚠️", "info": "ℹ️"}[issue.level]
            line_info = f" (line {issue.line_number})" if issue.line_number else ""
            
            print(f"{icon} [{issue.level.upper()}]{line_info}: {issue.message}")
            
            if issue.suggestion:
                print(f"   💡 Suggestion: {issue.suggestion}")
            
            if issue.level == 'error':
                total_errors += 1
            elif issue.level == 'warning':
                total_warnings += 1
            else:
                total_info += 1
    
    print(f"\n📊 Summary:")
    print(f"   Errors: {total_errors}")
    print(f"   Warnings: {total_warnings}")
    print(f"   Info: {total_info}")
    
    if total_errors > 0:
        print("\n❌ Migration validation failed! Fix errors before proceeding.")
        sys.exit(1)
    elif total_warnings > 0:
        print("\n⚠️ Migration validation passed with warnings. Review before proceeding.")
    else:
        print("\n✅ Migration validation passed!")

def check_database_state():
    """Check current database state vs migration files"""
    try:
        import subprocess
        result = subprocess.run(['alembic', 'current'], capture_output=True, text=True)
        current_revision = result.stdout.strip()
        
        result = subprocess.run(['alembic', 'heads'], capture_output=True, text=True)
        head_revision = result.stdout.strip()
        
        print(f"Current database revision: {current_revision}")
        print(f"Latest migration revision: {head_revision}")
        
        if current_revision != head_revision:
            print("⚠️ Database is not up to date with latest migrations!")
            print("Run 'alembic upgrade head' to update, or 'alembic stamp head' if already current")
        else:
            print("✅ Database is up to date")
            
    except FileNotFoundError:
        print("❌ Alembic command not found. Make sure Alembic is installed and in PATH")
    except Exception as e:
        print(f"❌ Error checking database state: {e}")

def main():
    parser = argparse.ArgumentParser(description='Check Alembic migrations for safety and best practices')
    parser.add_argument('--alembic-dir', type=Path, default=Path('alembic'),
                        help='Path to alembic directory (default: ./alembic)')
    parser.add_argument('--check-db', action='store_true',
                        help='Also check database state vs migrations')
    parser.add_argument('--file', type=Path,
                        help='Check specific migration file instead of all')
    
    args = parser.parse_args()
    
    print("🔍 Alembic Migration Safety Checker")
    print("==================================")
    
    if args.check_db:
        print("\n📊 Checking database state...")
        check_database_state()
    
    if args.file:
        print(f"\n🔍 Checking single migration file: {args.file}")
        checker = MigrationChecker()
        issues = checker.check_migration_file(args.file)
        all_issues = {str(args.file): issues} if issues else {}
    else:
        all_issues = check_all_migrations(args.alembic_dir)
    
    print_issues(all_issues)

if __name__ == '__main__':
    main()
