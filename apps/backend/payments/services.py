import razorpay
from django.conf import settings

class RazorpayClient:
    def __init__(self):
        self.client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

    def create_order(self, amount, currency='INR'):
        data = {
            'amount': int(amount * 100), # Amount in paise
            'currency': currency,
            'payment_capture': 1
        }
        try:
            order = self.client.order.create(data=data)
            return order
        except Exception as e:
            if settings.DEBUG:
                import uuid
                return {
                    'id': f'order_mock_{uuid.uuid4().hex[:14]}',
                    'amount': int(amount * 100),
                    'currency': currency,
                    'status': 'created'
                }
            raise e

    def verify_signature(self, razorpay_order_id, razorpay_payment_id, razorpay_signature):
        if settings.DEBUG and razorpay_signature == 'mock_signature_hash':
            return True
        try:
            self.client.utility.verify_payment_signature({
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature
            })
            return True
        except Exception:
            return False

    def refund_payment(self, payment_id: str, amount: float) -> dict:
        """Amount in Rupees (will convert to paise)"""
        if settings.DEBUG and (not payment_id or payment_id.startswith('mock_') or payment_id.startswith('order_mock_') or settings.RAZORPAY_KEY_ID.startswith('rzp_test_PLACEHOLDER')):
            return {"status": "refunded", "id": f"rfnd_mock_{payment_id or 'none'}"}
        try:
            return self.client.payment.refund(payment_id, {
                "amount": int(amount * 100),
                "speed": "normal",
                "notes": {"reason": "Booking rejected by vendor"}
            })
        except Exception as e:
            if settings.DEBUG:
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Razorpay refund failed in DEBUG mode: {e}. Simulating success.")
                return {"status": "refunded", "id": f"rfnd_mock_{payment_id or 'none'}"}
            raise e
