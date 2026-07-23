"""Admin API routes."""

import os
import csv
import io
import uuid
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, Response, current_app
from werkzeug.utils import secure_filename
from models.user import User
from models.election import Election
from models.candidate import Candidate
from models.vote import Vote
from api.auth_api import token_required, admin_required, serialize_user
from api.voter_api import serialize_election, serialize_candidate
from utils.auth_utils import log_activity, get_recent_activities
from utils.validators import sanitize_input
from config import Config

admin_api_bp = Blueprint('admin_api', __name__, url_prefix='/api/admin')


@admin_api_bp.route('/dashboard', methods=['GET'])
@token_required
@admin_required
def dashboard(current_user):
    """Admin dashboard data."""
    total_users = User.count_users()
    total_elections = Election.count_elections()
    active_elections_count = Election.count_elections({'status': 'active'})
    total_candidates = Candidate.count_candidates()
    total_votes = Vote.count_votes()
    pending_approvals = User.count_users({'approved': False, 'disabled': False})
    total_voters = User.count_users({'role': 'voter'})

    recent_activities = get_recent_activities(10)
    activity_list = []
    for log in recent_activities:
        activity_list.append({
            'user': log.get('user', ''),
            'action': log.get('action', ''),
            'time': log.get('time').isoformat() if log.get('time') else None
        })

    # Get active election vote counts for live tracking
    active_election_list = Election.get_active_elections()
    live_data = []
    for elec in active_election_list:
        votes = Vote.get_vote_count(elec.id)
        live_data.append({
            'election': serialize_election(elec),
            'votes': votes
        })

    return jsonify({
        'total_users': total_users,
        'total_elections': total_elections,
        'active_elections': active_elections_count,
        'total_candidates': total_candidates,
        'total_votes': total_votes,
        'pending_approvals': pending_approvals,
        'total_voters': total_voters,
        'recent_activities': activity_list,
        'live_data': live_data
    }), 200


# ─── User Management ────────────────────────────────────────

@admin_api_bp.route('/users', methods=['GET'])
@token_required
@admin_required
def manage_users(current_user):
    """Get all users."""
    search = sanitize_input(request.args.get('search', ''))
    role_filter = request.args.get('role', 'all')
    page = request.args.get('page', 1, type=int)

    users, total = User.get_all_users(search=search, role_filter=role_filter, page=page, per_page=10)
    total_pages = (total + 9) // 10

    return jsonify({
        'users': [serialize_user(u) for u in users],
        'total': total,
        'page': page,
        'total_pages': total_pages,
        'search': search,
        'role_filter': role_filter
    }), 200


@admin_api_bp.route('/users/<user_id>/approve', methods=['PUT'])
@token_required
@admin_required
def approve_user(current_user, user_id):
    """Approve a user."""
    user = User.find_by_id(user_id)
    if user:
        User.approve_user(user_id)
        log_activity(current_user.name, f'Approved user: {user.name}')
        return jsonify({'message': f'User {user.name} has been approved.'}), 200
    return jsonify({'error': 'User not found.'}), 404


@admin_api_bp.route('/users/<user_id>/disable', methods=['PUT'])
@token_required
@admin_required
def disable_user(current_user, user_id):
    """Disable a user."""
    if user_id == current_user.id:
        return jsonify({'error': 'You cannot disable your own account.'}), 400

    user = User.find_by_id(user_id)
    if user:
        User.disable_user(user_id)
        log_activity(current_user.name, f'Disabled user: {user.name}')
        return jsonify({'message': f'User {user.name} has been disabled.'}), 200
    return jsonify({'error': 'User not found.'}), 404


@admin_api_bp.route('/users/<user_id>/enable', methods=['PUT'])
@token_required
@admin_required
def enable_user(current_user, user_id):
    """Enable a user."""
    user = User.find_by_id(user_id)
    if user:
        User.enable_user(user_id)
        log_activity(current_user.name, f'Enabled user: {user.name}')
        return jsonify({'message': f'User {user.name} has been enabled.'}), 200
    return jsonify({'error': 'User not found.'}), 404


