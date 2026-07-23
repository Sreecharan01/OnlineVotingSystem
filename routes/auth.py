"""Authentication routes."""

from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_user, logout_user, login_required, current_user
from models.user import User
from utils.validators import validate_email, validate_password, validate_name, sanitize_input
from utils.auth_utils import log_activity

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """User login page."""
    if current_user.is_authenticated:
        if current_user.is_admin():
            return redirect(url_for('admin.dashboard'))
        return redirect(url_for('voter.dashboard'))

    if request.method == 'POST':
        email = sanitize_input(request.form.get('email', ''))
        password = request.form.get('password', '')
        remember = request.form.get('remember', False)

        if not email or not password:
            flash('Please fill in all fields.', 'danger')
            return render_template('login.html')

        user = User.find_by_email(email)

        if user and User.verify_password(user.password, password):
            if user.disabled:
                flash('Your account has been disabled. Contact admin.', 'danger')
                return render_template('login.html')

            if not user.approved:
                flash('Your account is pending approval. Please wait for admin approval.', 'warning')
                return render_template('login.html')

            login_user(user, remember=bool(remember))
            log_activity(user.name, 'Logged in')

            next_page = request.args.get('next')
            if user.is_admin():
                return redirect(next_page or url_for('admin.dashboard'))
            return redirect(next_page or url_for('voter.dashboard'))
        else:
            flash('Invalid email or password.', 'danger')

    return render_template('login.html')


@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    """User registration page."""
    if current_user.is_authenticated:
        return redirect(url_for('voter.dashboard'))

    if request.method == 'POST':
        name = sanitize_input(request.form.get('name', ''))
        email = sanitize_input(request.form.get('email', ''))
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')

        # Validations
        valid_name, name_msg = validate_name(name)
        if not valid_name:
            flash(name_msg, 'danger')
            return render_template('register.html')

        if not validate_email(email):
            flash('Please enter a valid email address.', 'danger')
            return render_template('register.html')

        valid_pass, pass_msg = validate_password(password)
        if not valid_pass:
            flash(pass_msg, 'danger')
            return render_template('register.html')

        if password != confirm_password:
            flash('Passwords do not match.', 'danger')
            return render_template('register.html')

        user, error = User.create_user(name, email, password, role='voter')

        if error:
            flash(error, 'danger')
            return render_template('register.html')

        log_activity(name, 'Registered a new account')
        flash('Registration successful! Please wait for admin approval.', 'success')
        return redirect(url_for('auth.login'))

    return render_template('register.html')


@auth_bp.route('/logout')
@login_required
def logout():
    """User logout."""
    log_activity(current_user.name, 'Logged out')
    logout_user()
    flash('You have been logged out successfully.', 'info')
    return redirect(url_for('auth.login'))


@auth_bp.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    """Forgot password page (demo implementation)."""
    if request.method == 'POST':
        email = sanitize_input(request.form.get('email', ''))
        if not email:
            flash('Please enter your email address.', 'danger')
            return render_template('login.html', forgot_password=True)

        user = User.find_by_email(email)
        if user:
            # Demo implementation - in production, send an email
            flash('Password reset instructions have been sent to your email. (Demo: password has been reset to "Password@123")', 'info')
            User.change_password(user.id, 'Password@123')
            log_activity(user.name, 'Password reset requested')
        else:
            flash('If this email exists, a reset link has been sent.', 'info')

        return redirect(url_for('auth.login'))

    return render_template('login.html', forgot_password=True)
