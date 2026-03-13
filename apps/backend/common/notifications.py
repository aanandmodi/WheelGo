def send_notification(user, title, message):
    """
    Mock Service to send Push Notifications via FCM.
    In real implementation, this wraps fcm-django or pyfcm.
    """
    print(f"--- NOTIFICATION SENT ---")
    print(f"To: {user.phone_number}")
    print(f"Title: {title}")
    print(f"Body: {message}")
    print(f"-------------------------")
    return True
