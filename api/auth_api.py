"""Authentication API routes."""

import jwt
import datetime
from functools import wraps
from flask import Blueprint, request, jsonify, current_app
from models.user import User
from utils.validators import validate_email, validate_password, validate_name, sanitize_input
from utils.auth_utils import log_activity

auth_api_bp = Blueprint('auth_api', __name__, url_prefix='/api/auth')


def token_required(f):
    """Decorator to protect routes with JWT authentication."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]

        if not token:
            return jsonify({'error': 'Authentication token is missing.'}), 401

        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.find_by_id(data['user_id'])
            if not current_user:
                return jsonify({'error': 'Invalid token. User not found.'}), 401
            if current_user.disabled:
                return jsonify({'error': 'Account has been disabled.'}), 403
            if not current_user.approved:
                return jsonify({'error': 'Account is pending approval.'}), 403
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired.'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token.'}), 401

        return f(current_user, *args, **kwargs)
    return decorated


def admin_required(f):
    """Decorator to restrict routes to admin users."""
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if not current_user.is_admin():
            return jsonify({'error': 'Admin access required.'}), 403
        return f(current_user, *args, **kwargs)
    return decorated


def generate_token(user):
    """Generate a JWT token for the given user."""
    payload = {
        'user_id': user.id,
        'role': user.role,
        'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')


def serialize_user(user):
    """Serialize user object to dict."""
    return {
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'role': user.role,
        'approved': user.approved,
        'disabled': user.disabled,
        'profile_picture': user.profile_picture,
        'created_at': user.created_at.isoformat() if user.created_at else None
    }


@auth_api_bp.route('/login', methods=['POST'])
def login():
    """User login."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required.'}), 400

    email = sanitize_input(data.get('email', ''))
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Please fill in all fields.'}), 400

    user = User.find_by_email(email)

    if user and User.verify_password(user.password, password):
        if user.disabled:
            return jsonify({'error': 'Your account has been disabled. Contact admin.'}), 403

        if not user.approved:
            return jsonify({'error': 'Your account is pending approval. Please wait for admin approval.'}), 403

        token = generate_token(user)
        log_activity(user.name, 'Logged in')

        return jsonify({
            'message': 'Login successful.',
            'token': token,
            'user': serialize_user(user)
        }), 200
    else:
        return jsonify({'error': 'Invalid email or password.'}), 401


@auth_api_bp.route('/register', methods=['POST'])
def register():
    """User registration."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required.'}), 400

    name = sanitize_input(data.get('name', ''))
    email = sanitize_input(data.get('email', ''))
    password = data.get('password', '')
    confirm_password = data.get('confirm_password', '')

    # Validations
    valid_name, name_msg = validate_name(name)
    if not valid_name:
        return jsonify({'error': name_msg}), 400

    if not validate_email(email):
        return jsonify({'error': 'Please enter a valid email address.'}), 400

    valid_pass, pass_msg = validate_password(password)
    if not valid_pass:
        return jsonify({'error': pass_msg}), 400

    if password != confirm_password:
        return jsonify({'error': 'Passwords do not match.'}), 400

    user, error = User.create_user(name, email, password, role='voter')

    if error:
        return jsonify({'error': error}), 400

    log_activity(name, 'Registered a new account')
    return jsonify({'message': 'Registration successful! Please wait for admin approval.'}), 201


@auth_api_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    """Get current authenticated user info."""
    return jsonify({'user': serialize_user(current_user)}), 200


@auth_api_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Forgot password handler."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required.'}), 400

    email = sanitize_input(data.get('email', ''))
    if not email:
        return jsonify({'error': 'Please enter your email address.'}), 400

    user = User.find_by_email(email)
    if user:
        User.change_password(user.id, 'Password@123')
        log_activity(user.name, 'Password reset requested')

    # Always return success to prevent email enumeration
    return jsonify({'message': 'If this email exists, a reset link has been sent. (Demo: password reset to "Password@123")'}), 200
