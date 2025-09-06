from extensions import db
from datetime import datetime
from decimal import Decimal

class Trip(db.Model):
    """Trip model for storing travel data"""
    
    __tablename__ = 'trips'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime)
    start_lat = db.Column(db.Numeric(10, 8))
    start_lng = db.Column(db.Numeric(11, 8))
    end_lat = db.Column(db.Numeric(10, 8))
    end_lng = db.Column(db.Numeric(11, 8))
    start_address = db.Column(db.String(255))
    end_address = db.Column(db.String(255))
    distance_km = db.Column(db.Numeric(8, 2))
    duration_minutes = db.Column(db.Integer)
    mode = db.Column(db.String(20), nullable=False)  # walking, cycling, bus, car, train
    mode_confidence = db.Column(db.Numeric(3, 2))  # 0.00 to 1.00
    co2_kg = db.Column(db.Numeric(8, 2))  # kg CO2
    cost_usd = db.Column(db.Numeric(8, 2))
    is_manual = db.Column(db.Boolean, default=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    trip_points = db.relationship('TripPoint', backref='trip', lazy=True, cascade='all, delete-orphan')
    
    def __init__(self, user_id, start_time, mode, start_lat=None, start_lng=None, 
                 end_lat=None, end_lng=None, start_address=None, end_address=None,
                 distance_km=None, duration_minutes=None, mode_confidence=None,
                 co2_kg=None, cost_usd=None, is_manual=False, notes=None, end_time=None):
        self.user_id = user_id
        self.start_time = start_time
        self.mode = mode
        self.start_lat = start_lat
        self.start_lng = start_lng
        self.end_lat = end_lat
        self.end_lng = end_lng
        self.start_address = start_address
        self.end_address = end_address
        self.distance_km = distance_km
        self.duration_minutes = duration_minutes
        self.mode_confidence = mode_confidence
        self.co2_kg = co2_kg
        self.cost_usd = cost_usd
        self.is_manual = is_manual
        self.notes = notes
        self.end_time = end_time
    
    def calculate_co2_kg(self):
        """Calculate CO2 emissions based on mode and distance"""
        if not self.distance_km:
            return 0
        
        co2_factors = {
            'walking': 0.0,
            'cycling': 0.0,
            'bus': 0.08,
            'car': 0.12,
            'train': 0.04
        }
        
        factor = co2_factors.get(self.mode, 0.0)
        self.co2_kg = float(self.distance_km) * factor
        return self.co2_kg
    
    def calculate_cost(self):
        """Calculate travel cost based on mode and distance"""
        if not self.distance_km:
            return 0
        
        cost_factors = {
            'walking': 0.0,
            'cycling': 0.0,
            'bus': 2.0,
            'car': 5.0,
            'train': 1.0
        }
        
        factor = cost_factors.get(self.mode, 0.0)
        self.cost_usd = float(self.distance_km) * factor
        return self.cost_usd
    
    def calculate_duration(self):
        """Calculate trip duration in minutes"""
        if self.start_time and self.end_time:
            delta = self.end_time - self.start_time
            self.duration_minutes = int(delta.total_seconds() / 60)
            return self.duration_minutes
        return None
    
    def to_dict(self):
        """Convert trip to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'start_location': {
                'lat': float(self.start_lat) if self.start_lat else None,
                'lng': float(self.start_lng) if self.start_lng else None,
                'address': self.start_address
            },
            'end_location': {
                'lat': float(self.end_lat) if self.end_lat else None,
                'lng': float(self.end_lng) if self.end_lng else None,
                'address': self.end_address
            },
            'distance_km': float(self.distance_km) if self.distance_km else None,
            'duration_minutes': self.duration_minutes,
            'mode': self.mode,
            'mode_confidence': float(self.mode_confidence) if self.mode_confidence else None,
            'co2_kg': float(self.co2_kg) if self.co2_kg else None,
            'cost_usd': float(self.cost_usd) if self.cost_usd else None,
            'is_manual': self.is_manual,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Trip {self.id}: {self.mode} from {self.start_address} to {self.end_address}>'
