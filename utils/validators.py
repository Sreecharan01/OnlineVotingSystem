"""Input validation utilities."""

import re


def validate_email(email):
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_password(password):
    """Validate password strength. Minimum 8 characters, at least one uppercase,
    one lowercase, one digit, and one special character."""
    if len(password) < 8:
        return False, 'Password must be at least 8 characters long.'
    if not re.search(r'[A-Z]', password):
        return False, 'Password must contain at least one uppercase letter.'
    if not re.search(r'[a-z]', password):
        return False, 'Password must contain at least one lowercase letter.'
    if not re.search(r'\d', password):
        return False, 'Password must contain at least one digit.'
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, 'Password must contain at least one special character.'
    return True, 'Password is strong.'


def validate_name(name):
    """Validate name is not empty and has minimum length."""
    if not name or len(name.strip()) < 2:
        return False, 'Name must be at least 2 characters.'
    if len(name.strip()) > 100:
        return False, 'Name must be less than 100 characters.'
    return True, 'Valid name.'


def sanitize_input(text):
    """Sanitize input to prevent XSS and injection attacks."""
    if not text:
        return ''
    # Remove potentially dangerous characters for MongoDB injection
    dangerous = ['$', '{', '}']
    for char in dangerous:
        text = text.replace(char, '')
    return text.strip()
