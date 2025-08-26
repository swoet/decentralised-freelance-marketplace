#!/usr/bin/env python3
"""Test script to verify all new components can be imported successfully."""

import sys
import traceback

def test_imports():
    """Test importing all new components."""
    tests = []
    
    # Test core imports
    try:
        from app.core.config import settings
        tests.append(("✓ Core config", True))
    except Exception as e:
        tests.append(("✗ Core config", False, str(e)))
    
    # Test model imports
    try:
        from app.models.matching import ProjectEmbedding, FreelancerProfile, MatchingResult, ReputationScoreV2
        tests.append(("✓ Matching models", True))
    except Exception as e:
        tests.append(("✗ Matching models", False, str(e)))
    
    try:
        from app.models.oauth import OAuthToken, OAuthState
        tests.append(("✓ OAuth models", True))
    except Exception as e:
        tests.append(("✗ OAuth models", False, str(e)))
    
    try:
        from app.models.device import Device, SessionActivity
        tests.append(("✓ Device models", True))
    except Exception as e:
        tests.append(("✗ Device models", False, str(e)))
    
    # Test service imports (without initialization)
    try:
        from app.services import ai_matching_service
        tests.append(("✓ AI matching service module", True))
    except Exception as e:
        tests.append(("✗ AI matching service module", False, str(e)))
    
    try:
        from app.services import skills_verification_service
        tests.append(("✓ Skills verification service module", True))
    except Exception as e:
        tests.append(("✗ Skills verification service module", False, str(e)))
    
    try:
        from app.services import reputation_service
        tests.append(("✓ Reputation service module", True))
    except Exception as e:
        tests.append(("✗ Reputation service module", False, str(e)))
    
    # Test API imports
    try:
        from app.api.v1.matching_v2 import router
        tests.append(("✓ Matching v2 API", True))
    except Exception as e:
        tests.append(("✗ Matching v2 API", False, str(e)))
    
    try:
        from app.api.v1.oauth import router
        tests.append(("✓ OAuth API", True))
    except Exception as e:
        tests.append(("✗ OAuth API", False, str(e)))
    
    try:
        from app.api.v1.sessions import router
        tests.append(("✓ Sessions API", True))
    except Exception as e:
        tests.append(("✗ Sessions API", False, str(e)))
    
    # Test ML dependencies (if installed)
    try:
        import sentence_transformers
        import sklearn
        import numpy
        import pandas
        tests.append(("✓ ML dependencies", True))
    except Exception as e:
        tests.append(("✗ ML dependencies", False, str(e)))
    
    return tests

def main():
    """Run all import tests."""
    print("Testing imports for Decentralised Freelance Marketplace backend...")
    print("=" * 60)
    
    tests = test_imports()
    
    passed = 0
    failed = 0
    
    for test in tests:
        if test[1]:  # Success
            print(test[0])
            passed += 1
        else:  # Failure
            print(f"{test[0]}: {test[2] if len(test) > 2 else 'Unknown error'}")
            failed += 1
    
    print("=" * 60)
    print(f"Results: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("🎉 All imports successful! The backend is ready for testing.")
        return 0
    else:
        print("⚠️  Some imports failed. Check the errors above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
