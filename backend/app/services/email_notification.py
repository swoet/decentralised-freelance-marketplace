import os
import logging
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

SENDGRID_API_KEY = os.getenv('SENDGRID_API_KEY')

def send_email(to_email: str, subject: str, message: str, from_email: str = 'noreply@freelancex.com'):
    if not SENDGRID_API_KEY:
        logging.error('SendGrid API key not set')
        return False
    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        mail = Mail(
            from_email=from_email,
            to_emails=to_email,
            subject=subject,
            html_content=message
        )
        response = sg.send(mail)
        logging.info(f'Email sent to {to_email}: {response.status_code}')
        return True
    except Exception as e:
        logging.error(f'Failed to send email to {to_email}: {e}')
        return False 