@admin_api_bp.route('/users/<user_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_user(current_user, user_id):
    """Delete a user."""
    if user_id == current_user.id:
        return jsonify({'error': 'You cannot delete your own account.'}), 400

    user = User.find_by_id(user_id)
    if user:
        User.delete_user(user_id)
        log_activity(current_user.name, f'Deleted user: {user.name}')
        return jsonify({'message': f'User {user.name} has been deleted.'}), 200
    return jsonify({'error': 'User not found.'}), 404


# ─── Election Management ────────────────────────────────────

@admin_api_bp.route('/elections', methods=['GET'])
@token_required
@admin_required
def get_elections(current_user):
    """Get all elections."""
    search = sanitize_input(request.args.get('search', ''))
    status_filter = request.args.get('status', 'all')
    page = request.args.get('page', 1, type=int)

    elections, total = Election.get_all(search=search, status_filter=status_filter, page=page, per_page=10)
    total_pages = (total + 9) // 10

    return jsonify({
        'elections': [serialize_election(e) for e in elections],
        'total': total,
        'page': page,
        'total_pages': total_pages,
        'search': search,
        'status_filter': status_filter
    }), 200


@admin_api_bp.route('/elections', methods=['POST'])
@token_required
@admin_required
def create_election(current_user):
    """Create a new election."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required.'}), 400

    title = sanitize_input(data.get('title', ''))
    description = sanitize_input(data.get('description', ''))
    start_date_str = data.get('start_date', '')
    end_date_str = data.get('end_date', '')

    if not title or not description:
        return jsonify({'error': 'Title and description are required.'}), 400

    try:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%dT%H:%M')
        end_date = datetime.strptime(end_date_str, '%Y-%m-%dT%H:%M')
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid date format.'}), 400

    if end_date <= start_date:
        return jsonify({'error': 'End date must be after start date.'}), 400

    election = Election.create_election(title, description, start_date, end_date, current_user.id)
    log_activity(current_user.name, f'Created election: {title}')
    return jsonify({'message': f'Election "{title}" created successfully.', 'election': serialize_election(election)}), 201


@admin_api_bp.route('/elections/<election_id>', methods=['PUT'])
@token_required
@admin_required
def update_election(current_user, election_id):
    """Update an election."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required.'}), 400

    update_data = {}
    if data.get('title'):
        update_data['title'] = sanitize_input(data['title'])
    if data.get('description'):
        update_data['description'] = sanitize_input(data['description'])
    if data.get('start_date'):
        try:
            update_data['start_date'] = datetime.strptime(data['start_date'], '%Y-%m-%dT%H:%M')
        except ValueError:
            pass
    if data.get('end_date'):
        try:
            update_data['end_date'] = datetime.strptime(data['end_date'], '%Y-%m-%dT%H:%M')
        except ValueError:
            pass

    if update_data:
        Election.update_election(election_id, update_data)
        log_activity(current_user.name, f'Updated election')
        return jsonify({'message': 'Election updated successfully.'}), 200

    return jsonify({'error': 'No data to update.'}), 400


@admin_api_bp.route('/elections/<election_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_election(current_user, election_id):
    """Delete an election."""
    election = Election.find_by_id(election_id)
    if election:
        Election.delete_election(election_id)
        log_activity(current_user.name, f'Deleted election: {election.title}')
        return jsonify({'message': f'Election "{election.title}" has been deleted.'}), 200
    return jsonify({'error': 'Election not found.'}), 404


@admin_api_bp.route('/elections/<election_id>/start', methods=['PUT'])
@token_required
@admin_required
def start_election(current_user, election_id):
    """Start an election."""
    election = Election.find_by_id(election_id)
    if election:
        Election.start_election(election_id)
        log_activity(current_user.name, f'Started election: {election.title}')
        return jsonify({'message': f'Election "{election.title}" has been started.'}), 200
    return jsonify({'error': 'Election not found.'}), 404


@admin_api_bp.route('/elections/<election_id>/stop', methods=['PUT'])
@token_required
@admin_required
def stop_election(current_user, election_id):
    """Stop an election."""
    election = Election.find_by_id(election_id)
    if election:
        Election.stop_election(election_id)
        log_activity(current_user.name, f'Stopped election: {election.title}')
        return jsonify({'message': f'Election "{election.title}" has been ended.'}), 200
    return jsonify({'error': 'Election not found.'}), 404


@admin_api_bp.route('/elections/<election_id>/declare-winner', methods=['POST'])
@token_required
@admin_required
def declare_winner(current_user, election_id):
    """Declare the winner of an election."""
    election = Election.find_by_id(election_id)
    if not election:
        return jsonify({'error': 'Election not found.'}), 404

    results = Vote.get_results(election_id)
    if results:
        winner_id = results[0]['_id']
        Election.declare_winner(election_id, winner_id)
        winner = Candidate.find_by_id(winner_id)
        log_activity(current_user.name, f'Declared winner for {election.title}: {winner.name if winner else "Unknown"}')
        return jsonify({'message': f'Winner declared for "{election.title}".'}), 200
    else:
        return jsonify({'error': 'No votes found for this election.'}), 400


# ─── Candidate Management ───────────────────────────────────

@admin_api_bp.route('/candidates', methods=['GET'])
@token_required
@admin_required
def get_candidates(current_user):
    """Get all candidates."""
    search = sanitize_input(request.args.get('search', ''))
    page = request.args.get('page', 1, type=int)

    candidates, total = Candidate.get_all(search=search, page=page, per_page=10)
    total_pages = (total + 9) // 10

    # Get all elections for the dropdown
    all_elections, _ = Election.get_all(page=1, per_page=100)
    election_map = {}
    for e in all_elections:
        election_map[e.id] = e.title

    return jsonify({
        'candidates': [serialize_candidate(c) for c in candidates],
        'elections': [serialize_election(e) for e in all_elections],
        'election_map': election_map,
        'total': total,
        'page': page,
        'total_pages': total_pages,
        'search': search
    }), 200


@admin_api_bp.route('/candidates', methods=['POST'])
@token_required
@admin_required
def create_candidate(current_user):
    """Create a new candidate."""
    election_id = request.form.get('election_id')
    name = sanitize_input(request.form.get('name', ''))
    party = sanitize_input(request.form.get('party', ''))
    symbol = sanitize_input(request.form.get('symbol', ''))
    description = sanitize_input(request.form.get('description', ''))

    if not name or not election_id:
        return jsonify({'error': 'Candidate name and election are required.'}), 400

    photo_filename = ''
    if 'photo' in request.files:
        file = request.files['photo']
        if file and file.filename and Config.allowed_file(file.filename):
            filename = secure_filename(f"cand_{uuid.uuid4().hex[:8]}_{file.filename}")
            upload_path = os.path.join(current_app.root_path, 'static', 'uploads')
            os.makedirs(upload_path, exist_ok=True)
            file.save(os.path.join(upload_path, filename))
            photo_filename = filename

    candidate = Candidate.create_candidate(election_id, name, party, symbol, photo_filename, description)
    log_activity(current_user.name, f'Added candidate: {name}')
    return jsonify({'message': f'Candidate "{name}" added successfully.', 'candidate': serialize_candidate(candidate)}), 201


@admin_api_bp.route('/candidates/<candidate_id>', methods=['PUT'])
@token_required
@admin_required
def update_candidate(current_user, candidate_id):
    """Update a candidate."""
    name = sanitize_input(request.form.get('name', ''))
    party = sanitize_input(request.form.get('party', ''))
    symbol = sanitize_input(request.form.get('symbol', ''))
    description = sanitize_input(request.form.get('description', ''))

    update_data = {}
    if name:
        update_data['name'] = name
    if party:
        update_data['party'] = party
    update_data['symbol'] = symbol
    update_data['description'] = description

    if 'photo' in request.files:
        file = request.files['photo']
        if file and file.filename and Config.allowed_file(file.filename):
            filename = secure_filename(f"cand_{uuid.uuid4().hex[:8]}_{file.filename}")
            upload_path = os.path.join(current_app.root_path, 'static', 'uploads')
            os.makedirs(upload_path, exist_ok=True)
            file.save(os.path.join(upload_path, filename))
            update_data['photo'] = filename

    Candidate.update_candidate(candidate_id, update_data)
    log_activity(current_user.name, f'Updated candidate: {name}')
    return jsonify({'message': 'Candidate updated successfully.'}), 200


@admin_api_bp.route('/candidates/<candidate_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_candidate(current_user, candidate_id):
    """Delete a candidate."""
    candidate = Candidate.find_by_id(candidate_id)
    if candidate:
        Candidate.delete_candidate(candidate_id)
        log_activity(current_user.name, f'Deleted candidate: {candidate.name}')
        return jsonify({'message': f'Candidate "{candidate.name}" deleted.'}), 200
    return jsonify({'error': 'Candidate not found.'}), 404


# ─── Analytics ───────────────────────────────────────────────

@admin_api_bp.route('/analytics', methods=['GET'])
@token_required
@admin_required
def analytics(current_user):
    """Analytics data."""
    all_elections, _ = Election.get_all(page=1, per_page=100)

    analytics_data = []
    for election in all_elections:
        results = Vote.get_results(election.id)
        total_votes = Vote.get_vote_count(election.id)
        participation = Vote.get_election_participation_rate(election.id)

        candidate_data = []
        for r in results:
            cand = Candidate.find_by_id(r['_id'])
            if cand:
                candidate_data.append({
                    'name': cand.name,
                    'party': cand.party,
                    'votes': r['count'],
                    'percentage': round((r['count'] / total_votes) * 100, 1) if total_votes > 0 else 0
                })

        analytics_data.append({
            'election': {
                'id': election.id,
                'title': election.title,
                'status': election.status
            },
            'total_votes': total_votes,
            'participation': participation,
            'candidates': candidate_data
        })

    total_users = User.count_users()
    total_voters = User.count_users({'role': 'voter'})
    total_votes = Vote.count_votes()
    total_elections = Election.count_elections()

    return jsonify({
        'analytics_data': analytics_data,
        'total_users': total_users,
        'total_voters': total_voters,
        'total_votes': total_votes,
        'total_elections': total_elections
    }), 200


# ─── CSV Export ──────────────────────────────────────────────

@admin_api_bp.route('/export/users', methods=['GET'])
@token_required
@admin_required
def export_users_csv(current_user):
    """Export users as CSV."""
    users, _ = User.get_all_users(page=1, per_page=10000)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Name', 'Email', 'Role', 'Approved', 'Created At'])

    for user in users:
        writer.writerow([user.name, user.email, user.role, user.approved, user.created_at])

    log_activity(current_user.name, 'Exported users CSV')

    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=users_report.csv'}
    )


@admin_api_bp.route('/export/votes/<election_id>', methods=['GET'])
@token_required
@admin_required
def export_votes_csv(current_user, election_id):
    """Export votes for an election as CSV."""
    election = Election.find_by_id(election_id)
    if not election:
        return jsonify({'error': 'Election not found.'}), 404

    results = Vote.get_results(election_id)
    total_votes = Vote.get_vote_count(election_id)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Candidate', 'Party', 'Votes', 'Percentage'])

    for r in results:
        cand = Candidate.find_by_id(r['_id'])
        if cand:
            pct = round((r['count'] / total_votes) * 100, 1) if total_votes > 0 else 0
            writer.writerow([cand.name, cand.party, r['count'], f'{pct}%'])

    log_activity(current_user.name, f'Exported votes CSV for {election.title}')

    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': f'attachment; filename=votes_{election.title}.csv'}
    )


# ─── Settings ────────────────────────────────────────────────

@admin_api_bp.route('/settings', methods=['PUT'])
@token_required
@admin_required
def update_settings(current_user):
    """Update admin settings."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required.'}), 400

    action = data.get('action')

    if action == 'update_profile':
        name = sanitize_input(data.get('name', ''))
        if name and len(name) >= 2:
            User.update_user(current_user.id, {'name': name})
            log_activity(current_user.name, 'Updated admin profile')
            return jsonify({'message': 'Profile updated successfully.'}), 200
        return jsonify({'error': 'Name must be at least 2 characters.'}), 400

    elif action == 'change_password':
        current_password = data.get('current_password', '')
        new_password = data.get('new_password', '')
        confirm_password = data.get('confirm_new_password', '')

        if not User.verify_password(current_user.password, current_password):
            return jsonify({'error': 'Current password is incorrect.'}), 400
        if new_password != confirm_password:
            return jsonify({'error': 'New passwords do not match.'}), 400
        if len(new_password) < 8:
            return jsonify({'error': 'Password must be at least 8 characters.'}), 400

        User.change_password(current_user.id, new_password)
        log_activity(current_user.name, 'Changed admin password')
        return jsonify({'message': 'Password changed successfully.'}), 200

    return jsonify({'error': 'Invalid action.'}), 400


@admin_api_bp.route('/create-admin', methods=['POST'])
@token_required
@admin_required
def create_admin(current_user):
    """Create a new admin user."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required.'}), 400

    name = sanitize_input(data.get('name', ''))
    email = sanitize_input(data.get('email', ''))
    password = data.get('password', '')

    if name and email and password:
        user, error = User.create_user(name, email, password, role='admin')
        if error:
            return jsonify({'error': error}), 400
        log_activity(current_user.name, f'Created admin: {name}')
        return jsonify({'message': f'Admin "{name}" created successfully.'}), 201
    return jsonify({'error': 'All fields are required.'}), 400
