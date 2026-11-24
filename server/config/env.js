import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const SERVER_ROOT = path.resolve(__dirname, '..');
export const REPO_ROOT = path.resolve(SERVER_ROOT, '..');

dotenv.config({ path: path.join(REPO_ROOT, '.env') });
dotenv.config({ path: path.join(SERVER_ROOT, '.env'), override: true });

function bool(value) {
  return String(value || '').toLowerCase() === 'true';
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT || 4100),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  dbPath: path.resolve(SERVER_ROOT, process.env.DB_PATH || './data/edupulse.db'),
  uploadsDir: path.join(SERVER_ROOT, 'uploads'),
  seedMediaDir: path.join(SERVER_ROOT, 'uploads', 'seed'),
  cookieName: 'edupulse_session',
  isTest: bool(process.env.EDUPULSE_TEST),
  integrations: {
    livekit: Boolean(process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET),
    razorpay: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    llm: Boolean(process.env.LLM_API_BASE && process.env.LLM_API_KEY),
    smtp: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER),
    s3: Boolean(process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID),
  },
};

export const CLIENT_DIST = path.join(REPO_ROOT, 'client', 'dist');
