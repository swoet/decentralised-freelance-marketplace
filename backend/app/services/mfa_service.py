"""
Multi-Factor Authentication Service

This service handles TOTP (Time-based One-Time Password) authentication,
backup codes generation, and QR code generation for MFA setup.
"""

import pyotp
import qrcode
import secrets
import hashlib
import base64
from io import BytesIO
from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from cryptography.fernet import Fernet
import logging

from app.models.security import UserMFA, MFAType, SecurityEvent, SecurityEventType
from app.models.user import User
from app.core.db import get_db
from app.core.config import settings
from app.services.security_event_service import SecurityEventService

logger = logging.getLogger(__name__)


class MFAService:
    """Service for handling Multi-Factor Authentication operations"""
    
    def __init__(self, db: Session = None):
        self.db = db
        self.security_service = SecurityEventService(db)
        
        # Get or generate encryption key for MFA secrets
        # In production, this should be loaded from secure configuration
        self.encryption_key = self._get_encryption_key()
        self.fernet = Fernet(self.encryption_key)
    
    def _get_encryption_key(self) -> bytes:
        """Get or generate encryption key for MFA secrets"""
        # In production, load this from secure storage (AWS KMS, etc.)
        key = getattr(settings, 'MFA_ENCRYPTION_KEY', None)
        if not key:
            # Generate a key for development - store this securely in production
            key = Fernet.generate_key()
            logger.warning("Generated new MFA encryption key - store this securely!")
        
        if isinstance(key, str):
            key = key.encode()
        
        return key
    
    def _encrypt_secret(self, secret: str) -> str:
        """Encrypt MFA secret for secure storage"""
        return self.fernet.encrypt(secret.encode()).decode()
    
    def _decrypt_secret(self, encrypted_secret: str) -> str:
        """Decrypt MFA secret for use"""
        return self.fernet.decrypt(encrypted_secret.encode()).decode()
    
    def generate_totp_secret(self, user: User) -> Tuple[str, str]:
        """
        Generate TOTP secret and provisioning URI for user
        
        Returns:
            Tuple of (secret, provisioning_uri)
        """
        secret = pyotp.random_base32()
        app_name = getattr(settings, 'APP_NAME', 'Decentralized Freelance Marketplace')
        
        totp = pyotp.TOTP(secret)
        provisioning_uri = totp.provisioning_uri(
            name=user.email,
            issuer_name=app_name
        )
        
        return secret, provisioning_uri
    
    def generate_qr_code(self, provisioning_uri: str) -> str:
        """
        Generate QR code image for TOTP setup
        
        Returns:
            Base64-encoded PNG image
        """
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(provisioning_uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        return base64.b64encode(buffer.getvalue()).decode()
    
    def generate_backup_codes(self, count: int = 8) -> List[str]:
        """
        Generate backup codes for MFA recovery
        
        Args:
            count: Number of backup codes to generate
            
        Returns:
            List of backup codes
        """
        codes = []
        for _ in range(count):
            # Generate 8-character alphanumeric codes
            code = secrets.token_hex(4).upper()
            # Format as XXXX-XXXX for readability
            formatted_code = f"{code[:4]}-{code[4:]}"
            codes.append(formatted_code)
        
        return codes
    
    def hash_backup_codes(self, codes: List[str]) -> List[str]:
        """Hash backup codes for secure storage"""
        hashed_codes = []
        for code in codes:
            # Remove formatting for hashing
            clean_code = code.replace('-', '')
            hash_obj = hashlib.sha256(clean_code.encode())
            hashed_codes.append(hash_obj.hexdigest())
        
        return hashed_codes
    
    def setup_totp_mfa(
        self, 
        user_id: str, 
        totp_code: str,
        ip_address: str = None,
        user_agent: str = None
    ) -> Dict[str, Any]:
        """
        Complete TOTP MFA setup after verification
        
        Args:
            user_id: User ID
            totp_code: TOTP code for verification
            ip_address: User's IP address
            user_agent: User's user agent
            
        Returns:
            Dict with setup result and backup codes
        """
        try:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                raise ValueError("User not found")
            
            # Check if user already has TOTP MFA enabled
            existing_mfa = self.db.query(UserMFA).filter(
                UserMFA.user_id == user_id,
                UserMFA.mfa_type == MFAType.TOTP.value,
                UserMFA.is_enabled == True
            ).first()
            
            if existing_mfa:
                raise ValueError("TOTP MFA already enabled for this user")
            
            # Generate secret and verify the provided code
            secret, provisioning_uri = self.generate_totp_secret(user)
            totp = pyotp.TOTP(secret)
            
            if not totp.verify(totp_code):
                # Log failed MFA setup attempt
                self.security_service.log_event(
                    user_id=user_id,
                    event_type=SecurityEventType.MFA_FAILED.value,
                    event_category="mfa",
                    severity="medium",
                    message="Failed TOTP verification during MFA setup",
                    ip_address=ip_address,
                    user_agent=user_agent,
                    risk_score=30
                )
                raise ValueError("Invalid TOTP code")
            
            # Generate backup codes
            backup_codes = self.generate_backup_codes()
            hashed_backup_codes = self.hash_backup_codes(backup_codes)
            
            # Encrypt secret for storage
            encrypted_secret = self._encrypt_secret(secret)
            
            # Create MFA record
            mfa_record = UserMFA(
                user_id=user_id,
                mfa_type=MFAType.TOTP.value,
                secret_key=encrypted_secret,
                backup_codes=hashed_backup_codes,
                is_enabled=True,
                verified_at=datetime.now(timezone.utc)
            )
            
            self.db.add(mfa_record)
            self.db.commit()
            
            # Log successful MFA setup
            self.security_service.log_event(
                user_id=user_id,
                event_type=SecurityEventType.MFA_ENABLED.value,
                event_category="mfa",
                severity="info",
                message="TOTP MFA enabled successfully",
                ip_address=ip_address,
                user_agent=user_agent,
                event_metadata={"mfa_type": "totp"},
                risk_score=0
            )
            
            return {
                "success": True,
                "message": "TOTP MFA enabled successfully",
                "backup_codes": backup_codes,
                "mfa_id": str(mfa_record.id)
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error setting up TOTP MFA for user {user_id}: {str(e)}")
            raise e
    
    def verify_totp_code(
        self, 
        user_id: str, 
        totp_code: str,
        ip_address: str = None,
        user_agent: str = None,
        allow_backup_code: bool = True
    ) -> Dict[str, Any]:
        """
        Verify TOTP code or backup code for authentication
        
        Args:
            user_id: User ID
            totp_code: TOTP code or backup code
            ip_address: User's IP address
            user_agent: User's user agent
            allow_backup_code: Whether to allow backup code usage
            
        Returns:
            Dict with verification result
        """
        try:
            # Get user's MFA settings
            mfa_record = self.db.query(UserMFA).filter(
                UserMFA.user_id == user_id,
                UserMFA.mfa_type == MFAType.TOTP.value,
                UserMFA.is_enabled == True
            ).first()
            
            if not mfa_record:
                raise ValueError("TOTP MFA not enabled for this user")
            
            # First try TOTP verification
            if mfa_record.secret_key:
                secret = self._decrypt_secret(mfa_record.secret_key)
                totp = pyotp.TOTP(secret)
                
                if totp.verify(totp_code):
                    # Log successful MFA verification
                    self.security_service.log_event(
                        user_id=user_id,
                        event_type=SecurityEventType.MFA_SUCCESS.value,
                        event_category="mfa",
                        severity="info",
                        message="TOTP code verified successfully",
                        ip_address=ip_address,
                        user_agent=user_agent,
                        event_metadata={"mfa_type": "totp", "method": "totp_code"},
                        risk_score=0
                    )
                    
                    return {
                        "success": True,
                        "message": "TOTP verification successful",
                        "method": "totp"
                    }
            
            # If TOTP failed and backup codes are allowed, try backup code
            if allow_backup_code and mfa_record.backup_codes:
                # Clean the input code
                clean_code = totp_code.replace('-', '').upper()
                code_hash = hashlib.sha256(clean_code.encode()).hexdigest()
                
                if code_hash in mfa_record.backup_codes:
                    # Remove used backup code
                    updated_codes = [code for code in mfa_record.backup_codes if code != code_hash]
                    mfa_record.backup_codes = updated_codes
                    self.db.commit()
                    
                    # Log successful backup code usage
                    self.security_service.log_event(
                        user_id=user_id,
                        event_type=SecurityEventType.MFA_SUCCESS.value,
                        event_category="mfa",
                        severity="info",
                        message="Backup code verified successfully",
                        ip_address=ip_address,
                        user_agent=user_agent,
                        event_metadata={"mfa_type": "totp", "method": "backup_code"},
                        risk_score=10  # Slightly higher risk for backup code usage
                    )
                    
                    return {
                        "success": True,
                        "message": "Backup code verification successful",
                        "method": "backup_code",
                        "remaining_codes": len(updated_codes)
                    }
            
            # Both TOTP and backup code failed
            self.security_service.log_event(
                user_id=user_id,
                event_type=SecurityEventType.MFA_FAILED.value,
                event_category="mfa",
                severity="medium",
                message="Failed TOTP/backup code verification",
                ip_address=ip_address,
                user_agent=user_agent,
                event_metadata={"mfa_type": "totp"},
                risk_score=40
            )
            
            return {
                "success": False,
                "message": "Invalid TOTP or backup code",
                "method": None
            }
            
        except Exception as e:
            logger.error(f"Error verifying TOTP for user {user_id}: {str(e)}")
            raise e
    
    def disable_totp_mfa(
        self, 
        user_id: str,
        verification_code: str,
        ip_address: str = None,
        user_agent: str = None
    ) -> Dict[str, Any]:
        """
        Disable TOTP MFA for user after verification
        
        Args:
            user_id: User ID
            verification_code: TOTP code for verification
            ip_address: User's IP address
            user_agent: User's user agent
            
        Returns:
            Dict with disable result
        """
        try:
            # First verify the current TOTP code
            verification_result = self.verify_totp_code(
                user_id, verification_code, ip_address, user_agent, allow_backup_code=False
            )
            
            if not verification_result["success"]:
                raise ValueError("Invalid TOTP code - cannot disable MFA")
            
            # Get MFA record and disable it
            mfa_record = self.db.query(UserMFA).filter(
                UserMFA.user_id == user_id,
                UserMFA.mfa_type == MFAType.TOTP.value,
                UserMFA.is_enabled == True
            ).first()
            
            if not mfa_record:
                raise ValueError("TOTP MFA not found or already disabled")
            
            mfa_record.is_enabled = False
            self.db.commit()
            
            # Log MFA disable
            self.security_service.log_event(
                user_id=user_id,
                event_type=SecurityEventType.MFA_DISABLED.value,
                event_category="mfa",
                severity="medium",
                message="TOTP MFA disabled",
                ip_address=ip_address,
                user_agent=user_agent,
                event_metadata={"mfa_type": "totp"},
                risk_score=20  # Medium risk - security feature disabled
            )
            
            return {
                "success": True,
                "message": "TOTP MFA disabled successfully"
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error disabling TOTP MFA for user {user_id}: {str(e)}")
            raise e
    
    def get_mfa_status(self, user_id: str) -> Dict[str, Any]:
        """
        Get MFA status for user
        
        Args:
            user_id: User ID
            
        Returns:
            Dict with MFA status information
        """
        mfa_record = self.db.query(UserMFA).filter(
            UserMFA.user_id == user_id,
            UserMFA.mfa_type == MFAType.TOTP.value,
            UserMFA.is_enabled == True
        ).first()
        
        if not mfa_record:
            return {
                "enabled": False,
                "mfa_type": None,
                "backup_codes_count": 0,
                "setup_date": None
            }
        
        return {
            "enabled": True,
            "mfa_type": "totp",
            "backup_codes_count": len(mfa_record.backup_codes) if mfa_record.backup_codes else 0,
            "setup_date": mfa_record.verified_at.isoformat() if mfa_record.verified_at else None
        }
    
    def regenerate_backup_codes(
        self, 
        user_id: str,
        verification_code: str,
        ip_address: str = None,
        user_agent: str = None
    ) -> Dict[str, Any]:
        """
        Regenerate backup codes for user after verification
        
        Args:
            user_id: User ID
            verification_code: TOTP code for verification
            ip_address: User's IP address
            user_agent: User's user agent
            
        Returns:
            Dict with new backup codes
        """
        try:
            # First verify the current TOTP code
            verification_result = self.verify_totp_code(
                user_id, verification_code, ip_address, user_agent, allow_backup_code=False
            )
            
            if not verification_result["success"]:
                raise ValueError("Invalid TOTP code - cannot regenerate backup codes")
            
            # Get MFA record
            mfa_record = self.db.query(UserMFA).filter(
                UserMFA.user_id == user_id,
                UserMFA.mfa_type == MFAType.TOTP.value,
                UserMFA.is_enabled == True
            ).first()
            
            if not mfa_record:
                raise ValueError("TOTP MFA not enabled")
            
            # Generate new backup codes
            backup_codes = self.generate_backup_codes()
            hashed_backup_codes = self.hash_backup_codes(backup_codes)
            
            # Update MFA record
            mfa_record.backup_codes = hashed_backup_codes
            self.db.commit()
            
            # Log backup codes regeneration
            self.security_service.log_event(
                user_id=user_id,
                event_type="backup_codes_regenerated",
                event_category="mfa",
                severity="info",
                message="MFA backup codes regenerated",
                ip_address=ip_address,
                user_agent=user_agent,
                event_metadata={"mfa_type": "totp"},
                risk_score=5
            )
            
            return {
                "success": True,
                "message": "Backup codes regenerated successfully",
                "backup_codes": backup_codes
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error regenerating backup codes for user {user_id}: {str(e)}")
            raise e
