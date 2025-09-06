from flask import Blueprint, request, jsonify
from extensions import db
from models.user import User
from datetime import datetime
import json

user_bp = Blueprint('users', __name__)

@user_bp.route('/users', methods=['GET'])
def get_users():
    """Get all users for dropdowns and admin."""
    users = User.query.all()
    return jsonify([u.to_dict() for u in users])

@user_bp.route('/users', methods=['POST'])
def create_user():
    """Create a new user"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['username', 'email', 'password']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400
    
    # Check if username or email already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    # Create user
    user = User(
        username=data['username'],
        email=data['email'],
        password=data['password'],
        first_name=data.get('first_name'),
        last_name=data.get('last_name'),
        phone=data.get('phone')
    )
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        'message': 'User created successfully',
        'user': user.to_dict()
    }), 201

@user_bp.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Get user by ID"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify(user.to_dict())

@user_bp.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """Update user information"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    # Update fields
    if 'first_name' in data:
        user.first_name = data['first_name']
    
    if 'last_name' in data:
        user.last_name = data['last_name']
    
    if 'phone' in data:
        user.phone = data['phone']
    
    if 'email' in data:
        # Check if email already exists
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user and existing_user.id != user_id:
            return jsonify({'error': 'Email already exists'}), 400
        user.email = data['email']
    
    db.session.commit()
    
    return jsonify({
        'message': 'User updated successfully',
        'user': user.to_dict()
    })

@user_bp.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete user and all associated data"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({'message': 'User deleted successfully'})

@user_bp.route('/users/login', methods=['POST'])
def login():
    """User login (simple authentication)"""
    data = request.get_json()
    
    if 'username' not in data or 'password' not in data:
        return jsonify({'error': 'Username and password are required'}), 400
    
    # Find user by username or email
    user = User.query.filter(
        (User.username == data['username']) | (User.email == data['username'])
    ).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    if not user.is_active:
        return jsonify({'error': 'Account is deactivated'}), 401
    
    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict()
    })

@user_bp.route('/users/change-password', methods=['POST'])
def change_password():
    """Change user password"""
    data = request.get_json()
    
    if 'user_id' not in data or 'current_password' not in data or 'new_password' not in data:
        return jsonify({'error': 'user_id, current_password, and new_password are required'}), 400
    
    user = User.query.get(data['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if not user.check_password(data['current_password']):
        return jsonify({'error': 'Current password is incorrect'}), 401
    
    user.set_password(data['new_password'])
    db.session.commit()
    
    return jsonify({'message': 'Password changed successfully'})

@user_bp.route('/users/<int:user_id>/stats', methods=['GET'])
def get_user_stats(user_id):
    """Get user statistics"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Get basic trip statistics
    from models.trip import Trip
    
    total_trips = Trip.query.filter_by(user_id=user_id).count()
    completed_trips = Trip.query.filter_by(user_id=user_id).filter(Trip.end_time.isnot(None)).count()
    
    # Get mode distribution
    mode_stats = db.session.query(
        Trip.mode,
        db.func.count(Trip.id).label('count')
    ).filter_by(user_id=user_id).group_by(Trip.mode).all()
    
    mode_distribution = {mode: count for mode, count in mode_stats}
    
    # Get recent activity
    recent_trips = Trip.query.filter_by(user_id=user_id).order_by(
        Trip.start_time.desc()
    ).limit(5).all()
    
    return jsonify({
        'user_id': user_id,
        'total_trips': total_trips,
        'completed_trips': completed_trips,
        'mode_distribution': mode_distribution,
        'recent_trips': [trip.to_dict() for trip in recent_trips]
    })
