"""User model for the voting system."""

from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from bson import ObjectId
from database import Database


class User(UserMixin):
    """User model representing a voter or admin."""

    def __init__(self, user_data):
        self.id = str(user_data.get('_id', ''))
        self.name = user_data.get('name', '')
        self.email = user_data.get('email', '')
        self.password = user_data.get('password', '')
        self.role = user_data.get('role', 'voter')
        self.approved = user_data.get('approved', False)
        self.profile_picture = user_data.get('profile_picture', '')
        self.created_at = user_data.get('created_at', datetime.now(timezone.utc))
        self.disabled = user_data.get('disabled', False)

    def is_admin(self):
        """Check if user has admin role."""
        return self.role == 'admin'

    def is_approved(self):
        """Check if user account is approved."""
        return self.approved

    def is_active_account(self):
        """Check if user account is not disabled."""
        return not self.disabled

    @property
    def is_active(self):
        """Override Flask-Login is_active to check approval and disabled status."""
        return self.approved and not self.disabled

    @staticmethod
    def create_user(name, email, password, role='voter'):
        """Create a new user in the database."""
        users = Database.get_collection('users')

        # Check if email already exists
        if users.find_one({'email': email.lower().strip()}):
            return None, 'Email already registered.'

        user_data = {
            'name': name.strip(),
            'email': email.lower().strip(),
            'password': generate_password_hash(password),
            'role': role,
            'approved': role == 'admin',
            'profile_picture': '',
            'created_at': datetime.now(timezone.utc),
            'disabled': False
        }

        result = users.insert_one(user_data)
        user_data['_id'] = result.inserted_id
        return User(user_data), None

    @staticmethod
    def find_by_email(email):
        """Find a user by email address."""
        users = Database.get_collection('users')
        user_data = users.find_one({'email': email.lower().strip()})
        if user_data:
            return User(user_data)
        return None

    @staticmethod
    def find_by_id(user_id):
        """Find a user by ID."""
        users = Database.get_collection('users')
        try:
            user_data = users.find_one({'_id': ObjectId(user_id)})
            if user_data:
                return User(user_data)
        except Exception:
            pass
        return None

    @staticmethod
    def verify_password(stored_password, provided_password):
        """Verify a password against the stored hash."""
        return check_password_hash(stored_password, provided_password)

    @staticmethod
    def get_all_users(search=None, role_filter=None, page=1, per_page=10):
        """Get all users with optional search and filtering."""
        users = Database.get_collection('users')
        query = {}

        if search:
            query['$or'] = [
                {'name': {'$regex': search, '$options': 'i'}},
                {'email': {'$regex': search, '$options': 'i'}}
            ]

        if role_filter and role_filter != 'all':
            query['role'] = role_filter

        total = users.count_documents(query)
        skip = (page - 1) * per_page
        user_list = users.find(query).sort('created_at', -1).skip(skip).limit(per_page)

        return [User(u) for u in user_list], total

    @staticmethod
    def update_user(user_id, update_data):
        """Update user data."""
        users = Database.get_collection('users')
        users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': update_data}
        )

    @staticmethod
    def approve_user(user_id):
        """Approve a user account."""
        users = Database.get_collection('users')
        users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'approved': True}}
        )

    @staticmethod
    def disable_user(user_id):
        """Disable a user account."""
        users = Database.get_collection('users')
        users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'disabled': True}}
        )

    @staticmethod
    def enable_user(user_id):
        """Enable a user account."""
        users = Database.get_collection('users')
        users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'disabled': False}}
        )

    @staticmethod
    def delete_user(user_id):
        """Delete a user."""
        users = Database.get_collection('users')
        users.delete_one({'_id': ObjectId(user_id)})

    @staticmethod
    def count_users(query=None):
        """Count users matching a query."""
        users = Database.get_collection('users')
        return users.count_documents(query or {})

    @staticmethod
    def change_password(user_id, new_password):
        """Change user password."""
        users = Database.get_collection('users')
        users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'password': generate_password_hash(new_password)}}
        )
