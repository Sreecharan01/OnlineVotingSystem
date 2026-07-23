"""Admin routes."""

import os
import csv
import io
import uuid
from datetime import datetime, timezone
from flask import Blueprint, render_template, redirect, url_for, flash, request, Response, current_app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from models.user import User
from models.election import Election
from models.candidate import Candidate
from models.vote import Vote
from utils.decorators import admin_required
from utils.auth_utils import log_activity, get_recent_activities
from utils.validators import sanitize_input
from config import Config

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')


@admin_bp.route('/dashboard')
@login_required
@admin_required
def dashboard():
    """Admin dashboard."""
    total_users = User.count_users()
    total_elections = Election.count_elections()
    active_elections = Election.count_elections({'status': 'active'})
    total_candidates = Candidate.count_candidates()
    total_votes = Vote.count_votes()
    pending_approvals = User.count_users({'approved': False, 'disabled': False})
    total_voters = User.count_users({'role': 'voter'})

    recent_activities = get_recent_activities(10)
    recent_votes = Vote.get_recent_votes(5)

    # Get active election vote counts for live tracking
    active_election_list = Election.get_active_elections()
    live_data = []
    for elec in active_election_list:
        votes = Vote.get_vote_count(elec.id)
        live_data.append({'election': elec, 'votes': votes})

    return render_template('admin_dashboard.html',
                           total_users=total_users,
                           total_elections=total_elections,
                           active_elections=active_elections,
                           total_candidates=total_candidates,
                           total_votes=total_votes,
                           pending_approvals=pending_approvals,
                           total_voters=total_voters,
                           recent_activities=recent_activities,
                           live_data=live_data)


# ─── User Management ────────────────────────────────────────

@admin_bp.route('/users')
@login_required
@admin_required
def manage_users():
    """Manage users page."""
    search = sanitize_input(request.args.get('search', ''))
    role_filter = request.args.get('role', 'all')
    page = request.args.get('page', 1, type=int)

    users, total = User.get_all_users(search=search, role_filter=role_filter, page=page, per_page=10)
    total_pages = (total + 9) // 10

    return render_template('manage_users.html',
                           users=users,
                           search=search,
                           role_filter=role_filter,
                           page=page,
                           total_pages=total_pages,
                           total=total)


@admin_bp.route('/users/approve/<user_id>')
@login_required
@admin_required
def approve_user(user_id):
    """Approve a user."""
    user = User.find_by_id(user_id)
    if user:
        User.approve_user(user_id)
        log_activity(current_user.name, f'Approved user: {user.name}')
        flash(f'User {user.name} has been approved.', 'success')
    else:
        flash('User not found.', 'danger')
    return redirect(url_for('admin.manage_users'))


@admin_bp.route('/users/disable/<user_id>')
@login_required
@admin_required
def disable_user(user_id):
    """Disable a user."""
    if user_id == current_user.id:
        flash('You cannot disable your own account.', 'danger')
        return redirect(url_for('admin.manage_users'))

    user = User.find_by_id(user_id)
    if user:
        User.disable_user(user_id)
        log_activity(current_user.name, f'Disabled user: {user.name}')
        flash(f'User {user.name} has been disabled.', 'success')
    else:
        flash('User not found.', 'danger')
    return redirect(url_for('admin.manage_users'))


@admin_bp.route('/users/enable/<user_id>')
@login_required
@admin_required
def enable_user(user_id):
    """Enable a user."""
    user = User.find_by_id(user_id)
    if user:
        User.enable_user(user_id)
        log_activity(current_user.name, f'Enabled user: {user.name}')
        flash(f'User {user.name} has been enabled.', 'success')
    else:
        flash('User not found.', 'danger')
    return redirect(url_for('admin.manage_users'))


@admin_bp.route('/users/delete/<user_id>')
@login_required
@admin_required
def delete_user(user_id):
    """Delete a user."""
    if user_id == current_user.id:
        flash('You cannot delete your own account.', 'danger')
        return redirect(url_for('admin.manage_users'))

    user = User.find_by_id(user_id)
    if user:
        User.delete_user(user_id)
        log_activity(current_user.name, f'Deleted user: {user.name}')
        flash(f'User {user.name} has been deleted.', 'success')
    else:
        flash('User not found.', 'danger')
    return redirect(url_for('admin.manage_users'))


# ─── Election Management ────────────────────────────────────

