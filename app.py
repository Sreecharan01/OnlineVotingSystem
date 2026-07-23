"""Online Voting System - Main Application Entry Point."""

import os
from flask import Flask, render_template, jsonify
from flask_login import LoginManager
from flask_wtf.csrf import CSRFProtect
from flask_cors import CORS
from config import Config
from database import Database
from models.user import User

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Ensure upload directories exist
os.makedirs(os.path.join(app.root_path, 'static', 'uploads'), exist_ok=True)
os.makedirs(os.path.join(app.root_path, 'static', 'images'), exist_ok=True)
os.makedirs(os.path.join(app.root_path, 'screenshots'), exist_ok=True)

# Initialize CORS for React dev server
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})

# Initialize CSRF protection
csrf = CSRFProtect(app)

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'auth.login'
login_manager.login_message = 'Please log in to access this page.'
login_manager.login_message_category = 'warning'


@login_manager.user_loader
def load_user(user_id):
    """Load user by ID for Flask-Login."""
    return User.find_by_id(user_id)


# ─── Register Original Blueprints (SSR routes) ──────────────
from routes.auth import auth_bp
from routes.admin import admin_bp
from routes.voter import voter_bp
from routes.election import election_bp

app.register_blueprint(auth_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(voter_bp)
app.register_blueprint(election_bp)

# ─── Register API Blueprints (for React frontend) ───────────
from api.auth_api import auth_api_bp
from api.voter_api import voter_api_bp
from api.admin_api import admin_api_bp

app.register_blueprint(auth_api_bp)
app.register_blueprint(voter_api_bp)
app.register_blueprint(admin_api_bp)

# Exempt API routes from CSRF protection (they use JWT instead)
csrf.exempt(auth_api_bp)
csrf.exempt(voter_api_bp)
csrf.exempt(admin_api_bp)


# ─── Landing Page ────────────────────────────────────────────

@app.route('/')
def index():
    """Landing page."""
    from models.election import Election
    from models.vote import Vote

    total_elections = Election.count_elections()
    total_votes = Vote.count_votes()
    total_users = User.count_users({'role': 'voter'})

    return render_template('index.html',
                           total_elections=total_elections,
                           total_votes=total_votes,
                           total_users=total_users)


# ─── API Landing Stats (for React) ──────────────────────────

@app.route('/api/landing-stats', methods=['GET'])
@csrf.exempt
def landing_stats():
    """Landing page stats for React frontend."""
    from models.election import Election
    from models.vote import Vote

    return jsonify({
        'total_elections': Election.count_elections(),
        'total_votes': Vote.count_votes(),
        'total_users': User.count_users({'role': 'voter'})
    })


# ─── API Election Stats (live vote count) ───────────────────

@app.route('/api/election/stats', methods=['GET'])
@csrf.exempt
def election_stats():
    """Live election stats."""
    from models.vote import Vote
    return jsonify({'total_votes': Vote.count_votes()})


# ─── Error Handlers ──────────────────────────────────────────

@app.errorhandler(404)
def page_not_found(e):
    """Handle 404 errors."""
    return render_template('404.html'), 404


@app.errorhandler(500)
def internal_error(e):
    """Handle 500 errors."""
    return render_template('500.html'), 500


# ─── Context Processors ─────────────────────────────────────

@app.context_processor
def inject_globals():
    """Inject global variables into all templates."""
    return {
        'app_name': 'ElectVote',
        'app_tagline': 'Secure Online Voting System'
    }


# ─── Initialize Database and Run ─────────────────────────────

if __name__ == '__main__':
    with app.app_context():
        Database.init_db()

        # Create default admin if none exists
        admin_count = User.count_users({'role': 'admin'})
        if admin_count == 0:
            User.create_user(
                name='Admin',
                email='admin@electvote.com',
                password='Admin@123',
                role='admin'
            )
            print('[INFO] Default admin created: admin@electvote.com / Admin@123')

    print('[INFO] Starting ElectVote - Online Voting System')
    print('[INFO] Visit http://127.0.0.1:5000')
    print('[INFO] React dev server at http://localhost:5173')
    app.run(debug=True, host='0.0.0.0', port=5000)
