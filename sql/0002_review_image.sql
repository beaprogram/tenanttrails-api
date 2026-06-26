-- 0002_review_image.sql
-- Reviews can carry an attached photo. We store only the Cloudinary URL,
-- never the file itself (images go to the CDN, not the database).
--
--   mysql -u root -p tenanttrails < sql/0002_review_image.sql

USE tenanttrails;

ALTER TABLE reviews ADD COLUMN image_url VARCHAR(400) NULL;
