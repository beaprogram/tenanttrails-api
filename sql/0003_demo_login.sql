-- 0003_demo_login.sql (optional)
-- Seed users from Lab 4 have plain-text passwords and cannot log in through the
-- API (which compares bcrypt hashes). This sets alex@dal.ca to a bcrypt hash of
-- "password123" so the login page's demo credentials work. Not needed for the
-- video, where you sign up a fresh account.
--
--   mysql -u ttapp -p tenanttrails < sql/0003_demo_login.sql

USE tenanttrails;
UPDATE users SET password = '$2b$10$lrugcuUiKUzrLy5hhIv59.9oYUc6bADBPKxhlXaWOYOQS8f/g5xSe' WHERE email = 'alex@dal.ca';
