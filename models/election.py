"""Election model for the voting system."""

from datetime import datetime, timezone
from bson import ObjectId
from database import Database


class Election:
    """Election model representing a voting election."""

    STATUS_UPCOMING = 'upcoming'
    STATUS_ACTIVE = 'active'
    STATUS_ENDED = 'ended'
    STATUS_CANCELLED = 'cancelled'

    def __init__(self, election_data):
        self.id = str(election_data.get('_id', ''))
        self.title = election_data.get('title', '')
        self.description = election_data.get('description', '')
        self.start_date = election_data.get('start_date')
        self.end_date = election_data.get('end_date')
        self.status = election_data.get('status', self.STATUS_UPCOMING)
        self.created_by = election_data.get('created_by', '')
        self.winner = election_data.get('winner', None)
        self.created_at = election_data.get('created_at', datetime.now(timezone.utc))

    def is_active(self):
        """Check if election is currently active."""
        return self.status == self.STATUS_ACTIVE

    def is_upcoming(self):
        """Check if election is upcoming."""
        return self.status == self.STATUS_UPCOMING

    def has_ended(self):
        """Check if election has ended."""
        return self.status == self.STATUS_ENDED

    def to_dict(self):
        """Convert election to dictionary."""
        return {
            '_id': ObjectId(self.id) if self.id else None,
            'title': self.title,
            'description': self.description,
            'start_date': self.start_date,
            'end_date': self.end_date,
            'status': self.status,
            'created_by': self.created_by,
            'winner': self.winner,
            'created_at': self.created_at
        }

    @staticmethod
    def create_election(title, description, start_date, end_date, created_by):
        """Create a new election."""
        elections = Database.get_collection('elections')

        election_data = {
            'title': title.strip(),
            'description': description.strip(),
            'start_date': start_date,
            'end_date': end_date,
            'status': Election.STATUS_UPCOMING,
            'created_by': created_by,
            'winner': None,
            'created_at': datetime.now(timezone.utc)
        }

        result = elections.insert_one(election_data)
        election_data['_id'] = result.inserted_id
        return Election(election_data)

    @staticmethod
    def find_by_id(election_id):
        """Find an election by ID."""
        elections = Database.get_collection('elections')
        try:
            data = elections.find_one({'_id': ObjectId(election_id)})
            if data:
                return Election(data)
        except Exception:
            pass
        return None

    @staticmethod
    def get_all(search=None, status_filter=None, page=1, per_page=10):
        """Get all elections with optional filtering."""
        elections = Database.get_collection('elections')
        query = {}

        if search:
            query['$or'] = [
                {'title': {'$regex': search, '$options': 'i'}},
                {'description': {'$regex': search, '$options': 'i'}}
            ]

        if status_filter and status_filter != 'all':
            query['status'] = status_filter

        total = elections.count_documents(query)
        skip = (page - 1) * per_page
        election_list = elections.find(query).sort('created_at', -1).skip(skip).limit(per_page)

        return [Election(e) for e in election_list], total

    @staticmethod
    def get_active_elections():
        """Get all active elections."""
        elections = Database.get_collection('elections')
        result = elections.find({'status': Election.STATUS_ACTIVE}).sort('start_date', -1)
        return [Election(e) for e in result]

    @staticmethod
    def get_upcoming_elections():
        """Get all upcoming elections."""
        elections = Database.get_collection('elections')
        result = elections.find({'status': Election.STATUS_UPCOMING}).sort('start_date', 1)
        return [Election(e) for e in result]

    @staticmethod
    def update_election(election_id, update_data):
        """Update election data."""
        elections = Database.get_collection('elections')
        elections.update_one(
            {'_id': ObjectId(election_id)},
            {'$set': update_data}
        )

    @staticmethod
    def delete_election(election_id):
        """Delete an election and associated data."""
        elections = Database.get_collection('elections')
        candidates = Database.get_collection('candidates')
        votes = Database.get_collection('votes')

        # Delete associated candidates and votes
        candidates.delete_many({'election_id': str(election_id)})
        votes.delete_many({'election_id': str(election_id)})
        elections.delete_one({'_id': ObjectId(election_id)})

    @staticmethod
    def start_election(election_id):
        """Start an election."""
        elections = Database.get_collection('elections')
        elections.update_one(
            {'_id': ObjectId(election_id)},
            {'$set': {
                'status': Election.STATUS_ACTIVE,
                'start_date': datetime.now(timezone.utc)
            }}
        )

    @staticmethod
    def stop_election(election_id):
        """Stop an election."""
        elections = Database.get_collection('elections')
        elections.update_one(
            {'_id': ObjectId(election_id)},
            {'$set': {
                'status': Election.STATUS_ENDED,
                'end_date': datetime.now(timezone.utc)
            }}
        )

    @staticmethod
    def declare_winner(election_id, candidate_id):
        """Declare the winner of an election."""
        elections = Database.get_collection('elections')
        elections.update_one(
            {'_id': ObjectId(election_id)},
            {'$set': {'winner': str(candidate_id)}}
        )

    @staticmethod
    def count_elections(query=None):
        """Count elections matching a query."""
        elections = Database.get_collection('elections')
        return elections.count_documents(query or {})
