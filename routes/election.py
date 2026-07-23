"""Election API routes for AJAX calls."""

from flask import Blueprint, jsonify
from flask_login import login_required
from models.election import Election
from models.candidate import Candidate
from models.vote import Vote

election_bp = Blueprint('election_api', __name__, url_prefix='/api/election')


@election_bp.route('/results/<election_id>')
@login_required
def get_results(election_id):
    """Get election results as JSON for live updates."""
    election = Election.find_by_id(election_id)
    if not election:
        return jsonify({'error': 'Election not found'}), 404

    candidates = Candidate.get_by_election(election_id)
    total_votes = Vote.get_vote_count(election_id)
    results = Vote.get_results(election_id)

    results_data = []
    for r in results:
        cand = Candidate.find_by_id(r['_id'])
        if cand:
            pct = round((r['count'] / total_votes) * 100, 1) if total_votes > 0 else 0
            results_data.append({
                'id': cand.id,
                'name': cand.name,
                'party': cand.party,
                'votes': r['count'],
                'percentage': pct
            })

    return jsonify({
        'election_id': election_id,
        'title': election.title,
        'status': election.status,
        'total_votes': total_votes,
        'results': results_data
    })


@election_bp.route('/stats')
@login_required
def get_stats():
    """Get overall election stats for dashboard live updates."""
    total_votes = Vote.count_votes()
    active_elections = Election.count_elections({'status': 'active'})

    active_list = Election.get_active_elections()
    live_counts = []
    for elec in active_list:
        live_counts.append({
            'id': elec.id,
            'title': elec.title,
            'votes': Vote.get_vote_count(elec.id)
        })

    return jsonify({
        'total_votes': total_votes,
        'active_elections': active_elections,
        'live_counts': live_counts
    })


@election_bp.route('/daily-votes/<election_id>')
@login_required
def get_daily_votes(election_id):
    """Get daily vote trends for an election."""
    daily = Vote.get_daily_votes(election_id)
    return jsonify({
        'labels': [d['_id'] for d in daily],
        'data': [d['count'] for d in daily]
    })
