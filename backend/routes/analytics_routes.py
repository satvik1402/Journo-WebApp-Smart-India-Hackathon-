from flask import Blueprint, request, jsonify
from extensions import db
from models.trip import Trip
from models.user import User
from sqlalchemy import func, extract, and_
from datetime import datetime, timedelta
import json
import os
import mysql.connector

analytics_bp = Blueprint('analytics', __name__)


def get_mysql_conn():
    return mysql.connector.connect(
        host=os.environ.get('MYSQL_HOST', 'localhost'),
        user=os.environ.get('MYSQL_USER', 'root'),
        password=os.environ.get('MYSQL_PASSWORD', 'satvik@12345'),
        database=os.environ.get('MYSQL_DB', 'travelapp'),
        port=int(os.environ.get('MYSQL_PORT', '3306')),
    )


@analytics_bp.route('/mysql/summary')
def mysql_summary():
    try:
        conn = get_mysql_conn()
        cur = conn.cursor()
        cur.execute('SELECT COUNT(*) FROM users')
        users = cur.fetchone()[0]
        cur.execute('SELECT COUNT(*) FROM trips')
        trips = cur.fetchone()[0]
        cur.execute('SELECT COUNT(*) FROM trip_points')
        points = cur.fetchone()[0]
        cur.close()
        conn.close()
        return jsonify({
            'users': users,
            'trips': trips,
            'trip_points': points
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/analytics/summary', methods=['GET'])
def get_analytics_summary():
    """Get analytics summary for a user"""
    user_id = request.args.get('user_id', type=int)
    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400
    
    # Check if user exists
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Get date range
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Build base query
    query = Trip.query.filter_by(user_id=user_id)
    
    if start_date:
        start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        query = query.filter(Trip.start_time >= start_dt)
    
    if end_date:
        end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        query = query.filter(Trip.start_time <= end_dt)
    
    # Get basic stats
    total_trips = query.count()
    total_distance = query.with_entities(func.sum(Trip.distance_km)).scalar() or 0
    total_duration = query.with_entities(func.sum(Trip.duration_minutes)).scalar() or 0
    total_co2 = query.with_entities(func.sum(Trip.co2_kg)).scalar() or 0
    total_cost = query.with_entities(func.sum(Trip.cost_usd)).scalar() or 0
    
    # Get mode distribution
    mode_stats = query.with_entities(
        Trip.mode,
        func.count(Trip.id).label('count'),
        func.sum(Trip.distance_km).label('total_distance'),
        func.avg(Trip.duration_minutes).label('avg_duration')
    ).group_by(Trip.mode).all()
    
    mode_distribution = []
    for mode, count, distance, avg_duration in mode_stats:
        mode_distribution.append({
            'mode': mode,
            'count': count,
            'total_distance': float(distance or 0),
            'avg_duration': float(avg_duration or 0)
        })
    
    # Get daily travel time ranges for the last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    daily_travel_times = query.filter(
        Trip.start_time >= thirty_days_ago,
        Trip.end_time.isnot(None)
    ).with_entities(
        func.date(Trip.start_time).label('date'),
        func.min(extract('hour', Trip.start_time)).label('min_start_hour'),
        func.max(extract('hour', Trip.end_time)).label('max_end_hour')
    ).group_by(func.date(Trip.start_time)).order_by(func.date(Trip.start_time)).all()

    daily_data = []
    for date, min_hour, max_hour in daily_travel_times:
        # Ensure max_hour is greater than min_hour for a valid range
        if max_hour is not None and min_hour is not None and max_hour > min_hour:
            daily_data.append({
                'date': str(date),
                'time_range': [min_hour, max_hour]
            })
    
    return jsonify({
        'summary': {
            'total_trips': total_trips,
            'total_distance_km': float(total_distance),
            'total_duration_minutes': total_duration,
            'total_co2_kg': float(total_co2),
            'total_cost_usd': float(total_cost)
        },
        'mode_distribution': mode_distribution,
        'daily_trips': daily_data
    })

@analytics_bp.route('/analytics/heatmap', methods=['GET'])
def get_heatmap_data():
    """Get heatmap data for visualization"""
    user_id = request.args.get('user_id', type=int)
    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400
    
    # Get all trip start and end points
    trips = Trip.query.filter_by(user_id=user_id).filter(
        and_(Trip.start_lat.isnot(None), Trip.start_lng.isnot(None))
    ).all()
    
    heatmap_data = []
    
    for trip in trips:
        # Add start point
        if trip.start_lat and trip.start_lng:
            heatmap_data.append({
                'lat': float(trip.start_lat),
                'lng': float(trip.start_lng),
                'type': 'start',
                'mode': trip.mode,
                'timestamp': trip.start_time.isoformat()
            })
        
        # Add end point
        if trip.end_lat and trip.end_lng:
            heatmap_data.append({
                'lat': float(trip.end_lat),
                'lng': float(trip.end_lng),
                'type': 'end',
                'mode': trip.mode,
                'timestamp': trip.end_time.isoformat() if trip.end_time else trip.start_time.isoformat()
            })
    
    return jsonify({
        'heatmap_data': heatmap_data,
        'total_points': len(heatmap_data)
    })

@analytics_bp.route('/analytics/predictions', methods=['GET'])
def get_predictions():
    """Get ML predictions for travel patterns"""
    user_id = request.args.get('user_id', type=int)
    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400
    
    # Get recent trips for pattern analysis
    recent_trips = Trip.query.filter_by(user_id=user_id).order_by(
        Trip.start_time.desc()
    ).limit(100).all()
    
    if not recent_trips:
        return jsonify({'error': 'Insufficient data for predictions'}), 400
    
    # Simple prediction logic (can be enhanced with ML)
    predictions = {
        'peak_hours': [],
        'likely_destinations': [],
        'mode_recommendations': []
    }
    
    # Analyze peak hours
    hour_counts = {}
    for trip in recent_trips:
        hour = trip.start_time.hour
        hour_counts[hour] = hour_counts.get(hour, 0) + 1
    
    # Get top 3 peak hours
    peak_hours = sorted(hour_counts.items(), key=lambda x: x[1], reverse=True)[:3]
    predictions['peak_hours'] = [{'hour': hour, 'frequency': count} for hour, count in peak_hours]
    
    # Analyze destinations
    destination_counts = {}
    for trip in recent_trips:
        if trip.end_address:
            dest = trip.end_address
            destination_counts[dest] = destination_counts.get(dest, 0) + 1
    
    # Get top 5 destinations
    top_destinations = sorted(destination_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    predictions['likely_destinations'] = [
        {'address': dest, 'frequency': count} for dest, count in top_destinations
    ]
    
    # Analyze mode usage
    mode_counts = {}
    for trip in recent_trips:
        mode = trip.mode
        mode_counts[mode] = mode_counts.get(mode, 0) + 1
    
    # Get mode recommendations
    total_trips = len(recent_trips)
    mode_recommendations = []
    for mode, count in mode_counts.items():
        percentage = (count / total_trips) * 100
        mode_recommendations.append({
            'mode': mode,
            'usage_percentage': round(percentage, 1),
            'recommendation': 'High usage' if percentage > 30 else 'Moderate usage' if percentage > 10 else 'Low usage'
        })
    
    predictions['mode_recommendations'] = sorted(
        mode_recommendations, 
        key=lambda x: x['usage_percentage'], 
        reverse=True
    )
    
    return jsonify(predictions)

@analytics_bp.route('/analytics/reports', methods=['GET'])
def get_reports():
    """Get detailed reports including CO2 and cost analysis"""
    user_id = request.args.get('user_id', type=int)
    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400
    
    # Get date range
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Build query
    query = Trip.query.filter_by(user_id=user_id)
    
    if start_date:
        start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        query = query.filter(Trip.start_time >= start_dt)
    
    if end_date:
        end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        query = query.filter(Trip.start_time <= end_dt)
    
    trips = query.all()
    
    if not trips:
        return jsonify({'error': 'No trips found for the specified period'}), 404
    
    # CO2 Analysis
    co2_by_mode = {}
    total_co2 = 0
    
    for trip in trips:
        if trip.co2_kg:
            mode = trip.mode
            if mode not in co2_by_mode:
                co2_by_mode[mode] = 0
            co2_by_mode[mode] += float(trip.co2_kg)
            total_co2 += float(trip.co2_kg)
    
    # Cost Analysis
    cost_by_mode = {}
    total_cost = 0
    
    for trip in trips:
        if trip.cost_usd:
            mode = trip.mode
            if mode not in cost_by_mode:
                cost_by_mode[mode] = 0
            cost_by_mode[mode] += float(trip.cost_usd)
            total_cost += float(trip.cost_usd)
    
    # Efficiency Analysis
    efficiency_metrics = {
        'avg_trip_duration': sum(trip.duration_minutes or 0 for trip in trips) / len(trips),
        'avg_trip_distance': sum(float(trip.distance_km or 0) for trip in trips) / len(trips),
        'most_efficient_mode': None,
        'least_efficient_mode': None
    }
    
    # Calculate efficiency by mode (distance per minute)
    mode_efficiency = {}
    for trip in trips:
        if trip.duration_minutes and trip.distance_km and trip.duration_minutes > 0:
            mode = trip.mode
            if mode not in mode_efficiency:
                mode_efficiency[mode] = {'total_distance': 0, 'total_duration': 0}
            mode_efficiency[mode]['total_distance'] += float(trip.distance_km)
            mode_efficiency[mode]['total_duration'] += trip.duration_minutes
    
    # Calculate efficiency scores
    efficiency_scores = {}
    for mode, data in mode_efficiency.items():
        if data['total_duration'] > 0:
            efficiency_scores[mode] = data['total_distance'] / data['total_duration']
    
    if efficiency_scores:
        most_efficient = max(efficiency_scores.items(), key=lambda x: x[1])
        least_efficient = min(efficiency_scores.items(), key=lambda x: x[1])
        efficiency_metrics['most_efficient_mode'] = {
            'mode': most_efficient[0],
            'efficiency': round(most_efficient[1], 2)
        }
        efficiency_metrics['least_efficient_mode'] = {
            'mode': least_efficient[0],
            'efficiency': round(least_efficient[1], 2)
        }
    
    return jsonify({
        'co2_analysis': {
            'total_co2_kg': round(total_co2, 2),
            'by_mode': {mode: round(co2, 2) for mode, co2 in co2_by_mode.items()},
            'environmental_impact': 'High' if total_co2 > 10 else 'Moderate' if total_co2 > 5 else 'Low'
        },
        'cost_analysis': {
            'total_cost_usd': round(total_cost, 2),
            'by_mode': {mode: round(cost, 2) for mode, cost in cost_by_mode.items()},
            'avg_cost_per_trip': round(total_cost / len(trips), 2)
        },
        'efficiency_metrics': efficiency_metrics,
        'summary': {
            'total_trips': len(trips),
            'period': {
                'start': start_date,
                'end': end_date
            }
        }
    })

@analytics_bp.route('/analytics/travel-times', methods=['GET'])
def get_travel_times():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400

    # Aggregate trip durations by hour of the day
    travel_times = db.session.query(
        db.func.extract('hour', Trip.start_time).label('hour'),
        db.func.avg(Trip.duration_minutes).label('avg_duration')
    ).filter(Trip.user_id == user_id).group_by('hour').order_by('hour').all()

    # Format for Chart.js
    labels = [f"{int(t.hour)}:00" for t in travel_times]
    data = [float(t.avg_duration) for t in travel_times]
    return jsonify({'labels': labels, 'data': data})

@analytics_bp.route('/analytics/top-destinations', methods=['GET'])
def get_top_destinations():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400

    # Count top 5 destinations
    top_destinations = db.session.query(
        Trip.end_address,
        db.func.count(Trip.end_address).label('count')
    ).filter(Trip.user_id == user_id, Trip.end_address.isnot(None)).\
    group_by(Trip.end_address).order_by(db.desc('count')).limit(5).all()

    labels = [d.end_address for d in top_destinations]
    data = [d.count for d in top_destinations]
    return jsonify({'labels': labels, 'data': data})
