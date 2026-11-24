import { FastifyInstance } from 'fastify';
import { AuthService } from '../services/auth.service';
import { authenticate } from '../middleware/auth';
import { loginSchema, setPinSchema } from '../validation/auth';

export async function authRoutes(app: FastifyInstance) {
  const authService = new AuthService(app);

  // Login with email/password
  app.post('/login', async (request, reply) => {
    try {
      const { email, password } = loginSchema.parse(await request.body);
      const result = await authService.login(email, password);
      return result;
    } catch (error) {
      return reply.status(401).send({ error: error instanceof Error ? error.message : 'Login failed' });
    }
  });

  // Login with PIN (after initial authentication)
  app.post('/login/pin', { onRequest: [authenticate] }, async (request, reply) => {
    try {
      const { pin } = setPinSchema.parse(await request.body);
      const userId = request.user!.id;
      const result = await authService.loginWithPin(userId, pin);
      return result;
    } catch (error) {
      return reply.status(401).send({ error: error instanceof Error ? error.message : 'Invalid PIN' });
    }
  });

  // Set user PIN
  app.post('/me/pin', { onRequest: [authenticate] }, async (request, reply) => {
    try {
      const { pin } = setPinSchema.parse(await request.body);
      const userId = request.user!.id;
      await authService.setPin(userId, pin);
      return { message: 'PIN set successfully' };
    } catch (error) {
      return reply.status(400).send({ error: error instanceof Error ? error.message : 'Failed to set PIN' });
    }
  });

  // Get current user info
  app.get('/me', { onRequest: [authenticate] }, async (request, reply) => {
    return {
      id: request.user!.id,
      email: request.user!.email,
      role: request.user!.role,
    };
  });
}