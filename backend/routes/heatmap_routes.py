from flask import Blueprint, jsonify, request
from extensions import db
from models.trip import Trip
from models.trip_point import TripPoint
from sqlalchemy import text

heatmap_bp = Blueprint('heatmap', __name__)

@heatmap_bp.route('/heatmap-data', methods=['GET'])
def get_heatmap_data():
    user_id = request.args.get('user_id')
    heatmap_type = request.args.get('type', 'density')

    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400

    # Base query to select trips for the given user
    base_query = db.session.query(TripPoint.latitude, TripPoint.longitude, Trip.co2_kg, Trip.mode).\
        join(Trip, Trip.id == TripPoint.trip_id).\
        filter(Trip.user_id == user_id)

    if heatmap_type == 'density':
        points = base_query.all()
        # For density, intensity is uniform
        heatmap_data = [[float(p.latitude), float(p.longitude), 0.5] for p in points]


    elif heatmap_type == 'co2':
        points = base_query.filter(Trip.co2_kg.isnot(None)).all()
        # Normalize CO2 values for better visualization (e.g., 0 to 1)
        max_co2 = max([p.co2_kg for p in points if p.co2_kg is not None], default=1)
        heatmap_data = [[float(p.latitude), float(p.longitude), float(p.co2_kg / max_co2 if max_co2 > 0 and p.co2_kg is not None else 0)] for p in points]

    else:
        return jsonify({'error': 'Invalid heatmap type'}), 400

    return jsonify(heatmap_data)
