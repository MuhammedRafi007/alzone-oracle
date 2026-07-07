import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// SQLite / PostgreSQL Unified Adapter
class DatabaseAdapter {
  constructor() {
    this.isPg = !!process.env.DATABASE_URL;
    if (this.isPg) {
      console.log('Using PostgreSQL mode.');
      this.client = new pg.Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      this.client.connect().catch(err => {
        console.error('Failed to connect to PostgreSQL:', err.message);
      });
    } else {
      console.log('Using SQLite mode.');
      const dbPath = path.join(__dirname, 'alzone_erp.db');
      this.sqliteDb = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('Failed to connect to SQLite database:', err.message);
        } else {
          console.log(`Connected successfully to SQLite database: ${dbPath}`);
        }
      });
    }
  }

  // Convert ? to $1, $2, etc. for PostgreSQL, and translate SQLite specific queries
  translateSql(sql) {
    if (!this.isPg) return sql;
    
    // Replace INSERT OR REPLACE with PostgreSQL equivalent
    if (sql.includes('INSERT OR REPLACE INTO users')) {
      return sql
        .replace('INSERT OR REPLACE INTO users', 'INSERT INTO users')
        .replace(/\?\s*,\s*\?\s*,\s*\?\s*,\s*\?\s*,\s*\?/, '$1, $2, $3, $4, $5')
        + ' ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, name = EXCLUDED.name, role = EXCLUDED.role, avatarUrl = EXCLUDED.avatarUrl';
    }

    let index = 1;
    return sql.replace(/\?/g, () => `$${index++}`);
  }

  serialize(callback) {
    if (this.isPg) {
      callback();
    } else {
      this.sqliteDb.serialize(callback);
    }
  }

  run(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    const translatedSql = this.translateSql(sql);

    if (this.isPg) {
      this.client.query(translatedSql, params, (err, res) => {
        if (callback) {
          const context = { changes: res ? res.rowCount : 0 };
          callback.call(context, err);
        }
      });
    } else {
      this.sqliteDb.run(sql, params, callback);
    }
  }

  get(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    const translatedSql = this.translateSql(sql);

    if (this.isPg) {
      this.client.query(translatedSql, params, (err, res) => {
        if (callback) {
          callback(err, res && res.rows ? res.rows[0] : undefined);
        }
      });
    } else {
      this.sqliteDb.get(sql, params, callback);
    }
  }

  all(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    const translatedSql = this.translateSql(sql);

    if (this.isPg) {
      this.client.query(translatedSql, params, (err, res) => {
        if (callback) {
          callback(err, res && res.rows ? res.rows : []);
        }
      });
    } else {
      this.sqliteDb.all(sql, params, callback);
    }
  }

  prepare(sql) {
    if (this.isPg) {
      return {
        run: (...args) => {
          let params = args;
          let callback;
          if (typeof args[args.length - 1] === 'function') {
            callback = args.pop();
            params = args;
          }
          this.run(sql, params, callback);
        },
        finalize: () => {}
      };
    } else {
      return this.sqliteDb.prepare(sql);
    }
  }
}

// Database Connection Instance
const db = new DatabaseAdapter();

