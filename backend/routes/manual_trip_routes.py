from flask import Blueprint, jsonify, request
from extensions import db
from models.manual_trip import ManualTrip
from datetime import datetime

manual_trip_bp = Blueprint('manual_trip', __name__)

@manual_trip_bp.route('/manual-trips', methods=['GET'])
def get_manual_trips():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400
    
    trips = ManualTrip.query.filter_by(user_id=user_id).order_by(ManualTrip.start_time.desc()).all()
    return jsonify([trip.to_dict() for trip in trips])

@manual_trip_bp.route('/manual-trips', methods=['POST'])
def add_manual_trip():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid data'}), 400

    required_fields = ['user_id', 'start_time', 'mode', 'start_address', 'end_address']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        new_trip = ManualTrip(
            user_id=data['user_id'],
            start_time=datetime.fromisoformat(data['start_time']),
            end_time=datetime.fromisoformat(data['end_time']) if data.get('end_time') else None,
            mode=data['mode'],
            start_address=data['start_address'],
            end_address=data['end_address'],
            start_lat=data.get('start_lat'),
            start_lng=data.get('start_lng'),
            end_lat=data.get('end_lat'),
            end_lng=data.get('end_lng'),
            distance_km=data.get('distance_km'),
            duration_minutes=data.get('duration_minutes'),
            co2_kg=data.get('co2_kg'),
            cost_usd=data.get('cost_usd'),
            notes=data.get('notes')
        )
        db.session.add(new_trip)
        db.session.commit()
        return jsonify(new_trip.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@manual_trip_bp.route('/manual-trips/<int:trip_id>', methods=['DELETE'])
def delete_manual_trip(trip_id):
    trip = ManualTrip.query.get(trip_id)
    if not trip:
        return jsonify({'error': 'Trip not found'}), 404
    
    try:
        db.session.delete(trip)
        db.session.commit()
        return jsonify({'message': 'Trip deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
