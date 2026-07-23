"""Voter routes."""

import os
import uuid
from flask import Blueprint, render_template, redirect, url_for, flash, request, current_app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from models.user import User
from models.election import Election
from models.candidate import Candidate
from models.vote import Vote
from utils.decorators import voter_required, approved_required
from utils.auth_utils import log_activity
from utils.validators import validate_password, sanitize_input
from config import Config

voter_bp = Blueprint('voter', __name__)


@voter_bp.route('/dashboard')
@login_required
@approved_required
@voter_required
def dashboard():
    """Voter dashboard."""
    active_elections = Election.get_active_elections()
    upcoming_elections = Election.get_upcoming_elections()
    vote_history = Vote.get_voter_history(current_user.id)

    # Get election details for vote history
    vote_details = []
    for vote in vote_history:
        election = Election.find_by_id(vote.get('election_id'))
        candidate = Candidate.find_by_id(vote.get('candidate_id'))
        vote_details.append({
            'election': election,
            'candidate': candidate,
            'timestamp': vote.get('timestamp')
        })

    return render_template('dashboard.html',
                           active_elections=active_elections,
                           upcoming_elections=upcoming_elections,
                           vote_history=vote_details)


@voter_bp.route('/elections')
@login_required
@approved_required
@voter_required
def elections():
    """View all elections."""
    search = sanitize_input(request.args.get('search', ''))
    status_filter = request.args.get('status', 'all')
    page = request.args.get('page', 1, type=int)

    election_list, total = Election.get_all(search=search, status_filter=status_filter, page=page, per_page=9)

    # Check which elections user has voted in
    voted_elections = set()
    for election in election_list:
        if Vote.has_voted(current_user.id, election.id):
            voted_elections.add(election.id)

    total_pages = (total + 8) // 9

    return render_template('elections.html',
                           elections=election_list,
                           voted_elections=voted_elections,
                           search=search,
                           status_filter=status_filter,
                           page=page,
                           total_pages=total_pages)


@voter_bp.route('/election/<election_id>')
@login_required
@approved_required
@voter_required
def election_details(election_id):
    """View election details."""
    election = Election.find_by_id(election_id)
    if not election:
        flash('Election not found.', 'danger')
        return redirect(url_for('voter.elections'))

    candidates = Candidate.get_by_election(election_id)
    has_voted = Vote.has_voted(current_user.id, election_id)
    total_votes = Vote.get_vote_count(election_id)

    # Get vote counts per candidate
    candidate_votes = {}
    for cand in candidates:
        candidate_votes[cand.id] = Vote.get_vote_count(election_id, cand.id)

    return render_template('election_details.html',
                           election=election,
                           candidates=candidates,
                           has_voted=has_voted,
                           total_votes=total_votes,
                           candidate_votes=candidate_votes)


@voter_bp.route('/vote/<election_id>', methods=['GET', 'POST'])
@login_required
@approved_required
@voter_required
def vote(election_id):
    """Cast a vote."""
    election = Election.find_by_id(election_id)
    if not election:
        flash('Election not found.', 'danger')
        return redirect(url_for('voter.elections'))

    if not election.is_active():
        flash('This election is not currently active.', 'warning')
        return redirect(url_for('voter.election_details', election_id=election_id))

    if Vote.has_voted(current_user.id, election_id):
        flash('You have already voted in this election.', 'warning')
        return redirect(url_for('voter.election_details', election_id=election_id))

    candidates = Candidate.get_by_election(election_id)

    if request.method == 'POST':
        candidate_id = request.form.get('candidate_id')
        if not candidate_id:
            flash('Please select a candidate.', 'danger')
            return render_template('vote.html', election=election, candidates=candidates)

        # Verify candidate exists and belongs to this election
        candidate = Candidate.find_by_id(candidate_id)
        if not candidate or candidate.election_id != election_id:
            flash('Invalid candidate selection.', 'danger')
            return render_template('vote.html', election=election, candidates=candidates)

        vote_obj, error = Vote.cast_vote(current_user.id, candidate_id, election_id)
        if error:
            flash(error, 'danger')
            return render_template('vote.html', election=election, candidates=candidates)

        log_activity(current_user.name, f'Voted in election: {election.title}')
        flash('Your vote has been submitted successfully!', 'success')
        return redirect(url_for('voter.vote_receipt', election_id=election_id))

    return render_template('vote.html', election=election, candidates=candidates)


