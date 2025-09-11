#!/usr/bin/env python3

import traceback

def test_import(module_name, class_name):
    try:
        module = __import__(module_name, fromlist=[class_name])
        getattr(module, class_name)
        return True
    except:
        return False

# Test each model
models = [
    ("app.models.user", "User"),
    ("app.models.project", "Project"), 
    ("app.models.bid", "Bid"),
    ("app.models.message", "Message"),
    ("app.models.review", "Review"),
    ("app.models.milestone", "Milestone"),
    ("app.models.skills", "Skill"),
    ("app.models.portfolio", "Portfolio"),
    ("app.models.organization", "Organization"),
    ("app.models.security", "SecurityEvent"),
    ("app.models.audit_log", "AuditLog"),
    ("app.models.job_queue", "JobQueue"),
    ("app.models.matching", "MatchingScore"),
    ("app.models.integration", "Integration"),
    ("app.models.oauth", "OAuthConnection"),
    ("app.models.escrow_contract", "EscrowContract"),
]

print("Testing model imports:")
working = []
for module_name, class_name in models:
    if test_import(module_name, class_name):
        print(f"✅ {module_name}.{class_name}")
        working.append((module_name, class_name))
    else:
        print(f"❌ {module_name}.{class_name}")

print(f"\nWorking imports: {len(working)}")
