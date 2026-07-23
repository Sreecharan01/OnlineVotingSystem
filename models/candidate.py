"""Candidate model for the voting system."""

from datetime import datetime, timezone
from bson import ObjectId
from database import Database


class Candidate:
    """Candidate model representing an election candidate."""

    def __init__(self, candidate_data):
        self.id = str(candidate_data.get('_id', ''))
        self.election_id = candidate_data.get('election_id', '')
        self.name = candidate_data.get('name', '')
        self.party = candidate_data.get('party', '')
        self.symbol = candidate_data.get('symbol', '')
        self.photo = candidate_data.get('photo', '')
        self.description = candidate_data.get('description', '')
        self.created_at = candidate_data.get('created_at', datetime.now(timezone.utc))

    def to_dict(self):
        """Convert candidate to dictionary."""
        return {
            '_id': ObjectId(self.id) if self.id else None,
            'election_id': self.election_id,
            'name': self.name,
            'party': self.party,
            'symbol': self.symbol,
            'photo': self.photo,
            'description': self.description,
            'created_at': self.created_at
        }

    @staticmethod
    def create_candidate(election_id, name, party, symbol='', photo='', description=''):
        """Create a new candidate."""
        candidates = Database.get_collection('candidates')

        candidate_data = {
            'election_id': str(election_id),
            'name': name.strip(),
            'party': party.strip(),
            'symbol': symbol,
            'photo': photo,
            'description': description.strip(),
            'created_at': datetime.now(timezone.utc)
        }

        result = candidates.insert_one(candidate_data)
        candidate_data['_id'] = result.inserted_id
        return Candidate(candidate_data)

    @staticmethod
    def find_by_id(candidate_id):
        """Find a candidate by ID."""
        candidates = Database.get_collection('candidates')
        try:
            data = candidates.find_one({'_id': ObjectId(candidate_id)})
            if data:
                return Candidate(data)
        except Exception:
            pass
        return None

    @staticmethod
    def get_by_election(election_id):
        """Get all candidates for a specific election."""
        candidates = Database.get_collection('candidates')
        result = candidates.find({'election_id': str(election_id)}).sort('name', 1)
        return [Candidate(c) for c in result]

    @staticmethod
    def get_all(search=None, page=1, per_page=10):
        """Get all candidates with optional search."""
        candidates = Database.get_collection('candidates')
        query = {}

        if search:
            query['$or'] = [
                {'name': {'$regex': search, '$options': 'i'}},
                {'party': {'$regex': search, '$options': 'i'}}
            ]

        total = candidates.count_documents(query)
        skip = (page - 1) * per_page
        candidate_list = candidates.find(query).sort('created_at', -1).skip(skip).limit(per_page)

        return [Candidate(c) for c in candidate_list], total

    @staticmethod
    def update_candidate(candidate_id, update_data):
        """Update candidate data."""
        candidates = Database.get_collection('candidates')
        candidates.update_one(
            {'_id': ObjectId(candidate_id)},
            {'$set': update_data}
        )

    @staticmethod
    def delete_candidate(candidate_id):
        """Delete a candidate."""
        candidates = Database.get_collection('candidates')
        votes = Database.get_collection('votes')
        votes.delete_many({'candidate_id': str(candidate_id)})
        candidates.delete_one({'_id': ObjectId(candidate_id)})

    @staticmethod
    def count_candidates(query=None):
        """Count candidates matching a query."""
        candidates = Database.get_collection('candidates')
        return candidates.count_documents(query or {})
