"""Voter API routes."""

import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from models.user import User
from models.election import Election
from models.candidate import Candidate
from models.vote import Vote
from api.auth_api import token_required, serialize_user
from utils.auth_utils import log_activity
from utils.validators import validate_password, sanitize_input
from config import Config

voter_api_bp = Blueprint('voter_api', __name__, url_prefix='/api/voter')


def serialize_election(election):
    """Serialize election object to dict."""
    return {
        'id': election.id,
        'title': election.title,
        'description': election.description,
        'start_date': election.start_date.isoformat() if election.start_date else None,
        'end_date': election.end_date.isoformat() if election.end_date else None,
        'status': election.status,
        'winner': election.winner,
        'created_at': election.created_at.isoformat() if election.created_at else None
    }


def serialize_candidate(candidate):
    """Serialize candidate object to dict."""
    return {
        'id': candidate.id,
        'election_id': candidate.election_id,
        'name': candidate.name,
        'party': candidate.party,
        'symbol': candidate.symbol,
        'photo': candidate.photo,
        'description': candidate.description,
        'created_at': candidate.created_at.isoformat() if candidate.created_at else None
    }


@voter_api_bp.route('/dashboard', methods=['GET'])
@token_required
def dashboard(current_user):
    """Voter dashboard data."""
    active_elections = Election.get_active_elections()
    upcoming_elections = Election.get_upcoming_elections()
    vote_history = Vote.get_voter_history(current_user.id)

    # Get election details for vote history
    vote_details = []
    for vote in vote_history:
        election = Election.find_by_id(vote.get('election_id'))
        candidate = Candidate.find_by_id(vote.get('candidate_id'))
        vote_details.append({
            'election': serialize_election(election) if election else None,
            'candidate': serialize_candidate(candidate) if candidate else None,
            'timestamp': vote.get('timestamp').isoformat() if vote.get('timestamp') else None
        })

    return jsonify({
        'active_elections': [serialize_election(e) for e in active_elections],
        'upcoming_elections': [serialize_election(e) for e in upcoming_elections],
        'vote_history': vote_details
    }), 200


@voter_api_bp.route('/elections', methods=['GET'])
@token_required
def elections(current_user):
    """View all elections."""
    search = sanitize_input(request.args.get('search', ''))
    status_filter = request.args.get('status', 'all')
    page = request.args.get('page', 1, type=int)

    election_list, total = Election.get_all(search=search, status_filter=status_filter, page=page, per_page=9)

    # Check which elections user has voted in
    voted_elections = []
    for election in election_list:
        if Vote.has_voted(current_user.id, election.id):
            voted_elections.append(election.id)

    total_pages = (total + 8) // 9

    return jsonify({
        'elections': [serialize_election(e) for e in election_list],
        'voted_elections': voted_elections,
        'total': total,
        'page': page,
        'total_pages': total_pages,
        'search': search,
        'status_filter': status_filter
    }), 200


@voter_api_bp.route('/election/<election_id>', methods=['GET'])
@token_required
def election_details(current_user, election_id):
    """View election details."""
    election = Election.find_by_id(election_id)
    if not election:
        return jsonify({'error': 'Election not found.'}), 404

    candidates = Candidate.get_by_election(election_id)
    has_voted = Vote.has_voted(current_user.id, election_id)
    total_votes = Vote.get_vote_count(election_id)

    # Get vote counts per candidate
    candidate_data = []
    for cand in candidates:
        c = serialize_candidate(cand)
        c['votes'] = Vote.get_vote_count(election_id, cand.id)
        candidate_data.append(c)

    return jsonify({
        'election': serialize_election(election),
        'candidates': candidate_data,
        'has_voted': has_voted,
        'total_votes': total_votes
    }), 200


@voter_api_bp.route('/vote/<election_id>', methods=['GET'])
@token_required
def get_vote_page(current_user, election_id):
    """Get voting page data."""
    election = Election.find_by_id(election_id)
    if not election:
        return jsonify({'error': 'Election not found.'}), 404

    if not election.is_active():
        return jsonify({'error': 'This election is not currently active.'}), 400

    if Vote.has_voted(current_user.id, election_id):
        return jsonify({'error': 'You have already voted in this election.', 'already_voted': True}), 400

    candidates = Candidate.get_by_election(election_id)

    return jsonify({
        'election': serialize_election(election),
        'candidates': [serialize_candidate(c) for c in candidates]
    }), 200


@voter_api_bp.route('/vote/<election_id>', methods=['POST'])
@token_required
def cast_vote(current_user, election_id):
    """Cast a vote."""
    election = Election.find_by_id(election_id)
    if not election:
        return jsonify({'error': 'Election not found.'}), 404

    if not election.is_active():
        return jsonify({'error': 'This election is not currently active.'}), 400

    if Vote.has_voted(current_user.id, election_id):
        return jsonify({'error': 'You have already voted in this election.'}), 400

    data = request.get_json()
    candidate_id = data.get('candidate_id') if data else None

    if not candidate_id:
        return jsonify({'error': 'Please select a candidate.'}), 400

    # Verify candidate exists and belongs to this election
    candidate = Candidate.find_by_id(candidate_id)
    if not candidate or candidate.election_id != election_id:
        return jsonify({'error': 'Invalid candidate selection.'}), 400

    vote_obj, error = Vote.cast_vote(current_user.id, candidate_id, election_id)
    if error:
        return jsonify({'error': error}), 400

    log_activity(current_user.name, f'Voted in election: {election.title}')
    return jsonify({'message': 'Your vote has been submitted successfully!'}), 201


