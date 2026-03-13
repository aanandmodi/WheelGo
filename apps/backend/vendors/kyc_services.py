import random

class DigiLockerClient:
    """
    Mock client for DigiLocker Integration.
    In real implementation, this would handle OAuth flow and document fetching.
    """
    
    def initiate_verification(self, user_id):
        # Generate a mock transaction ID
        return f"REQ_{user_id}_{random.randint(1000, 9999)}"

    def check_status(self, transaction_id):
        # Simulate status check
        # For demo purposes, we randomly approve or keep pending
        status = random.choice(['verified', 'pending', 'rejected'])
        return {
            'status': status,
            'details': {
                'name': 'John Doe',
                'document_type': 'Aadhaar'
            } if status == 'verified' else {}
        }
