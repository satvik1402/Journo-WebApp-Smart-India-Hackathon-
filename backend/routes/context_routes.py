from flask import Blueprint, jsonify, request
from extensions import db
from models.trip import Trip

context_bp = Blueprint('context', __name__)

@context_bp.route('/context/last-location', methods=['GET'])
def get_last_location():
    """Get the last known location for a given user."""
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400

    try:
        last_trip = Trip.query.filter_by(user_id=user_id).order_by(Trip.end_time.desc()).first()

        if last_trip and last_trip.end_lat is not None and last_trip.end_lng is not None:
            return jsonify({
                'lat': float(last_trip.end_lat),
                'lng': float(last_trip.end_lng)
            })
        
        # Fallback for users with no trips or incomplete location data
        return jsonify({'lat': 19.0760, 'lng': 72.8777, 'default': True})

    except Exception as e:
        print(f"Error fetching last location: {e}")
        return jsonify({'error': 'An internal error occurred.'}), 500
