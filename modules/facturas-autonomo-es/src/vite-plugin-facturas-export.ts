import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin, ViteDevServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface ExportInvoicePayload {
  year: number;
  month: number;
  invoiceNumber: number;
  formats: ('png' | 'pdf')[];
  files: { format: 'png' | 'pdf'; dataBase64: string }[];
}

export interface ExportInvoiceResult {
  ok: true;
  monthFolder: string;
  monthFolderPath: string;
  createdMonthFolder: boolean;
  saved: { format: string; fileName: string; fullPath: string }[];
  skipped: { format: string; fileName: string; reason: string }[];
}

const DEFAULT_RELATIVE = path.join(
  'Library',
  'CloudStorage',
  'GoogleDrive-lucasmazalan@gmail.com',
  'My Drive',
  'Europa',
  'My Europa Life',
  'Lucas Mazalán Suárez - Documentos y Facturas',
  'Facturas',
);

function resolveExportBase(moduleRoot: string): string {
  const configPath = path.join(moduleRoot, 'assets/local/export-config.json');
  if (fs.existsSync(configPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8')) as { exportBasePath?: string };
      if (cfg.exportBasePath?.trim()) {
        return cfg.exportBasePath.trim();
      }
    } catch {
      /* fallback below */
    }
  }
  const home = process.env.HOME || '';
  return path.join(home, ...DEFAULT_RELATIVE.split('/'));
}

function monthFolderName(year: number, month: number): string {
  const MONTHS = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE',
  ];
  const mm = String(month).padStart(2, '0');
  return `${year} ${mm} - ${MONTHS[month - 1]}`;
}

function invoiceFileBaseName(year: number, month: number, invoiceNumber: number): string {
  const mm = String(month).padStart(2, '0');
  const num = String(invoiceNumber).padStart(2, '0');
  return `${year} ${mm} - Factura ${num}`;
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function handleExportApi(moduleRoot: string) {
  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    if (req.method === 'GET' && req.url === '/api/export-config') {
      const exportBasePath = resolveExportBase(moduleRoot);
      const exists = fs.existsSync(exportBasePath);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ exportBasePath, exists }));
      return;
    }

    if (req.method === 'GET' && req.url?.startsWith('/api/list-month-folders')) {
      const exportBasePath = resolveExportBase(moduleRoot);
      let folders: string[] = [];
      if (fs.existsSync(exportBasePath)) {
        folders = fs.readdirSync(exportBasePath, { withFileTypes: true })
          .filter((d: fs.Dirent) => d.isDirectory())
          .map((d: fs.Dirent) => d.name)
          .sort();
      }
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ folders }));
      return;
    }

    if (req.method !== 'POST' || req.url !== '/api/export-invoice') {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }

    try {
      const body = (await readJsonBody(req)) as ExportInvoicePayload;
      const { year, month, invoiceNumber, files } = body;

      if (!year || !month || !invoiceNumber || !files?.length) {
        res.statusCode = 400;
        res.end(JSON.stringify({ ok: false, error: 'Datos incompletos' }));
        return;
      }

      const exportBasePath = resolveExportBase(moduleRoot);
      if (!fs.existsSync(exportBasePath)) {
        res.statusCode = 400;
        res.end(
          JSON.stringify({
            ok: false,
            error: `No existe la carpeta Facturas: ${exportBasePath}`,
          }),
        );
        return;
      }

      const folderName = monthFolderName(year, month);
      const monthFolderPath = path.join(exportBasePath, folderName);
      let createdMonthFolder = false;

      if (!fs.existsSync(monthFolderPath)) {
        fs.mkdirSync(monthFolderPath, { recursive: false });
        createdMonthFolder = true;
      }

      const baseName = invoiceFileBaseName(year, month, invoiceNumber);
      const saved: ExportInvoiceResult['saved'] = [];
      const skipped: ExportInvoiceResult['skipped'] = [];

      for (const file of files) {
        const ext = file.format === 'pdf' ? 'pdf' : 'png';
        const fileName = `${baseName}.${ext}`;
        const fullPath = path.join(monthFolderPath, fileName);

        if (fs.existsSync(fullPath)) {
          skipped.push({
            format: file.format,
            fileName,
            reason: 'Ya existe (no se sobrescribió)',
          });
          continue;
        }

        const buffer = Buffer.from(file.dataBase64, 'base64');
        fs.writeFileSync(fullPath, buffer);
        saved.push({ format: file.format, fileName, fullPath });
      }

      const result: ExportInvoiceResult = {
        ok: true,
        monthFolder: folderName,
        monthFolderPath,
        createdMonthFolder,
        saved,
        skipped,
      };

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result));
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ ok: false, error: String(err) }));
    }
  };
}

export function facturasExportPlugin(): Plugin {
  const moduleRoot = path.resolve(__dirname, '..');

  return {
    name: 'facturas-export-api',
    configureServer(server: ViteDevServer) {
      const handler = handleExportApi(moduleRoot);
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/api/export') || req.url?.startsWith('/api/list-month')) {
          void handler(req, res);
          return;
        }
        next();
      });
    },
  };
}
