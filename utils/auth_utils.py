"""Authentication utilities."""

from datetime import datetime, timezone
from database import Database


def log_activity(user_name, action):
    """Log a user activity."""
    logs = Database.get_collection('activity_logs')
    logs.insert_one({
        'user': user_name,
        'action': action,
        'time': datetime.now(timezone.utc)
    })


def get_recent_activities(limit=15):
    """Get recent activity logs."""
    logs = Database.get_collection('activity_logs')
    return list(logs.find().sort('time', -1).limit(limit))
