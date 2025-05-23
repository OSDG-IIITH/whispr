"""
CAS (Central Authentication Service) integration for IIITH.
Handles anonymous verification flow.
"""

import urllib.parse
from typing import Optional

import httpx

from app.core.config import settings


class CASClient:
    """CAS client for IIITH authentication."""

    def __init__(self):
        self.server_url = settings.CAS_SERVER_URL.rstrip('/')
        self.service_url = settings.CAS_SERVICE_URL

    def get_login_url(self, session_token: str) -> str:
        """
        Generate CAS login URL with session token as state parameter.

        The session token is passed as 'state' parameter to maintain
        verification session during CAS flow.
        """
        params = {
            'service': f"{self.service_url}?state={session_token}"
        }

        query_string = urllib.parse.urlencode(params)
        return f"{self.server_url}/login?{query_string}"

    async def validate_ticket(
            self, ticket: str, session_token: str
    ) -> Optional[str]:
        """
        Validate CAS ticket and return email if successful.

        Returns:
            Email address if validation successful, None otherwise.
        """
        validation_url = f"{self.server_url}/serviceValidate"

        params = {
            'ticket': ticket,
            'service': f"{self.service_url}?state={session_token}"
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(validation_url, params=params)
                response.raise_for_status()

                # Parse CAS XML response
                content = response.text

                # Simple XML parsing for CAS response
                if '<cas:authenticationSuccess>' in content:
                    # Extract username (email) from response
                    start = content.find('<cas:user>') + len('<cas:user>')
                    end = content.find('</cas:user>')

                    if start > len('<cas:user>') - 1 and end > start:
                        email = content[start:end].strip()

                        # Validate IIITH email format
                        if self._is_valid_iiith_email(email):
                            return email

                return None

        except Exception as e:
            print(f"CAS validation error: {e}")
            return None

    def _is_valid_iiith_email(self, email: str) -> bool:
        """Validate that email is from IIITH domain."""
        valid_domains = [
            '@students.iiit.ac.in',
            '@research.iiit.ac.in',
            '@iiit.ac.in'
        ]

        email_lower = email.lower()
        return any(email_lower.endswith(domain) for domain in valid_domains)


# Global CAS client instance
cas_client = CASClient()
