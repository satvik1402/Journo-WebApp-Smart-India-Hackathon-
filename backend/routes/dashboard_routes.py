from flask import Blueprint, jsonify
from models.user import User
from models.trip import Trip
from models.trip_point import TripPoint
from extensions import db
from sqlalchemy import func

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard-summary', methods=['GET'])
def get_dashboard_summary():
    total_users = User.query.count()
    total_trips = Trip.query.count()
    total_data_points = db.session.query(func.count(TripPoint.id)).scalar()
    
    # Placeholder for analysis hours
    analysis_hours = 12 # Replace with actual calculation if available
    
    return jsonify({
        'total_users': total_users,
        'total_trip_logs': total_trips,
        'total_data_points': total_data_points,
        'analysis_hours': analysis_hours
    })
