"""
CAS (Central Authentication Service) integration module.

This module provides functionality for validating CAS service tickets
against a CAS server for user identity verification only.
CAS is NOT used for login/authentication in this application, only
for verifying institutional email addresses to unmute user accounts.
"""

import logging
from typing import Optional, Dict, Any
from cas import CASClient
from dotenv import find_dotenv, load_dotenv
from config import Config

# Load environment variables
load_dotenv(find_dotenv(usecwd=True))

# Configure logging
logger = logging.getLogger(__name__)

# CAS client configuration
CAS_SERVER_URL = Config.CAS_URL
SERVICE_URL = Config.SERVICE_URL

# Create CAS client - used ONLY for institutional email verification,
# not for login
cas_client = CASClient(
    version=3,
    service_url=SERVICE_URL,
    server_url=CAS_SERVER_URL
)


async def verify_cas_authentication(ticket: str) -> Optional[Dict[str, Any]]:
    """
    Verify a CAS ticket to confirm institutional
    identity for account verification.

    This function is NOT used for authentication/login, but only for verifying
    that a user has a valid institutional email address so their account
    can be unmuted.

    Args:
        ticket: CAS verification ticket

    Returns:
        User data dictionary if validation successful, None otherwise
    """
    logger.info("Verifying institutional identity with CAS ticket")

    try:
        # Use the CASClient to verify the ticket
        user, attributes, _pgtiou = cas_client.verify_ticket(ticket)

        if not user:
            logger.error("CAS validation failed: No user returned")
            return None

        # Return user details with standardized structure
        user_data = {
            "email": user,
            "uid": attributes.get("uid"),
            "name": attributes.get("Name"),
            "roll_no": attributes.get("RollNo"),
            "first_name": attributes.get("FirstName"),
            "last_name": attributes.get("LastName"),
            "attributes": attributes or {}
        }

        logger.info("CAS validation successful for user: %s", user)
        return user_data
    except (AttributeError, ValueError, KeyError) as e:
        logger.error("Error validating specific CAS attributes: %s", str(e))
        return None
    except Exception as e:
        logger.error("CAS library error during validation: %s", str(e))
        return None
