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
        order = self.client.order.create(data=data)
        return order

    def verify_signature(self, razorpay_order_id, razorpay_payment_id, razorpay_signature):
        try:
            self.client.utility.verify_payment_signature({
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature
            })
            return True
        except razorpay.errors.SignatureVerificationError:
            return False
