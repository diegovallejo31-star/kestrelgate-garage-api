import express, { type Express } from 'express';
import type { Database } from './db/client';
import { apiKeyAuth } from './middleware/apiKeyAuth';
import { auditLog } from './middleware/auditLog';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { rateLimit } from './middleware/rateLimit';
import { requestLogger } from './middleware/requestLogger';
import { createApiKeyRouter } from './modules/apikeys/apiKey.routes';
import { createAuditRouter } from './modules/audit/audit.routes';
import { createAuthRouter } from './modules/auth/auth.routes';
import {
  createBookingRouter,
  createVehicleBookingRouter,
} from './modules/bookings/booking.routes';
import { createCustomerRouter } from './modules/customers/customer.routes';
import {
  createFitmentRouter,
  createJobFitmentRouter,
} from './modules/fitments/fitment.routes';
import { createBookingJobRouter, createJobRouter } from './modules/jobs/job.routes';
import {
  createMotTestRouter,
  createVehicleMotTestRouter,
} from './modules/mots/motTest.routes';
import { createPartRouter } from './modules/parts/part.routes';
import { createSiteRouter } from './modules/sites/site.routes';
import {
  createSiteTechnicianRouter,
  createTechnicianRouter,
} from './modules/technicians/technician.routes';
import {
  createCustomerVehicleRouter,
  createVehicleRouter,
} from './modules/vehicles/vehicle.routes';

export function createApp(db: Database): Express {
  const app = express();
  app.use(express.json());
  app.use(requestLogger);
  app.use(rateLimit(db));
  app.use(auditLog(db));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  const { router: authRouter } = createAuthRouter(db);
  app.use('/auth', authRouter);

  const requireApiKey = apiKeyAuth(db);
  app.use('/api-keys', requireApiKey, createApiKeyRouter(db));
  app.use('/audit', requireApiKey, createAuditRouter(db));
  app.use('/sites', requireApiKey, createSiteRouter(db));
  app.use('/sites', requireApiKey, createSiteTechnicianRouter(db));
  app.use('/technicians', requireApiKey, createTechnicianRouter(db));
  app.use('/customers', requireApiKey, createCustomerRouter(db));
  app.use('/customers', requireApiKey, createCustomerVehicleRouter(db));
  app.use('/vehicles', requireApiKey, createVehicleRouter(db));
  app.use('/parts', requireApiKey, createPartRouter(db));
  app.use('/vehicles', requireApiKey, createVehicleBookingRouter(db));
  app.use('/bookings', requireApiKey, createBookingRouter(db));
  app.use('/bookings', requireApiKey, createBookingJobRouter(db));
  app.use('/jobs', requireApiKey, createJobRouter(db));
  app.use('/jobs', requireApiKey, createJobFitmentRouter(db));
  app.use('/fitments', requireApiKey, createFitmentRouter(db));
  app.use('/vehicles', requireApiKey, createVehicleMotTestRouter(db));
  app.use('/mot-tests', requireApiKey, createMotTestRouter(db));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
