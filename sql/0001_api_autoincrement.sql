-- 0001_api_autoincrement.sql
-- The Lab 4 tables used fixed integer primary keys. The API creates rows
-- with INSERT ... and reads result.insertId (signup, add review, add comment),
-- which requires AUTO_INCREMENT. Run this once against the Week 4 database.
--
--   mysql -u ttapp -p tenanttrails < sql/0001_api_autoincrement.sql
--
-- Foreign-key checks are turned off for the column changes, because MySQL
-- will not alter an id column while other tables' foreign keys reference it.
-- MySQL sets each AUTO_INCREMENT counter to max(id)+1 automatically.

USE tenanttrails;

SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE apartments MODIFY id INT NOT NULL AUTO_INCREMENT;
ALTER TABLE users      MODIFY id INT NOT NULL AUTO_INCREMENT;
ALTER TABLE reviews    MODIFY id INT NOT NULL AUTO_INCREMENT;
ALTER TABLE comments   MODIFY id INT NOT NULL AUTO_INCREMENT;

SET FOREIGN_KEY_CHECKS = 1;
