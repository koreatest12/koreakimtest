-- Example DDL template for customer schema
-- Parameters: ${DB_NAME}
CREATE TABLE ${DB_NAME}.customer (
  customer_id BIGINT NOT NULL,
  name VARCHAR(200) CHARACTER SET UNICODE,
  email VARCHAR(200) CHARACTER SET UNICODE,
  created_at TIMESTAMP(6)
) PRIMARY INDEX (customer_id);
