"""
CAS Validation Service for CAS authentication.
"""

import xml.etree.ElementTree as ET
from urllib.parse import quote
import requests
from config import Config

def validate_cas_ticket(ticket: str, service: str) -> dict:
    """
    Validate a CAS ticket.

    Args:
        ticket (str): The CAS ticket to validate.
        service (str): The service for which the ticket is valid.

    Returns:
        dict: A dictionary containing the validation result.
    """
    cas_url = Config.CAS_URL
    validation_url = f"{cas_url}/serviceValidate?ticket={quote(ticket)}&service={quote(service)}"

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
