"""
Firebase Admin SDK Configuration

To set up Firebase Admin:
1. Go to Firebase Console > Project Settings > Service accounts
2. Generate new private key
3. Save as 'firebase-service-account.json' in this directory
4. NEVER commit this file to git!
"""

import os
import firebase_admin
from firebase_admin import credentials, auth
from django.conf import settings

# Initialize Firebase Admin
_firebase_app = None


def get_firebase_app():
    """Get or initialize Firebase Admin app"""
    global _firebase_app
    
    if _firebase_app is not None:
        return _firebase_app
    
    # Path to service account key
    service_account_path = os.path.join(
        settings.BASE_DIR, 
        'firebase-service-account.json'
    )
    
    if not os.path.exists(service_account_path):
        print("WARNING: Firebase service account not found. Firebase auth disabled.")
        return None
    
    try:
        cred = credentials.Certificate(service_account_path)
        _firebase_app = firebase_admin.initialize_app(cred)
        print("Firebase Admin SDK initialized successfully")
        return _firebase_app
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        return None


def verify_firebase_token(id_token: str) -> dict:
    """
    Verify Firebase ID token and return user info
    
    Args:
        id_token: Firebase ID token from client
        
    Returns:
        dict with uid, phone_number, email, etc.
        
    Raises:
        ValueError: If token is invalid
    """
    app = get_firebase_app()
    
    if app is None:
        raise ValueError("Firebase not configured")
    
    try:
        decoded_token = auth.verify_id_token(id_token)
        return {
            'uid': decoded_token.get('uid'),
            'phone_number': decoded_token.get('phone_number'),
            'email': decoded_token.get('email'),
            'email_verified': decoded_token.get('email_verified', False),
            'provider': decoded_token.get('firebase', {}).get('sign_in_provider'),
        }
    except auth.InvalidIdTokenError:
        raise ValueError("Invalid Firebase token")
    except auth.ExpiredIdTokenError:
        raise ValueError("Firebase token expired")
    except Exception as e:
        raise ValueError(f"Token verification failed: {str(e)}")


def get_firebase_user(uid: str):
    """Get Firebase user by UID"""
    app = get_firebase_app()
    if app is None:
        return None
    
    try:
        return auth.get_user(uid)
    except auth.UserNotFoundError:
        return None
