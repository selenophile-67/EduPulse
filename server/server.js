import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import fs from 'node:fs';
import path from 'node:path';
import swaggerUi from 'swagger-ui-express';
import { env, CLIENT_DIST } from './config/env.js';
import './config/db.js';
import { originGuard } from './middleware/auth.js';
import { notFound, errorHandler } from './middleware/error.js';
import { openapi } from './docs/openapi.js';

import authRoutes from './routes/auth.routes.js';
import coursesRoutes, { enrollmentRouter, bookmarkRouter } from './routes/courses.routes.js';
import learningRoutes from './routes/learning.routes.js';
import materialsRoutes from './routes/materials.routes.js';
import testsRoutes from './routes/tests.routes.js';
import liveClassesRoutes from './routes/liveClasses.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import searchRoutes from './routes/search.routes.js';
import contentRoutes from './routes/content.routes.js';
import teacherRoutes from './routes/teacher.routes.js';
import adminRoutes from './routes/admin.routes.js';
import mediaRoutes from './routes/media.routes.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin === env.clientOrigin) return callback(null, true);
      try {
        const parsed = new URL(origin);
        if (parsed.host === `localhost:${env.port}`) return callback(null, true);
        if (!env.isProd && /^(localhost|127\.0\.0\.1)$/.test(parsed.hostname)) return callback(null, true);
      } catch {
        /* ignore */
      }
      return callback(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(originGuard);
if (!env.isTest) app.use(morgan(env.isProd ? 'combined' : 'dev'));

app.get('/api/health', (_req, res) => res.json({ data: { status: 'ok', time: new Date().toISOString() } }));
app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/enrollments', enrollmentRouter);
app.use('/api/bookmarks', bookmarkRouter);
app.use('/api/learning', learningRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/tests', testsRoutes);
app.use('/api/live-classes', liveClassesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/media', mediaRoutes);
app.get('/api/openapi.json', (_req, res) => res.json(openapi));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi, { customSiteTitle: 'EduPulse API' }));

if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST, { index: false, maxAge: '1h' }));
  app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(CLIENT_DIST, 'index.html')));
}

app.use(notFound);
app.use(errorHandler);

if (!env.isTest) {
  app.listen(env.port, () => {
    console.log(`EduPulse API listening on http://localhost:${env.port}`);
    console.log(`API docs: http://localhost:${env.port}/api/docs`);
    console.log(`Integrations: ${JSON.stringify(env.integrations)}`);
  });
}

export default app;