@admin_bp.route('/elections', methods=['GET', 'POST'])
@login_required
@admin_required
def manage_elections():
    """Manage elections page."""
    if request.method == 'POST':
        action = request.form.get('action')

        if action == 'create':
            title = sanitize_input(request.form.get('title', ''))
            description = sanitize_input(request.form.get('description', ''))
            start_date_str = request.form.get('start_date', '')
            end_date_str = request.form.get('end_date', '')

            if not title or not description:
                flash('Title and description are required.', 'danger')
                return redirect(url_for('admin.manage_elections'))

            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%dT%H:%M')
                end_date = datetime.strptime(end_date_str, '%Y-%m-%dT%H:%M')
            except (ValueError, TypeError):
                flash('Invalid date format.', 'danger')
                return redirect(url_for('admin.manage_elections'))

            if end_date <= start_date:
                flash('End date must be after start date.', 'danger')
                return redirect(url_for('admin.manage_elections'))

            election = Election.create_election(title, description, start_date, end_date, current_user.id)
            log_activity(current_user.name, f'Created election: {title}')
            flash(f'Election "{title}" created successfully.', 'success')

        elif action == 'edit':
            election_id = request.form.get('election_id')
            title = sanitize_input(request.form.get('title', ''))
            description = sanitize_input(request.form.get('description', ''))
            start_date_str = request.form.get('start_date', '')
            end_date_str = request.form.get('end_date', '')

            update_data = {}
            if title:
                update_data['title'] = title
            if description:
                update_data['description'] = description
            if start_date_str:
                try:
                    update_data['start_date'] = datetime.strptime(start_date_str, '%Y-%m-%dT%H:%M')
                except ValueError:
                    pass
            if end_date_str:
                try:
                    update_data['end_date'] = datetime.strptime(end_date_str, '%Y-%m-%dT%H:%M')
                except ValueError:
                    pass

            if update_data:
                Election.update_election(election_id, update_data)
                log_activity(current_user.name, f'Updated election: {title}')
                flash('Election updated successfully.', 'success')

        return redirect(url_for('admin.manage_elections'))

    search = sanitize_input(request.args.get('search', ''))
    status_filter = request.args.get('status', 'all')
    page = request.args.get('page', 1, type=int)

    elections, total = Election.get_all(search=search, status_filter=status_filter, page=page, per_page=10)
    total_pages = (total + 9) // 10

    return render_template('manage_elections.html',
                           elections=elections,
                           search=search,
                           status_filter=status_filter,
                           page=page,
                           total_pages=total_pages,
                           total=total)


@admin_bp.route('/elections/start/<election_id>')
@login_required
@admin_required
def start_election(election_id):
    """Start an election."""
    election = Election.find_by_id(election_id)
    if election:
        Election.start_election(election_id)
        log_activity(current_user.name, f'Started election: {election.title}')
        flash(f'Election "{election.title}" has been started.', 'success')
    else:
        flash('Election not found.', 'danger')
    return redirect(url_for('admin.manage_elections'))


@admin_bp.route('/elections/stop/<election_id>')
@login_required
@admin_required
def stop_election(election_id):
    """Stop an election."""
    election = Election.find_by_id(election_id)
    if election:
        Election.stop_election(election_id)
        log_activity(current_user.name, f'Stopped election: {election.title}')
        flash(f'Election "{election.title}" has been ended.', 'success')
    else:
        flash('Election not found.', 'danger')
    return redirect(url_for('admin.manage_elections'))


@admin_bp.route('/elections/delete/<election_id>')
@login_required
@admin_required
def delete_election(election_id):
    """Delete an election."""
    election = Election.find_by_id(election_id)
    if election:
        Election.delete_election(election_id)
        log_activity(current_user.name, f'Deleted election: {election.title}')
        flash(f'Election "{election.title}" has been deleted.', 'success')
    else:
        flash('Election not found.', 'danger')
    return redirect(url_for('admin.manage_elections'))


@admin_bp.route('/elections/declare-winner/<election_id>', methods=['POST'])
@login_required
@admin_required
def declare_winner(election_id):
    """Declare the winner of an election."""
    election = Election.find_by_id(election_id)
    if not election:
        flash('Election not found.', 'danger')
        return redirect(url_for('admin.manage_elections'))

    # Auto-determine winner based on highest votes
    results = Vote.get_results(election_id)
    if results:
        winner_id = results[0]['_id']
        Election.declare_winner(election_id, winner_id)
        winner = Candidate.find_by_id(winner_id)
        log_activity(current_user.name, f'Declared winner for {election.title}: {winner.name if winner else "Unknown"}')
        flash(f'Winner declared for "{election.title}".', 'success')
    else:
        flash('No votes found for this election.', 'warning')

    return redirect(url_for('admin.manage_elections'))


# ─── Candidate Management ───────────────────────────────────

