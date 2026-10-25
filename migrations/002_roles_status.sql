-- Run ONCE on an existing database (fresh installs already get these from schema.sql)
ALTER TABLE users
  ADD COLUMN role ENUM('user','admin') NOT NULL DEFAULT 'user',
  ADD COLUMN status ENUM('active','suspended') NOT NULL DEFAULT 'active',
  ADD INDEX idx_users_status (status);