// Create tables schema
db.serialize(() => {
  // 1. Users Table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      email TEXT PRIMARY KEY,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      avatarUrl TEXT
    )
  `);

  // 2. Discrepancy Tickets Table
  db.run(`
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      receiptNo TEXT NOT NULL,
      invoiceNo TEXT NOT NULL,
      supplier TEXT NOT NULL,
      issueType TEXT NOT NULL,
      severity TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL,
      timestamp TEXT NOT NULL
    )
  `);

  // 3. Match Vouchers Table
  db.run(`
    CREATE TABLE IF NOT EXISTS matches (
      voucher TEXT PRIMARY KEY,
      receiptNo TEXT NOT NULL,
      invoiceNo TEXT NOT NULL,
      supplier TEXT NOT NULL,
      amount REAL NOT NULL,
      vat REAL NOT NULL,
      timestamp TEXT NOT NULL,
      status TEXT NOT NULL
    )
  `);

  // Seed default records if empty
  seedDatabase();
});

function seedDatabase() {
  // Seed Users
  db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
    if (err) return console.error('Error querying users count:', err.message);
    
    console.log('Synchronizing standard corporate identities into users table...');
    const defaultUsers = [
      {
        email: 'rafi.muhammed@alzone.com',
        password: 'rafi2026',
        name: 'Rafi Muhammed',
        role: 'Finance Administrator',
        avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=100'
      },
      {
        email: 'jerry.cleto@alzone.com',
        password: 'jerry2026',
        name: 'Jerry Cleto',
        role: 'Accounts Payable Manager',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100'
      },
      {
        email: 'dev.balaji@alzone.com',
        password: 'dev2026',
        name: 'Dev Balaji',
        role: 'Senior Treasury Analyst',
        avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=100'
      },
      {
        email: 'chintam.srinivas@alzone.com',
        password: 'chintam2026',
        name: 'Chintam Srinivas',
        role: 'Lead Compliance Auditor',
        avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=100'
      }
    ];

    const stmt = db.prepare('INSERT OR REPLACE INTO users (email, password, name, role, avatarUrl) VALUES (?, ?, ?, ?, ?)');
    defaultUsers.forEach(u => {
      stmt.run(u.email, u.password, u.name, u.role, u.avatarUrl);
    });
    stmt.finalize();
  });

  // Seed Tickets
  db.get('SELECT COUNT(*) as count FROM tickets', [], (err, row) => {
    if (err) return console.error('Error querying tickets count:', err.message);
    if (Number(row.count) === 0) {
      console.log('Seeding default compliance tickets into tickets table...');
      const defaultTickets = [
        {
          id: 'TKT-2026-081',
          title: 'Site Location mismatch on receipt check-in',
          receiptNo: 'REC-2026-1142',
          invoiceNo: 'INV-402911-CA',
          supplier: 'Apex Telecom Group',
          issueType: 'Site Mismatch',
          severity: 'Medium',
          amount: 4800.00,
          status: 'Open',
          timestamp: '2026-05-22 09:15 AM'
        },
        {
          id: 'TKT-2026-082',
          title: 'Invoice price clearance limit exceeded PO tolerance threshold',
          receiptNo: 'REC-2026-8841',
          invoiceNo: 'INV-110488-NY',
          supplier: 'Systec Global Solutions',
          issueType: 'Price Discrepancy',
          severity: 'High',
          amount: 23150.00,
          status: 'Open',
          timestamp: '2026-05-22 10:42 AM'
        },
        {
          id: 'TKT-2026-083',
          title: 'Standard audit failure due to invalid PO references',
          receiptNo: 'REC-2026-9041',
          invoiceNo: 'INV-909241-TX',
          supplier: 'Oracle Software Logistics',
          issueType: 'PO Reference Mismatch',
          severity: 'Low',
          amount: 14500.00,
          status: 'Resolved',
          timestamp: '2026-05-21 02:10 PM'
        }
      ];

      const stmt = db.prepare(`
        INSERT INTO tickets (id, title, receiptNo, invoiceNo, supplier, issueType, severity, amount, status, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      defaultTickets.forEach(t => {
        stmt.run(t.id, t.title, t.receiptNo, t.invoiceNo, t.supplier, t.issueType, t.severity, t.amount, t.status, t.timestamp);
      });
      stmt.finalize();
    }
  });

  // Seed Matches
  db.get('SELECT COUNT(*) as count FROM matches', [], (err, row) => {
    if (err) return console.error('Error querying matches count:', err.message);
    if (row.count === 0) {
      console.log('Seeding historical matches into matches table...');
      const defaultMatches = [
        {
          voucher: 'VOC_K7B4',
          receiptNo: 'REC-2026-8092',
          invoiceNo: 'INV-301149-TX',
          supplier: 'Oracle Software Logistics',
          amount: 14500.00,
          vat: 2175.00,
          timestamp: '2026-05-22 10:12 AM',
          status: 'Matched'
        },
        {
          voucher: 'VOC_N2A9',
          receiptNo: 'REC-2026-7789',
          invoiceNo: 'INV-402911-CA',
          supplier: 'Apex Telecom Group',
          amount: 4800.00,
          vat: 720.00,
          timestamp: '2026-05-21 04:30 PM',
          status: 'Matched'
        },
        {
          voucher: 'VOC_R9M1',
          receiptNo: 'REC-2026-7241',
          invoiceNo: 'INV-110488-NY',
          supplier: 'Systec Global Solutions',
          amount: 23150.00,
          vat: 3472.50,
          timestamp: '2026-05-21 11:15 AM',
          status: 'Matched'
        }
      ];

      const stmt = db.prepare(`
        INSERT INTO matches (voucher, receiptNo, invoiceNo, supplier, amount, vat, timestamp, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      defaultMatches.forEach(m => {
        stmt.run(m.voucher, m.receiptNo, m.invoiceNo, m.supplier, m.amount, m.vat, m.timestamp, m.status);
      });
      stmt.finalize();
    }
  });
}

// ==========================================
// REST API ROUTE DEFINITIONS
// ==========================================

// DB Status / Health Check
app.get('/api/status', (req, res) => {
  res.json({ status: 'online', database: 'connected', type: 'SQLite3' });
});

// Authenticate Operator Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  db.get(
    'SELECT * FROM users WHERE LOWER(email) = LOWER(?) AND password = ?',
    [email, password],
    (err, userRow) => {
      if (err) {
        console.error('Login query error:', err.message);
        return res.status(500).json({ error: 'Server authentication database error.' });
      }
      if (userRow) {
        return res.json({
          email: userRow.email,
          name: userRow.name,
          role: userRow.role,
          avatarUrl: userRow.avatarUrl
        });
      } else {
        return res.status(401).json({ error: 'Invalid corporate credentials. Check spelling and try again.' });
      }
    }
  );
});

// Register New Physical Terminal Access
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // Check email conflict
  db.get('SELECT email FROM users WHERE LOWER(email) = LOWER(?)', [email], (err, existing) => {
    if (err) {
      console.error('Registration lookup error:', err.message);
      return res.status(500).json({ error: 'Database conflict error.' });
    }
    if (existing) {
      return res.status(409).json({ error: 'Corporate Email is already registered.' });
    }

    const randomId = 1500000000000 + Math.floor(Math.random() * 999999);
    const avatarUrl = `https://images.unsplash.com/photo-${randomId}?auto=format&fit=crop&q=80&w=100`;
    const role = 'AP Specialist';

    db.run(
      'INSERT INTO users (email, password, name, role, avatarUrl) VALUES (?, ?, ?, ?, ?)',
      [email, password, name, role, avatarUrl],
      function (err2) {
        if (err2) {
          console.error('Registration insertion error:', err2.message);
          return res.status(500).json({ error: 'Failed to record corporate identity.' });
        }
        return res.json({ email, name, role, avatarUrl });
      }
    );
  });
});

