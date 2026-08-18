-- kestrelgate: A garage group: vehicles, service bookings, jobs, parts and MOTs.
--
-- Every table carries created_at, and anything that can be corrected after the
-- fact carries updated_at as well. Money is in pence and time in whole days or
-- minutes, so that nothing in the schema is a float.

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('technician', 'service_desk', 'parts', 'viewer')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions (token);

CREATE TABLE IF NOT EXISTS api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS audit_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  actor TEXT,
  took_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_entries (created_at);

CREATE TABLE IF NOT EXISTS rate_limit_hits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bucket TEXT NOT NULL,
  at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limit ON rate_limit_hits (bucket, at);

-- A branch of the group: a workshop with a number of ramps, its own
-- * service desk, and its own diary.
CREATE TABLE IF NOT EXISTS sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  town TEXT NOT NULL,
  ramps INTEGER NOT NULL,
  opened_on TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS sites_code_idx ON sites (code);

-- Somebody on the workshop floor at one branch. The labour rate is
-- * theirs rather than the branch's: an MOT tester and an apprentice on the same
-- * ramp do not cost the customer the same hour.
CREATE TABLE IF NOT EXISTS technicians (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  clock_number TEXT NOT NULL,
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  labour_rate_pence INTEGER NOT NULL,
  started_on TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS technicians_clock_number_idx ON technicians (site_id, clock_number);

-- An account. Retail customers pay before the keys come back; account
-- * customers are invoiced monthly, which is why the flag matters to the desk.
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_ref TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  opened_on TEXT NOT NULL,
  on_account INTEGER NOT NULL DEFAULT 0 CHECK (on_account IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS customers_account_ref_idx ON customers (account_ref);

-- A vehicle on an account. A registration belongs to one vehicle across
-- * the whole group, not one per account: when a van changes hands the record
-- * moves to the new account rather than being typed in again.
CREATE TABLE IF NOT EXISTS vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  registration TEXT NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  fuel TEXT NOT NULL,
  engine_cc INTEGER NOT NULL,
  first_registered_on TEXT NOT NULL,
  odometer_miles INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS vehicles_registration_idx ON vehicles (registration);

-- A line in the catalogue. The trade price is what the factor charges
-- * us; the markup is basis points on top of that, so 2500 is a quarter on. The
-- * retail price is worked out from the two and never stored, because a factor
-- * who puts their prices up must not silently reprice work already invoiced.
CREATE TABLE IF NOT EXISTS parts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  part_number TEXT NOT NULL,
  description TEXT NOT NULL,
  trade_price_pence INTEGER NOT NULL,
  markup_basis_points INTEGER NOT NULL,
  on_hand INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS parts_part_number_idx ON parts (part_number);

-- A visit. The vehicle says whose it is, the site says which workshop
-- * is expecting it, and the status is what the service desk looks at when the
-- * customer rings up to ask.
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  site_id INTEGER NOT NULL,
  booked_for TEXT NOT NULL,
  reason TEXT NOT NULL,
  odometer_in INTEGER,
  status TEXT NOT NULL DEFAULT 'booked',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- A line of work. Labour is booked in tenths of an hour because that is
-- * what the ramp clock records; the charge is worked out from the technician's
-- * own rate at the moment the job is raised and then left alone, so a pay rise
-- * next month does not reprice work already done.
CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  technician_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  labour_tenths INTEGER NOT NULL,
  labour_pence INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- A part going onto a job. The unit price is the catalogue price worked
-- * out at the moment of fitting and then held, because the factor's prices move
-- * and the customer's invoice must not.
CREATE TABLE IF NOT EXISTS fitments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  part_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price_pence INTEGER NOT NULL,
  line_pence INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- An MOT test on a vehicle. The certificate number is the DVSA's, not
-- * ours, so it is unique across the group and arrives from the tester rather
-- * than being allocated here.
CREATE TABLE IF NOT EXISTS mot_tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  certificate_number TEXT NOT NULL,
  tested_on TEXT NOT NULL,
  result TEXT NOT NULL,
  odometer_miles INTEGER NOT NULL,
  expires_on TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS mot_tests_certificate_number_idx ON mot_tests (certificate_number);

-- One invoice for one completed booking. Every money column is worked
-- * out when the invoice is raised and then stored, because the jobs and fitments
-- * it was built from can be repriced afterwards and the invoice cannot.
-- *
-- * It hangs off /invoices rather than under the booking because it outlives the
-- * visit: the accounts office chases it long after the car has gone.
CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL,
  number TEXT NOT NULL,
  raised_on TEXT NOT NULL,
  labour_pence INTEGER NOT NULL,
  parts_pence INTEGER NOT NULL,
  net_pence INTEGER NOT NULL,
  vat_pence INTEGER NOT NULL,
  gross_pence INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS invoices_number_idx ON invoices (number);

-- A payment against an invoice. An invoice can be settled in more than
-- * one go - a deposit on collection and the balance on account - so the amount
-- * outstanding is the gross less everything received, and a payment that would
-- * take it below zero is refused rather than parked as a credit.
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL,
  paid_on TEXT NOT NULL,
  method TEXT NOT NULL,
  amount_pence INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Something the branch means to tell a customer about a vehicle: an MOT
-- * running out, a service interval reached. It is raised for a day in the
-- * future and then sits until somebody sends it; the status is how the desk
-- * knows what still has to go out this week.
CREATE TABLE IF NOT EXISTS reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  due_on TEXT NOT NULL,
  note TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- An order placed with the factor to put a part back on the shelf. It
-- * sits on order until it arrives; marking it received is the only thing that
-- * moves the part's on-hand count up, so the count and the paperwork cannot
-- * drift apart.
CREATE TABLE IF NOT EXISTS supplier_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  part_id INTEGER NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
  reference TEXT NOT NULL,
  ordered_on TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'ordered',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS supplier_orders_reference_idx ON supplier_orders (reference);
