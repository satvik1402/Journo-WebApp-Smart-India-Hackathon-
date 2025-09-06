from extensions import db
from datetime import datetime

class ManualTrip(db.Model):
    __tablename__ = 'manual_trip'

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
    mode = db.Column(db.String(20), nullable=False)
    co2_kg = db.Column(db.Numeric(8, 2))
    cost_usd = db.Column(db.Numeric(8, 2))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'start_address': self.start_address,
            'end_address': self.end_address,
            'distance_km': float(self.distance_km) if self.distance_km else None,
            'duration_minutes': self.duration_minutes,
            'mode': self.mode,
            'co2_kg': float(self.co2_kg) if self.co2_kg else None,
            'cost_usd': float(self.cost_usd) if self.cost_usd else None,
            'notes': self.notes
        }
