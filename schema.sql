CREATE TABLE IF NOT EXISTS users(
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 email_hash CHAR(64) NOT NULL UNIQUE,      -- HMAC for lookup/uniqueness
 email_enc TEXT NOT NULL,                  -- AES-256-GCM
 phone_enc TEXT NOT NULL,                  -- AES-256-GCM
 name VARCHAR(80) NOT NULL,
 age TINYINT UNSIGNED NOT NULL,
 intent ENUM('marriage','long_term','friendship_first') NOT NULL,
 pass_hash VARCHAR(100) NOT NULL,          -- bcrypt
 role ENUM('user','admin') NOT NULL DEFAULT 'user',
 status ENUM('active','suspended') NOT NULL DEFAULT 'active',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS notifications(
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 user_id BIGINT UNSIGNED NOT NULL,
 channel ENUM('sms','whatsapp','email') NOT NULL,
 status ENUM('pending','sent','failed') DEFAULT 'pending',
 attempts TINYINT UNSIGNED DEFAULT 0,
 error VARCHAR(200) NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 INDEX(status,attempts), INDEX(user_id),
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS audit_log(
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 user_id BIGINT UNSIGNED NULL, action VARCHAR(40) NOT NULL, ip VARCHAR(45),
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX(action,created_at)) ENGINE=InnoDB;
