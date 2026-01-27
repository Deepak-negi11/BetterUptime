-- Insert regions for workers
INSERT INTO region (id, name) VALUES ('india-1', 'India') ON CONFLICT (id) DO NOTHING;
INSERT INTO region (id, name) VALUES ('us-east-1', 'US East') ON CONFLICT (id) DO NOTHING;
