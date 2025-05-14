"""
CAS (Central Authentication Service) integration module.

This module provides functionality for validating CAS service tickets
against a CAS server as part of the authentication process.
"""

import xml.etree.ElementTree as ET
from urllib.parse import quote
import requests
from config import Config


def validate_cas_ticket(ticket: str, service: str) -> dict:
    """
    Validate a CAS service ticket against the configured CAS server.

    Args:
        ticket (str): The CAS ticket to validate
        service (str): The service URL for which the ticket was issued

    Returns:
        dict: A dictionary containing validation results with keys:
            - success (bool): Whether validation was successful
            - message (str): A descriptive message about the validation result
            - user (dict, optional): User data if validation was successful
    """
    cas_url = Config.CAS_URL
    validation_url = (
        f"{cas_url}/serviceValidate?"
        f"ticket={quote(ticket)}&"
        f"service={quote(service)}"
    )

    response = requests.get(validation_url, timeout=10)
    data = response.text
    json_data = ET.fromstring(data)
    cas_response = json_data['cas:serviceResponse']

    if cas_response['cas:authenticationFailure']:
        return {
            "success": False,
            "message": "Invalid ticket"
        }

    user = cas_response['cas:authenticationSuccess']
    return {
        "success": True,
        "message": "Ticket validated successfully",
        "user": user
    }