// Fetch All Corporate Identities
app.get('/api/users', (req, res) => {
  db.all('SELECT email, name, role, avatarUrl FROM users', [], (err, rows) => {
    if (err) {
      console.error('Failed to query users:', err.message);
      return res.status(500).json({ error: 'Failed to query users.' });
    }
    res.json(rows);
  });
});

// Fetch All Discrepancy Tickets
app.get('/api/tickets', (req, res) => {
  db.all('SELECT * FROM tickets ORDER BY timestamp DESC', [], (err, rows) => {
    if (err) {
      console.error('Failed to query tickets:', err.message);
      return res.status(500).json({ error: 'Failed to query tickets.' });
    }
    res.json(rows);
  });
});

// Create New Discrepancy Ticket
app.post('/api/tickets', (req, res) => {
  const { title, receiptNo, invoiceNo, supplier, issueType, severity, amount } = req.body;

  if (!title || !receiptNo || !invoiceNo || !supplier || !issueType || !severity || amount === undefined) {
    return res.status(400).json({ error: 'All ticket parameters are required.' });
  }

  const year = new Date().getFullYear();
  const timestampStr = Date.now().toString().slice(-4);
  const id = `TKT-${year}-${timestampStr}`;
  const status = 'Open';
  const timestamp = new Date().toLocaleString('en-US', {
    hour12: true,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  db.run(
    'INSERT INTO tickets (id, title, receiptNo, invoiceNo, supplier, issueType, severity, amount, status, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, title, receiptNo, invoiceNo, supplier, issueType, severity, Number(amount), status, timestamp],
    function (err) {
      if (err) {
        console.error('Failed to create ticket:', err.message);
        return res.status(500).json({ error: 'Failed to create ticket.' });
      }
      res.json({ success: true, id, status, timestamp });
    }
  );
});

// Update Ticket (e.g. mark status Resolved)
app.put('/api/tickets/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status value is required.' });
  }

  db.run('UPDATE tickets SET status = ? WHERE id = ?', [status, id], function (err) {
    if (err) {
      console.error('Failed to update ticket:', err.message);
      return res.status(500).json({ error: 'Failed to update ticket.' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }
    res.json({ success: true, id, status });
  });
});

// Fetch All Match Vouchers
app.get('/api/matches', (req, res) => {
  db.all('SELECT * FROM matches ORDER BY timestamp DESC', [], (err, rows) => {
    if (err) {
      console.error('Failed to query matches:', err.message);
      return res.status(500).json({ error: 'Failed to query matches.' });
    }
    res.json(rows);
  });
});

// Create New Match Voucher & Auto-Resolve Ticket
app.post('/api/matches', (req, res) => {
  const { voucher, receiptNo, invoiceNo, supplier, amount, vat } = req.body;

  if (!voucher || !receiptNo || !invoiceNo || !supplier || amount === undefined || vat === undefined) {
    return res.status(400).json({ error: 'All match validation inputs are required.' });
  }

  const timestamp = new Date().toLocaleString('en-US', {
    hour12: true,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  const status = 'Matched';

  db.serialize(() => {
    // 1. Insert Voucher record
    db.run(
      'INSERT INTO matches (voucher, receiptNo, invoiceNo, supplier, amount, vat, timestamp, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [voucher, receiptNo, invoiceNo, supplier, amount, vat, timestamp, status],
      function (err) {
        if (err) {
          console.error('Failed to insert match voucher:', err.message);
          return res.status(500).json({ error: 'Failed to insert match voucher.' });
        }

        // 2. Auto-Resolve corresponding tickets
        db.run(
          "UPDATE tickets SET status = 'Resolved' WHERE receiptNo = ? OR invoiceNo = ?",
          [receiptNo, invoiceNo],
          function (err2) {
            if (err2) {
              console.error('Failed to auto-resolve matching tickets:', err2.message);
            }
            res.json({ success: true, voucher, status });
          }
        );
      }
    );
  });
});

// Serve static assets from React app build
app.use(express.static(path.join(__dirname, 'dist')));

// API Catch-all fallbacks
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API Endpoint not found.' });
});

// React app SPA catch-all
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Alzone ERP SQLite Express server is listening on port ${PORT}`);
});