@voter_api_bp.route('/vote-receipt/<election_id>', methods=['GET'])
@token_required
def vote_receipt(current_user, election_id):
    """Get vote receipt."""
    election = Election.find_by_id(election_id)
    if not election:
        return jsonify({'error': 'Election not found.'}), 404

    if not Vote.has_voted(current_user.id, election_id):
        return jsonify({'error': 'No vote record found.'}), 404

    votes_collection = Vote.get_voter_history(current_user.id)
    vote_record = None
    for v in votes_collection:
        if v.get('election_id') == election_id:
            vote_record = v
            break

    candidate = None
    if vote_record:
        candidate = Candidate.find_by_id(vote_record.get('candidate_id'))

    return jsonify({
        'election': serialize_election(election),
        'candidate': serialize_candidate(candidate) if candidate else None,
        'vote_record': {
            '_id': str(vote_record.get('_id', '')) if vote_record else None,
            'timestamp': vote_record.get('timestamp').isoformat() if vote_record and vote_record.get('timestamp') else None
        }
    }), 200


@voter_api_bp.route('/results/<election_id>', methods=['GET'])
@token_required
def results(current_user, election_id):
    """View election results."""
    election = Election.find_by_id(election_id)
    if not election:
        return jsonify({'error': 'Election not found.'}), 404

    candidates = Candidate.get_by_election(election_id)
    total_votes = Vote.get_vote_count(election_id)
    results_data = Vote.get_results(election_id)

    results_list = []
    for r in results_data:
        cand = Candidate.find_by_id(r['_id'])
        if cand:
            pct = round((r['count'] / total_votes) * 100, 1) if total_votes > 0 else 0
            results_list.append({
                'candidate': serialize_candidate(cand),
                'votes': r['count'],
                'percentage': pct
            })

    # Determine winner
    winner_candidate = None
    if election.winner:
        w = Candidate.find_by_id(election.winner)
        if w:
            winner_candidate = serialize_candidate(w)

    participation = Vote.get_election_participation_rate(election_id)

    return jsonify({
        'election': serialize_election(election),
        'results': results_list,
        'total_votes': total_votes,
        'winner': winner_candidate,
        'participation': participation
    }), 200


@voter_api_bp.route('/winner/<election_id>', methods=['GET'])
@token_required
def winner_page(current_user, election_id):
    """Winner announcement page data."""
    election = Election.find_by_id(election_id)
    if not election:
        return jsonify({'error': 'Election not found.'}), 404

    if not election.winner:
        return jsonify({'error': 'Winner has not been declared yet.'}), 400

    winner_candidate = Candidate.find_by_id(election.winner)
    total_votes = Vote.get_vote_count(election_id)
    winner_votes = Vote.get_vote_count(election_id, election.winner) if election.winner else 0
    winner_pct = round((winner_votes / total_votes) * 100, 1) if total_votes > 0 else 0

    return jsonify({
        'election': serialize_election(election),
        'winner': serialize_candidate(winner_candidate) if winner_candidate else None,
        'total_votes': total_votes,
        'winner_votes': winner_votes,
        'winner_percentage': winner_pct
    }), 200


@voter_api_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    """Get user profile."""
    vote_history = Vote.get_voter_history(current_user.id)
    vote_count = len(vote_history)

    return jsonify({
        'user': serialize_user(current_user),
        'vote_count': vote_count
    }), 200


@voter_api_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    """Update user profile."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required.'}), 400

    name = sanitize_input(data.get('name', ''))
    if name and len(name) >= 2:
        User.update_user(current_user.id, {'name': name})
        log_activity(current_user.name, 'Updated profile')
        return jsonify({'message': 'Profile updated successfully.'}), 200
    else:
        return jsonify({'error': 'Name must be at least 2 characters.'}), 400


@voter_api_bp.route('/change-password', methods=['PUT'])
@token_required
def change_password(current_user):
    """Change user password."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required.'}), 400

    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')
    confirm_password = data.get('confirm_new_password', '')

    if not User.verify_password(current_user.password, current_password):
        return jsonify({'error': 'Current password is incorrect.'}), 400

    if new_password != confirm_password:
        return jsonify({'error': 'New passwords do not match.'}), 400

    valid, msg = validate_password(new_password)
    if not valid:
        return jsonify({'error': msg}), 400

    User.change_password(current_user.id, new_password)
    log_activity(current_user.name, 'Changed password')
    return jsonify({'message': 'Password changed successfully.'}), 200


@voter_api_bp.route('/upload-photo', methods=['POST'])
@token_required
def upload_photo(current_user):
    """Upload profile photo."""
    if 'profile_picture' not in request.files:
        return jsonify({'error': 'No file provided.'}), 400

    file = request.files['profile_picture']
    if file and file.filename and Config.allowed_file(file.filename):
        filename = secure_filename(f"{current_user.id}_{uuid.uuid4().hex[:8]}_{file.filename}")
        upload_path = os.path.join(current_app.root_path, 'static', 'uploads')
        os.makedirs(upload_path, exist_ok=True)
        file.save(os.path.join(upload_path, filename))
        User.update_user(current_user.id, {'profile_picture': filename})
        log_activity(current_user.name, 'Updated profile picture')
        return jsonify({'message': 'Profile picture updated.', 'filename': filename}), 200
    else:
        return jsonify({'error': 'Invalid file type. Allowed: PNG, JPG, JPEG, GIF, WEBP'}), 400
