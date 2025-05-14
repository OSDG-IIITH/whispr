"""
Verified emails manager module.

This module defines the VerifiedManager class that manages
email addresses that have been verified through CAS.
"""
import logging
import re
from typing import Dict, List

from config import Config
from managers.base import BaseManager, log_operation

# Configure logging
logger = logging.getLogger(__name__)


class VerifiedManager(BaseManager):
    """
    Manager for verified email addresses.

    This class handles the verification and tracking of email addresses
    that have been authenticated through CAS.
    """

    def __init__(self):
        """Initialize the verified emails manager."""
        super().__init__('verified')

    def _is_valid_academic_email(self, email: str) -> bool:
        """
        Check if an email belongs to an allowed academic domain.

        Args:
            email: Email address to check

        Returns:
            True if email belongs to an allowed domain, False otherwise
        """
        return any(re.match(pattern, email)
                   for pattern in Config.ALLOWED_DOMAINS)

    @log_operation
    async def is_email_verified(self, email: str) -> bool:
        """
        Check if an email address has already been verified.

        Args:
            email: Email address to check

        Returns:
            True if email has been verified, False otherwise
        """
        return await self.exists({"email": email})

    @log_operation
    async def verify_email(self, email: str) -> Dict:
        """
        Mark an email address as verified.

        Args:
            email: Email address to verify

        Returns:
            Verification document

        Raises:
            ValueError: If email is invalid or already verified
        """
        # Check if the email belongs to an allowed domain
        if not self._is_valid_academic_email(email):
            raise ValueError(f"Email domain not allowed: {email}")

        # Check if email is already verified
        if await self.is_email_verified(email):
            raise ValueError(f"Email already verified: {email}")

        # Add to verified collection
        result = await self.collection.insert_one({"email": email})
        logger.info("Email verified and added to database")

        return await self.get_by_id(str(result.inserted_id))

    @log_operation
    async def get_all_verified_emails(self) -> List[Dict]:
        """
        Get all verified email addresses.

        Returns:
            List of verified email records
        """
        cursor = self.collection.find({})
        return await cursor.to_list(length=None)

    @log_operation
    async def remove_verification(self, email: str) -> bool:
        """
        Remove an email from the verified list.

        Args:
            email: Email address to remove

        Returns:
            True if email was removed, False otherwise
        """
        result = await self.collection.delete_one({"email": email})
        return result.deleted_count > 0
