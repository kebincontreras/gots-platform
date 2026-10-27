-- REVIEW ONLY rollback for an empty, unpopulated Labs installation.
-- Never run against a populated database without exporting Labs records first.
DROP TABLE IF EXISTS lab_notifications;
DROP TABLE IF EXISTS lab_loan_items;
DROP TABLE IF EXISTS lab_loans;
DROP TABLE IF EXISTS lab_experiment_sessions;
DROP TABLE IF EXISTS lab_attachment_blobs;
DROP TABLE IF EXISTS lab_attachments;
DROP TABLE IF EXISTS lab_experiment_items;
DROP TABLE IF EXISTS lab_experiment_participants;
DROP TABLE IF EXISTS lab_experiments;
DROP TABLE IF EXISTS lab_inventory_items;
DROP TABLE IF EXISTS lab_locations;
DROP TABLE IF EXISTS lab_memberships;
DROP TABLE IF EXISTS lab_loan_responsibles;
DROP TABLE IF EXISTS lab_admins;
