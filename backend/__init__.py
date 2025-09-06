from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
import os

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()

def create_app():
    """Application factory pattern"""
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///smart_travel.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app, origins=[
        "http://localhost:8080",  # Mobile App
        "http://localhost:3000",  # Dashboard
        "https://yourdomain.com"  # Production
    ])
    
    # Import models
    from models.user import User
    from models.trip import Trip
    from models.trip_point import TripPoint
    
    # Import routes
    from routes.trip_routes import trip_bp
    from routes.analytics_routes import analytics_bp
    from routes.user_routes import user_bp
    
    # Register blueprints
    app.register_blueprint(trip_bp, url_prefix='/api')
    app.register_blueprint(analytics_bp, url_prefix='/api')
    app.register_blueprint(user_bp, url_prefix='/api')
    
    @app.route('/api/health')
    def health_check():
        """Health check endpoint"""
        return {
            'status': 'healthy',
            'timestamp': db.func.now(),
            'version': '1.0.0'
        }
    
    @app.route('/api/config')
    def get_config():
        """Get frontend configuration"""
        return {
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
        }
    
    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return {'error': 'Internal server error'}, 500
    
    return app
