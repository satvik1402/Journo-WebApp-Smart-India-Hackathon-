from flask import Blueprint, jsonify, request
from extensions import db
from models.ml_prediction import MLPrediction

ml_bp = Blueprint('ml', __name__)

@ml_bp.route('/ml/predictions', methods=['GET'])
def get_ml_predictions():
    """Get all ML predictions. The user_id is ignored for now as the table is global."""
    try:
        predictions = MLPrediction.query.all()
        results = [p.to_dict() for p in predictions]

        # This is a placeholder for how you might group data for different charts.
        # You will need to adjust the logic based on how you identify which row belongs to which chart.
        # For now, I'll create dummy groupings based on available columns.

        peak_overall = [{'start_hour': r['start_hour'], 'trip_count': r['peak_by_mode_visit']} for r in results if r['start_hour'] is not None and r['peak_by_mode_visit'] is not None]
        peak_by_mode = [{'start_hour': r['start_hour'], 'mode': r['mode'], 'trip_count': r['peak_by_mode_visit']} for r in results if r['start_hour'] is not None and r['mode'] is not None and r['peak_by_mode_visit'] is not None]
        peak_by_mode_dow = [{'dow': r['dow'], 'start_hour': r['start_hour'], 'trip_count': r['peak_by_mode_visit']} for r in results if r['dow'] is not None and r['start_hour'] is not None and r['peak_by_mode_visit'] is not None]
        overall_hotspots = [{'place_id': r['place_id'], 'visits': r['peak_by_mode_visit'], 'uniq_users': r['uniq_users'], 'top_mode': r['mode'], 'dest_lat_approx': r['dest_lat_approx'], 'dest_lon_approx': r['dest_lon_approx']} for r in results if r['place_id'] is not None]
        daily_hotspots_top3 = [{'date': r['date'], 'rank': r['rank_value'], 'place_id': r['place_id'], 'visits': r['peak_by_mode_visit']} for r in results if r['date'] is not None and r['rank_value'] is not None]
        per_day_mode_area = [{'date': r['date'], 'mode': r['mode'], 'source_area': r['source_area'], 'visits': r['peak_by_mode_visit']} for r in results if r['date'] is not None and r['mode'] is not None and r['source_area'] is not None]

        response_data = [
            {'prediction_type': 'peak_overall', 'result': peak_overall},
            {'prediction_type': 'peak_by_mode', 'result': peak_by_mode},
            {'prediction_type': 'peak_by_mode_dow', 'result': peak_by_mode_dow},
            {'prediction_type': 'overall_hotspots', 'result': overall_hotspots},
            {'prediction_type': 'daily_hotspots_top3', 'result': daily_hotspots_top3},
            {'prediction_type': 'per_day_mode_area', 'result': per_day_mode_area},
        ]

        return jsonify(response_data)
    except Exception as e:
        print(f"Error fetching ML predictions: {e}")
        return jsonify({'error': 'An internal error occurred.'}), 500
