export const schema = `
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS SchemaMigrations (version INTEGER PRIMARY KEY);
CREATE TABLE IF NOT EXISTS Shops (id TEXT PRIMARY KEY, shop_id TEXT NOT NULL UNIQUE, name TEXT NOT NULL, data TEXT NOT NULL, CHECK (id = shop_id));
CREATE TABLE IF NOT EXISTS Customers (id TEXT PRIMARY KEY, shop_id TEXT NOT NULL REFERENCES Shops(id), name TEXT NOT NULL, phone TEXT NOT NULL, archived INTEGER NOT NULL DEFAULT 0, data TEXT NOT NULL, UNIQUE(id,shop_id));
CREATE INDEX IF NOT EXISTS customers_search ON Customers(shop_id,archived,name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS customers_phone ON Customers(shop_id,phone);
CREATE TABLE IF NOT EXISTS MeasurementTemplates (id TEXT PRIMARY KEY, shop_id TEXT NOT NULL REFERENCES Shops(id), name TEXT NOT NULL, data TEXT NOT NULL, UNIQUE(id,shop_id));
CREATE TABLE IF NOT EXISTS TemplateVersions (id TEXT PRIMARY KEY, shop_id TEXT NOT NULL, template_id TEXT NOT NULL, version INTEGER NOT NULL CHECK(version>0), data TEXT NOT NULL, UNIQUE(template_id,version), FOREIGN KEY(template_id,shop_id) REFERENCES MeasurementTemplates(id,shop_id));
CREATE TABLE IF NOT EXISTS TemplateFields (id TEXT NOT NULL, version_id TEXT NOT NULL REFERENCES TemplateVersions(id), field_key TEXT NOT NULL, field_type TEXT NOT NULL, is_required INTEGER NOT NULL, display_order INTEGER NOT NULL, field_config TEXT NOT NULL, PRIMARY KEY(id,version_id), UNIQUE(version_id,field_key));
CREATE TABLE IF NOT EXISTS CustomerMeasurements (id TEXT PRIMARY KEY, shop_id TEXT NOT NULL, customer_id TEXT NOT NULL, template_id TEXT NOT NULL, template_version INTEGER NOT NULL, measurements_json TEXT NOT NULL, data TEXT NOT NULL, UNIQUE(id,shop_id), FOREIGN KEY(customer_id,shop_id) REFERENCES Customers(id,shop_id), FOREIGN KEY(template_id,template_version) REFERENCES TemplateVersions(template_id,version));
CREATE INDEX IF NOT EXISTS measurements_customer ON CustomerMeasurements(shop_id,customer_id);
CREATE TABLE IF NOT EXISTS Orders (id TEXT PRIMARY KEY, shop_id TEXT NOT NULL, customer_id TEXT NOT NULL, delivery_date TEXT NOT NULL, total_minor INTEGER NOT NULL CHECK(total_minor>=0), data TEXT NOT NULL, UNIQUE(id,shop_id), FOREIGN KEY(customer_id,shop_id) REFERENCES Customers(id,shop_id));
CREATE INDEX IF NOT EXISTS orders_delivery ON Orders(shop_id,delivery_date);
CREATE TABLE IF NOT EXISTS OrderItems (id TEXT PRIMARY KEY, shop_id TEXT NOT NULL, order_id TEXT NOT NULL, measurement_id TEXT NOT NULL, data TEXT NOT NULL, FOREIGN KEY(order_id,shop_id) REFERENCES Orders(id,shop_id), FOREIGN KEY(measurement_id,shop_id) REFERENCES CustomerMeasurements(id,shop_id));
CREATE TABLE IF NOT EXISTS Payments (id TEXT PRIMARY KEY, shop_id TEXT NOT NULL, order_id TEXT NOT NULL, amount_minor INTEGER NOT NULL CHECK(amount_minor>0), data TEXT NOT NULL, FOREIGN KEY(order_id,shop_id) REFERENCES Orders(id,shop_id));
CREATE TABLE IF NOT EXISTS ShopSettings (shop_id TEXT PRIMARY KEY REFERENCES Shops(id), data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS DeviceSettings (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS SyncChanges (sequence INTEGER PRIMARY KEY AUTOINCREMENT, record_id TEXT NOT NULL, shop_id TEXT NOT NULL REFERENCES Shops(id), entity TEXT NOT NULL, record_version INTEGER NOT NULL, device_id TEXT NOT NULL, data TEXT NOT NULL, acknowledged INTEGER NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS changes_pending ON SyncChanges(shop_id,acknowledged,sequence);
CREATE TABLE IF NOT EXISTS MigrationMarkers (id TEXT PRIMARY KEY);
INSERT OR IGNORE INTO SchemaMigrations(version) VALUES (1);
PRAGMA user_version = 1;
`;

