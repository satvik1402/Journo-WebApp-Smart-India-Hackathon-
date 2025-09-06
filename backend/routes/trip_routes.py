from flask import Blueprint, request, jsonify
from extensions import db
from models.trip import Trip
from models.trip_point import TripPoint
from models.user import User
from datetime import datetime
import json

trip_bp = Blueprint('trips', __name__)

@trip_bp.route('/trips', methods=['GET'])
def get_trips():
    """Get all trips for a user"""
    user_id = request.args.get('user_id', type=int)
    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400
    
    # Check if user exists
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Get query parameters
    limit = request.args.get('limit', 50, type=int)
    offset = request.args.get('offset', 0, type=int)
    mode = request.args.get('mode')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Build query
    query = Trip.query.filter_by(user_id=user_id)
    
    if mode:
        query = query.filter_by(mode=mode)
    
    if start_date:
        start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        query = query.filter(Trip.start_time >= start_dt)
    
    if end_date:
        end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        query = query.filter(Trip.start_time <= end_dt)
    
    # Order by start time descending
    query = query.order_by(Trip.start_time.desc())
    
    # Apply pagination
    trips = query.offset(offset).limit(limit).all()
    
    return jsonify({
        'trips': [trip.to_dict() for trip in trips],
        'total': query.count(),
        'limit': limit,
        'offset': offset
    })

@trip_bp.route('/trips', methods=['POST'])
def create_trip():
    """Create a new trip"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['user_id', 'start_time', 'mode']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400
    
    # Check if user exists
    user = User.query.get(data['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Parse start time
    try:
        start_time = datetime.fromisoformat(data['start_time'].replace('Z', '+00:00'))
    except ValueError:
        return jsonify({'error': 'Invalid start_time format'}), 400
    
    # Parse end time if provided
    end_time = None
    if 'end_time' in data and data['end_time']:
        try:
            end_time = datetime.fromisoformat(data['end_time'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({'error': 'Invalid end_time format'}), 400
    
    # Create trip
    trip = Trip(
        user_id=data['user_id'],
        start_time=start_time,
        end_time=end_time,
        mode=data['mode'],
        start_lat=data.get('start_location', {}).get('lat'),
        start_lng=data.get('start_location', {}).get('lng'),
        end_lat=data.get('end_location', {}).get('lat'),
        end_lng=data.get('end_location', {}).get('lng'),
        start_address=data.get('start_location', {}).get('address'),
        end_address=data.get('end_location', {}).get('address'),
        distance_km=data.get('distance_km'),
        duration_minutes=data.get('duration_minutes'),
        mode_confidence=data.get('mode_confidence'),
        is_manual=data.get('is_manual', False),
        notes=data.get('notes')
    )
    
    # Calculate derived fields
    if end_time:
        trip.calculate_duration()
    if trip.distance_km:
        trip.calculate_co2_emissions()
        trip.calculate_cost()
    
    db.session.add(trip)
    db.session.commit()
    
    return jsonify({
        'message': 'Trip created successfully',
        'trip': trip.to_dict()
    }), 201

@trip_bp.route('/trips/<int:trip_id>', methods=['GET'])
def get_trip(trip_id):
    """Get a specific trip by ID"""
    trip = Trip.query.get(trip_id)
    if not trip:
        return jsonify({'error': 'Trip not found'}), 404
    
    return jsonify(trip.to_dict())

@trip_bp.route('/trips/<int:trip_id>', methods=['PUT'])
def update_trip(trip_id):
    """Update a trip"""
    trip = Trip.query.get(trip_id)
    if not trip:
        return jsonify({'error': 'Trip not found'}), 404
    
    data = request.get_json()
    
    # Update fields
    if 'start_time' in data:
        try:
            trip.start_time = datetime.fromisoformat(data['start_time'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({'error': 'Invalid start_time format'}), 400
    
    if 'end_time' in data:
        if data['end_time']:
            try:
                trip.end_time = datetime.fromisoformat(data['end_time'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({'error': 'Invalid end_time format'}), 400
        else:
            trip.end_time = None
    
    if 'mode' in data:
        trip.mode = data['mode']
    
    if 'start_location' in data:
        trip.start_lat = data['start_location'].get('lat')
        trip.start_lng = data['start_location'].get('lng')
        trip.start_address = data['start_location'].get('address')
    
    if 'end_location' in data:
        trip.end_lat = data['end_location'].get('lat')
        trip.end_lng = data['end_location'].get('lng')
        trip.end_address = data['end_location'].get('address')
    
    if 'distance_km' in data:
        trip.distance_km = data['distance_km']
    
    if 'notes' in data:
        trip.notes = data['notes']
    
    # Recalculate derived fields
    if trip.end_time:
        trip.calculate_duration()
    if trip.distance_km:
        trip.calculate_co2_emissions()
        trip.calculate_cost()
    
    db.session.commit()
    
    return jsonify({
        'message': 'Trip updated successfully',
        'trip': trip.to_dict()
    })

@trip_bp.route('/trips/<int:trip_id>', methods=['DELETE'])
def delete_trip(trip_id):
    """Delete a trip"""
    trip = Trip.query.get(trip_id)
    if not trip:
        return jsonify({'error': 'Trip not found'}), 404
    
    db.session.delete(trip)
    db.session.commit()
    
    return jsonify({'message': 'Trip deleted successfully'})

@trip_bp.route('/trips/<int:trip_id>/points', methods=['POST'])
def add_trip_point(trip_id):
    """Add a GPS point to a trip"""
    trip = Trip.query.get(trip_id)
    if not trip:
        return jsonify({'error': 'Trip not found'}), 404
    
    data = request.get_json()
    
    # Validate required fields
    if 'latitude' not in data or 'longitude' not in data:
        return jsonify({'error': 'latitude and longitude are required'}), 400
    
    # Create trip point
    trip_point = TripPoint(
        trip_id=trip_id,
        latitude=data['latitude'],
        longitude=data['longitude'],
        altitude=data.get('altitude'),
        accuracy=data.get('accuracy'),
        speed=data.get('speed'),
        heading=data.get('heading'),
        timestamp=datetime.fromisoformat(data['timestamp'].replace('Z', '+00:00')) if data.get('timestamp') else None
    )
    
    db.session.add(trip_point)
    db.session.commit()
    
    return jsonify({
        'message': 'Trip point added successfully',
        'trip_point': trip_point.to_dict()
    }), 201

@trip_bp.route('/trips/<int:trip_id>/points', methods=['GET'])
def get_trip_points(trip_id):
    """Get all GPS points for a trip"""
    trip = Trip.query.get(trip_id)
    if not trip:
        return jsonify({'error': 'Trip not found'}), 404
    
    points = TripPoint.query.filter_by(trip_id=trip_id).order_by(TripPoint.timestamp).all()
    
    return jsonify({
        'trip_id': trip_id,
        'points': [point.to_dict() for point in points]
    })