@voter_bp.route('/vote-receipt/<election_id>')
@login_required
@approved_required
@voter_required
def vote_receipt(election_id):
    """Vote receipt page."""
    election = Election.find_by_id(election_id)
    if not election:
        flash('Election not found.', 'danger')
        return redirect(url_for('voter.elections'))

    if not Vote.has_voted(current_user.id, election_id):
        flash('No vote record found.', 'warning')
        return redirect(url_for('voter.elections'))

    votes_collection = Vote.get_voter_history(current_user.id)
    vote_record = None
    for v in votes_collection:
        if v.get('election_id') == election_id:
            vote_record = v
            break

    candidate = None
    if vote_record:
        candidate = Candidate.find_by_id(vote_record.get('candidate_id'))

    return render_template('vote.html',
                           election=election,
                           receipt=True,
                           vote_record=vote_record,
                           candidate=candidate)


@voter_bp.route('/results/<election_id>')
@login_required
@approved_required
def results(election_id):
    """View election results."""
    election = Election.find_by_id(election_id)
    if not election:
        flash('Election not found.', 'danger')
        return redirect(url_for('voter.elections'))

    candidates = Candidate.get_by_election(election_id)
    total_votes = Vote.get_vote_count(election_id)
    results_data = Vote.get_results(election_id)

    # Build results with candidate details
    results_list = []
    for r in results_data:
        cand = Candidate.find_by_id(r['_id'])
        if cand:
            pct = round((r['count'] / total_votes) * 100, 1) if total_votes > 0 else 0
            results_list.append({
                'candidate': {
                    'name': cand.name,
                    'photo': cand.photo,
                    'party': cand.party,
                    'id': cand.id
                },
                'votes': r['count'],
                'percentage': pct
            })

    # Determine winner
    winner_candidate = None
    if election.winner:
        winner_candidate = Candidate.find_by_id(election.winner)

    participation = Vote.get_election_participation_rate(election_id)

    return render_template('results.html',
                           election=election,
                           results=results_list,
                           total_votes=total_votes,
                           winner=winner_candidate,
                           participation=participation)


@voter_bp.route('/winner/<election_id>')
@login_required
@approved_required
def winner_page(election_id):
    """Winner announcement page."""
    election = Election.find_by_id(election_id)
    if not election:
        flash('Election not found.', 'danger')
        return redirect(url_for('voter.elections'))

    if not election.winner:
        flash('Winner has not been declared yet.', 'info')
        return redirect(url_for('voter.results', election_id=election_id))

    winner_candidate = Candidate.find_by_id(election.winner)
    total_votes = Vote.get_vote_count(election_id)
    winner_votes = Vote.get_vote_count(election_id, election.winner) if election.winner else 0
    winner_pct = round((winner_votes / total_votes) * 100, 1) if total_votes > 0 else 0

    return render_template('winner.html',
                           election=election,
                           winner=winner_candidate,
                           total_votes=total_votes,
                           winner_votes=winner_votes,
                           winner_percentage=winner_pct)


@voter_bp.route('/profile', methods=['GET', 'POST'])
@login_required
@approved_required
def profile():
    """User profile page."""
    if request.method == 'POST':
        action = request.form.get('action')

        if action == 'update_profile':
            name = sanitize_input(request.form.get('name', ''))
            if name and len(name) >= 2:
                User.update_user(current_user.id, {'name': name})
                log_activity(current_user.name, 'Updated profile')
                flash('Profile updated successfully.', 'success')
            else:
                flash('Name must be at least 2 characters.', 'danger')

        elif action == 'change_password':
            current_password = request.form.get('current_password', '')
            new_password = request.form.get('new_password', '')
            confirm_password = request.form.get('confirm_new_password', '')

            if not User.verify_password(current_user.password, current_password):
                flash('Current password is incorrect.', 'danger')
            elif new_password != confirm_password:
                flash('New passwords do not match.', 'danger')
            else:
                valid, msg = validate_password(new_password)
                if not valid:
                    flash(msg, 'danger')
                else:
                    User.change_password(current_user.id, new_password)
                    log_activity(current_user.name, 'Changed password')
                    flash('Password changed successfully.', 'success')

        elif action == 'upload_photo':
            if 'profile_picture' in request.files:
                file = request.files['profile_picture']
                if file and file.filename and Config.allowed_file(file.filename):
                    filename = secure_filename(f"{current_user.id}_{uuid.uuid4().hex[:8]}_{file.filename}")
                    upload_path = os.path.join(current_app.root_path, 'static', 'uploads')
                    os.makedirs(upload_path, exist_ok=True)
                    file.save(os.path.join(upload_path, filename))
                    User.update_user(current_user.id, {'profile_picture': filename})
                    log_activity(current_user.name, 'Updated profile picture')
                    flash('Profile picture updated.', 'success')
                else:
                    flash('Invalid file type. Allowed: PNG, JPG, JPEG, GIF, WEBP', 'danger')

        return redirect(url_for('voter.profile'))

    # Get vote history
    vote_history = Vote.get_voter_history(current_user.id)
    vote_count = len(vote_history)

    return render_template('profile.html', vote_count=vote_count)
