"""Database connection module for MongoDB Atlas."""

from pymongo import MongoClient
from config import Config


class Database:
    """MongoDB Atlas database connection handler."""

    _client = None
    _db = None

    @classmethod
    def get_client(cls):
        """Get or create the MongoDB client."""
        if cls._client is None:
            cls._client = MongoClient(Config.MONGO_URI)
        return cls._client

    @classmethod
    def get_db(cls):
        """Get the database instance."""
        if cls._db is None:
            client = cls.get_client()
            cls._db = client.get_default_database()
            if cls._db is None:
                # Fallback: parse DB name from URI or use default
                cls._db = client['online_voting']
        return cls._db

    @classmethod
    def get_collection(cls, collection_name):
        """Get a specific collection."""
        db = cls.get_db()
        return db[collection_name]

    @classmethod
    def init_db(cls):
        """Initialize database collections and indexes."""
        db = cls.get_db()

        # Create collections if they don't exist
        existing = db.list_collection_names()

        if 'users' not in existing:
            db.create_collection('users')
        if 'elections' not in existing:
            db.create_collection('elections')
        if 'candidates' not in existing:
            db.create_collection('candidates')
        if 'votes' not in existing:
            db.create_collection('votes')
        if 'activity_logs' not in existing:
            db.create_collection('activity_logs')

        # Create indexes
        db.users.create_index('email', unique=True)
        db.votes.create_index([('voter_id', 1), ('election_id', 1)], unique=True)
        db.candidates.create_index('election_id')
        db.activity_logs.create_index('time')

    @classmethod
    def close(cls):
        """Close the database connection."""
        if cls._client:
            cls._client.close()
            cls._client = None
            cls._db = None
