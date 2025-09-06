from extensions import db

class MLPrediction(db.Model):
    __tablename__ = 'ml_predictions'

    id = db.Column(db.Integer, primary_key=True)
    start_time = db.Column(db.DateTime)
    end_time = db.Column(db.DateTime)
    date = db.Column(db.Date)
    start_hour = db.Column(db.Integer)
    mode = db.Column(db.String(50))
    place_id = db.Column(db.String(255))
    dest_lat_approx = db.Column(db.Float)
    dest_lon_approx = db.Column(db.Float)
    peak_by_mode_visit = db.Column(db.Integer)
    uniq_users = db.Column(db.Integer)
    avg_starthour = db.Column(db.Float)
    dow = db.Column(db.Integer)
    rank_value = db.Column(db.Integer)
    source_area = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

    def to_dict(self):
        return {
            'id': self.id,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'date': self.date.isoformat() if self.date else None,
            'start_hour': self.start_hour,
            'mode': self.mode,
            'place_id': self.place_id,
            'dest_lat_approx': self.dest_lat_approx,
            'dest_lon_approx': self.dest_lon_approx,
            'peak_by_mode_visit': self.peak_by_mode_visit,
            'uniq_users': self.uniq_users,
            'avg_starthour': self.avg_starthour,
            'dow': self.dow,
            'rank_value': self.rank_value,
            'source_area': self.source_area,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
