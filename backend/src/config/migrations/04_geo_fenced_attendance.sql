-- Geo-fenced attendance migration

ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS check_in_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS check_in_longitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS check_out_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS check_out_longitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS location_status VARCHAR(50);

INSERT INTO settings (setting_key, setting_value, category, description) VALUES
('office_latitude', '0', 'attendance', 'Office Latitude for Geofencing'),
('office_longitude', '0', 'attendance', 'Office Longitude for Geofencing'),
('geofence_radius', '500', 'attendance', 'Geofence Radius in meters'),
('strict_geofence', 'false', 'attendance', 'Strictly block checkins outside geofence')
ON CONFLICT (setting_key) DO NOTHING;
