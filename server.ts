import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data_store.json');
const SEED_FILE = path.join(__dirname, 'src', 'data', 'initialData.json');

// Support large payload for base64 scanned images / PDFs
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Helper to load db
function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.employees)) {
        return parsed;
      }
    }
    // Fallback to seed file ONLY if DB_FILE is missing
    if (fs.existsSync(SEED_FILE)) {
      const seedData = fs.readFileSync(SEED_FILE, 'utf-8');
      const parsed = JSON.parse(seedData);
      if (parsed && Array.isArray(parsed.employees)) {
        saveDb(parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to read db file:', err);
  }
  const initial = {
    employees: [],
    settings: {
      companyName: 'CÔNG TY TNHH MTV NHIÊN LIỆU HÀNG KHÔNG VIỆT NAM (SKYPEC)',
      brandShortName: 'SKYPEC',
      systemTitle: 'HỆ THỐNG QUẢN LÝ LÝ LỊCH VÀ MÃ QR NHÂN VIÊN HÀNG KHÔNG',
      logoUrl: '/skypec-logo.svg',
      qrDomain: 'https://hoso.skypec.vn',
      certWarningDays: 60,
      maskIdCardPublic: false,
      enablePublicQrScan: true,
      requireTokenParam: true,
      lastUpdated: new Date().toISOString(),
    },
    qrLogs: [],
    auditLogs: [],
  };
  saveDb(initial);
  return initial;
}

// Helper to save db
function saveDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write db file:', err);
  }
}

// API Routes
app.get('/api/employees', (req: Request, res: Response) => {
  const db = loadDb();
  res.json({ success: true, employees: db.employees || [] });
});

app.post('/api/employees', (req: Request, res: Response) => {
  const { employees } = req.body;
  if (Array.isArray(employees)) {
    const db = loadDb();
    db.employees = employees;
    saveDb(db);
    return res.json({ success: true, count: employees.length });
  }
  res.status(400).json({ error: 'Invalid employees array' });
});

app.get('/api/employee-by-token/:token', (req: Request, res: Response) => {
  const token = (req.params.token || '').trim().toUpperCase();
  const db = loadDb();
  const found = (db.employees || []).find(
    (e: any) => (e.publicToken || '').trim().toUpperCase() === token
  );
  if (found) {
    return res.json({ success: true, employee: found, settings: db.settings });
  }
  res.status(404).json({ error: 'Employee not found' });
});

app.post('/api/employee', (req: Request, res: Response) => {
  const newEmp = req.body;
  if (!newEmp || !newEmp.id) {
    return res.status(400).json({ error: 'Missing employee data' });
  }
  const db = loadDb();
  const emps = db.employees || [];
  const idx = emps.findIndex((e: any) => e.id === newEmp.id);
  if (idx >= 0) {
    emps[idx] = newEmp;
  } else {
    emps.unshift(newEmp);
  }
  db.employees = emps;
  saveDb(db);
  res.json({ success: true, employee: newEmp });
});

app.delete('/api/employee/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = loadDb();
  const emps = (db.employees || []).filter((e: any) => e.id !== id);
  db.employees = emps;
  saveDb(db);
  res.json({ success: true, remaining: emps.length });
});

app.post('/api/employees/delete-batch', (req: Request, res: Response) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) {
    return res.status(400).json({ error: 'ids array required' });
  }
  const idSet = new Set(ids);
  const db = loadDb();
  const emps = (db.employees || []).filter((e: any) => !idSet.has(e.id));
  db.employees = emps;
  saveDb(db);
  res.json({ success: true, remaining: emps.length });
});

app.post('/api/employees/delete-all', (_req: Request, res: Response) => {
  const db = loadDb();
  db.employees = [];
  saveDb(db);
  res.json({ success: true, remaining: 0 });
});

// Update or add certificate for a specific employee
app.post('/api/employee/:id/certificate', (req: Request, res: Response) => {
  const { id } = req.params;
  const cert = req.body;
  const db = loadDb();
  const emps = db.employees || [];
  const emp = emps.find((e: any) => e.id === id);
  if (!emp) {
    return res.status(404).json({ error: 'Employee not found' });
  }
  if (!emp.trainingRecords) emp.trainingRecords = [];
  const existingIdx = emp.trainingRecords.findIndex((c: any) => c.id === cert.id);
  if (existingIdx >= 0) {
    emp.trainingRecords[existingIdx] = cert;
  } else {
    emp.trainingRecords.push(cert);
  }
  emp.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json({ success: true, employee: emp });
});

// Delete certificate for a specific employee
app.delete('/api/employee/:id/certificate/:certId', (req: Request, res: Response) => {
  const { id, certId } = req.params;
  const db = loadDb();
  const emps = db.employees || [];
  const emp = emps.find((e: any) => e.id === id);
  if (!emp) {
    return res.status(404).json({ error: 'Employee not found' });
  }
  emp.trainingRecords = (emp.trainingRecords || []).filter((c: any) => c.id !== certId);
  emp.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json({ success: true, employee: emp });
});

// Settings API
app.get('/api/settings', (req: Request, res: Response) => {
  const db = loadDb();
  res.json({ success: true, settings: db.settings });
});

app.post('/api/settings', (req: Request, res: Response) => {
  const { settings } = req.body;
  const db = loadDb();
  db.settings = settings;
  saveDb(db);
  res.json({ success: true, settings });
});

// Unified Sync API for all devices / computers
app.get('/api/sync', (req: Request, res: Response) => {
  const db = loadDb();
  res.json({
    success: true,
    employees: db.employees || [],
    settings: db.settings,
    auditLogs: db.auditLogs || [],
    qrLogs: db.qrLogs || [],
  });
});

// Audit Logs API
app.get('/api/audit-logs', (req: Request, res: Response) => {
  const db = loadDb();
  res.json({ success: true, auditLogs: db.auditLogs || [] });
});

app.post('/api/audit-log', (req: Request, res: Response) => {
  const log = req.body;
  if (!log) return res.status(400).json({ error: 'Missing log payload' });
  const db = loadDb();
  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift(log);
  if (db.auditLogs.length > 500) db.auditLogs.pop();
  saveDb(db);
  res.json({ success: true });
});

// QR access logger
app.get('/api/qr-logs', (req: Request, res: Response) => {
  const db = loadDb();
  res.json({ success: true, qrLogs: db.qrLogs || [] });
});

app.post('/api/qr-log', (req: Request, res: Response) => {
  const log = req.body;
  const db = loadDb();
  if (!db.qrLogs) db.qrLogs = [];
  db.qrLogs.unshift(log);
  if (db.qrLogs.length > 500) db.qrLogs.pop();
  saveDb(db);
  res.json({ success: true });
});

// Start Vite middleware in dev or static in prod
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`SKYPEC Aviation Profile Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
