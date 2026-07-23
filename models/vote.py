"""Vote model for the voting system."""

from datetime import datetime, timezone
from bson import ObjectId
from database import Database


class Vote:
    """Vote model representing a vote cast by a voter."""

    def __init__(self, vote_data):
        self.id = str(vote_data.get('_id', ''))
        self.voter_id = vote_data.get('voter_id', '')
        self.candidate_id = vote_data.get('candidate_id', '')
        self.election_id = vote_data.get('election_id', '')
        self.timestamp = vote_data.get('timestamp', datetime.now(timezone.utc))

    @staticmethod
    def cast_vote(voter_id, candidate_id, election_id):
        """Cast a vote. Returns (vote, error_message)."""
        votes = Database.get_collection('votes')

        # Check for duplicate vote
        existing = votes.find_one({
            'voter_id': str(voter_id),
            'election_id': str(election_id)
        })

        if existing:
            return None, 'You have already voted in this election.'

        vote_data = {
            'voter_id': str(voter_id),
            'candidate_id': str(candidate_id),
            'election_id': str(election_id),
            'timestamp': datetime.now(timezone.utc)
        }

        result = votes.insert_one(vote_data)
        vote_data['_id'] = result.inserted_id
        return Vote(vote_data), None

    @staticmethod
    def has_voted(voter_id, election_id):
        """Check if a voter has already voted in an election."""
        votes = Database.get_collection('votes')
        return votes.find_one({
            'voter_id': str(voter_id),
            'election_id': str(election_id)
        }) is not None

    @staticmethod
    def get_vote_count(election_id, candidate_id=None):
        """Get vote count for an election or specific candidate."""
        votes = Database.get_collection('votes')
        query = {'election_id': str(election_id)}
        if candidate_id:
            query['candidate_id'] = str(candidate_id)
        return votes.count_documents(query)

    @staticmethod
    def get_results(election_id):
        """Get election results with vote counts per candidate."""
        votes = Database.get_collection('votes')
        pipeline = [
            {'$match': {'election_id': str(election_id)}},
            {'$group': {
                '_id': '$candidate_id',
                'count': {'$sum': 1}
            }},
            {'$sort': {'count': -1}}
        ]
        return list(votes.aggregate(pipeline))

    @staticmethod
    def get_voter_history(voter_id):
        """Get voting history for a voter."""
        votes = Database.get_collection('votes')
        return list(votes.find({'voter_id': str(voter_id)}).sort('timestamp', -1))

    @staticmethod
    def get_daily_votes(election_id):
        """Get daily vote counts for an election."""
        votes = Database.get_collection('votes')
        pipeline = [
            {'$match': {'election_id': str(election_id)}},
            {'$group': {
                '_id': {
                    '$dateToString': {'format': '%Y-%m-%d', 'date': '$timestamp'}
                },
                'count': {'$sum': 1}
            }},
            {'$sort': {'_id': 1}}
        ]
        return list(votes.aggregate(pipeline))

    @staticmethod
    def count_votes(query=None):
        """Count votes matching a query."""
        votes = Database.get_collection('votes')
        return votes.count_documents(query or {})

    @staticmethod
    def get_recent_votes(limit=10):
        """Get most recent votes."""
        votes = Database.get_collection('votes')
        return list(votes.find().sort('timestamp', -1).limit(limit))

    @staticmethod
    def get_election_participation_rate(election_id):
        """Get participation rate for an election."""
        from models.user import User
        total_voters = User.count_users({'role': 'voter', 'approved': True})
        total_votes = Vote.get_vote_count(election_id)
        if total_voters == 0:
            return 0
        return round((total_votes / total_voters) * 100, 1)
