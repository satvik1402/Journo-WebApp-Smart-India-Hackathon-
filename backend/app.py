from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
from datetime import datetime
import json

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///smart_travel.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

from extensions import db, migrate

# Initialize extensions
db.init_app(app)
migrate.init_app(app, db)
CORS(app, origins=[
    "http://localhost:8080",  # Mobile App
    "http://localhost:3000",  # Dashboard
    "http://localhost:8000",  # Local static dashboard
    "https://yourdomain.com"  # Production
])

# Import models after db is initialized
from models.user import User
from models.trip import Trip
from models.trip_point import TripPoint
from models.ml_prediction import MLPrediction

# Import routes
from routes.context_routes import context_bp
from routes.trip_routes import trip_bp
from routes.user_routes import user_bp
from routes.manual_trip_routes import manual_trip_bp
from routes.ml_routes import ml_bp
from routes.analytics_routes import analytics_bp
from routes.heatmap_routes import heatmap_bp
from routes.dashboard_routes import dashboard_bp

# Register blueprints
app.register_blueprint(context_bp, url_prefix='/api')
app.register_blueprint(trip_bp, url_prefix='/api')
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(manual_trip_bp, url_prefix='/api')
app.register_blueprint(ml_bp, url_prefix='/api')
app.register_blueprint(analytics_bp, url_prefix='/api')
app.register_blueprint(heatmap_bp, url_prefix='/api')
app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')

# Serve Dashboard static files
from flask import send_from_directory
import os
DASHBOARD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../Dashboard'))

@app.route('/dashboard/<path:filename>')
def dashboard_static(filename):
    return send_from_directory(DASHBOARD_DIR, filename)

@app.route('/dashboard/')
def dashboard_index():
    return send_from_directory(DASHBOARD_DIR, 'data-insights.html')

# MySQL init (optional, safe to run each start)
try:
    from init_mysql import run_mysql_init
    run_mysql_init()
except Exception as e:
    print(f"[startup] MySQL init skipped: {e}")

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0'
    })

@app.route('/api/config')
def get_config():
    """Get frontend configuration"""
    return jsonify({
        'google_maps_api_key': os.getenv('GOOGLE_MAPS_API_KEY'),
        'trip_detection': {
            'min_speed': 1.0,
            'max_idle_time': 300,
            'min_trip_duration': 60,
            'accuracy_threshold': 10
        },
        'co2_factors': {
            'walking': 0.0,
            'cycling': 0.0,
            'bus': 0.08,
            'car': 0.12,
            'train': 0.04
        },
        'cost_factors': {
            'walking': 0.0,
            'cycling': 0.0,
            'bus': 2.0,
            'car': 5.0,
            'train': 1.0
        }
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    port = int(os.getenv('PORT', '5000'))
    app.run(debug=True, host='0.0.0.0', port=port)