@admin_bp.route('/candidates', methods=['GET', 'POST'])
@login_required
@admin_required
def manage_candidates():
    """Manage candidates page."""
    if request.method == 'POST':
        action = request.form.get('action')

        if action == 'create':
            election_id = request.form.get('election_id')
            name = sanitize_input(request.form.get('name', ''))
            party = sanitize_input(request.form.get('party', ''))
            symbol = sanitize_input(request.form.get('symbol', ''))
            description = sanitize_input(request.form.get('description', ''))

            if not name or not election_id:
                flash('Candidate name and election are required.', 'danger')
                return redirect(url_for('admin.manage_candidates'))

            photo_filename = ''
            if 'photo' in request.files:
                file = request.files['photo']
                if file and file.filename and Config.allowed_file(file.filename):
                    filename = secure_filename(f"cand_{uuid.uuid4().hex[:8]}_{file.filename}")
                    upload_path = os.path.join(current_app.root_path, 'static', 'uploads')
                    os.makedirs(upload_path, exist_ok=True)
                    file.save(os.path.join(upload_path, filename))
                    photo_filename = filename

            Candidate.create_candidate(election_id, name, party, symbol, photo_filename, description)
            log_activity(current_user.name, f'Added candidate: {name}')
            flash(f'Candidate "{name}" added successfully.', 'success')

        elif action == 'edit':
            candidate_id = request.form.get('candidate_id')
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
            flash('Candidate updated successfully.', 'success')

        return redirect(url_for('admin.manage_candidates'))

    search = sanitize_input(request.args.get('search', ''))
    page = request.args.get('page', 1, type=int)

    candidates, total = Candidate.get_all(search=search, page=page, per_page=10)
    total_pages = (total + 9) // 10

    # Get all elections for the dropdown
    all_elections, _ = Election.get_all(page=1, per_page=100)

    # Map election titles
    election_map = {}
    for e in all_elections:
        election_map[e.id] = e.title

    return render_template('manage_candidates.html',
                           candidates=candidates,
                           elections=all_elections,
                           election_map=election_map,
                           search=search,
                           page=page,
                           total_pages=total_pages,
                           total=total)


@admin_bp.route('/candidates/delete/<candidate_id>')
@login_required
@admin_required
def delete_candidate(candidate_id):
    """Delete a candidate."""
    candidate = Candidate.find_by_id(candidate_id)
    if candidate:
        Candidate.delete_candidate(candidate_id)
        log_activity(current_user.name, f'Deleted candidate: {candidate.name}')
        flash(f'Candidate "{candidate.name}" deleted.', 'success')
    else:
        flash('Candidate not found.', 'danger')
    return redirect(url_for('admin.manage_candidates'))


# ─── Analytics ───────────────────────────────────────────────

@admin_bp.route('/analytics')
@login_required
@admin_required
def analytics():
    """Analytics page."""
    # Get all elections for charts
    all_elections, _ = Election.get_all(page=1, per_page=100)

    analytics_data = []
    for election in all_elections:
        candidates = Candidate.get_by_election(election.id)
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

    # Overall stats
    total_users = User.count_users()
    total_voters = User.count_users({'role': 'voter'})
    total_votes = Vote.count_votes()
    total_elections = Election.count_elections()

    return render_template('analytics.html',
                           analytics_data=analytics_data,
                           total_users=total_users,
                           total_voters=total_voters,
                           total_votes=total_votes,
                           total_elections=total_elections)


# ─── Reports / CSV Export ────────────────────────────────────

@admin_bp.route('/export/users')
@login_required
@admin_required
def export_users_csv():
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


@admin_bp.route('/export/votes/<election_id>')
@login_required
@admin_required
def export_votes_csv(election_id):
    """Export votes for an election as CSV."""
    election = Election.find_by_id(election_id)
    if not election:
        flash('Election not found.', 'danger')
        return redirect(url_for('admin.analytics'))

    candidates = Candidate.get_by_election(election_id)
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

@admin_bp.route('/settings', methods=['GET', 'POST'])
@login_required
@admin_required
def settings():
    """Admin settings page."""
    if request.method == 'POST':
        action = request.form.get('action')

        if action == 'update_profile':
            name = sanitize_input(request.form.get('name', ''))
            if name and len(name) >= 2:
                User.update_user(current_user.id, {'name': name})
                log_activity(current_user.name, 'Updated admin profile')
                flash('Profile updated successfully.', 'success')

        elif action == 'change_password':
            current_password = request.form.get('current_password', '')
            new_password = request.form.get('new_password', '')
            confirm_password = request.form.get('confirm_new_password', '')

            if not User.verify_password(current_user.password, current_password):
                flash('Current password is incorrect.', 'danger')
            elif new_password != confirm_password:
                flash('New passwords do not match.', 'danger')
            elif len(new_password) < 8:
                flash('Password must be at least 8 characters.', 'danger')
            else:
                User.change_password(current_user.id, new_password)
                log_activity(current_user.name, 'Changed admin password')
                flash('Password changed successfully.', 'success')

        elif action == 'create_admin':
            name = sanitize_input(request.form.get('admin_name', ''))
            email = sanitize_input(request.form.get('admin_email', ''))
            password = request.form.get('admin_password', '')

            if name and email and password:
                user, error = User.create_user(name, email, password, role='admin')
                if error:
                    flash(error, 'danger')
                else:
                    log_activity(current_user.name, f'Created admin: {name}')
                    flash(f'Admin "{name}" created successfully.', 'success')
            else:
                flash('All fields are required.', 'danger')

        return redirect(url_for('admin.settings'))

    return render_template('settings.html')
