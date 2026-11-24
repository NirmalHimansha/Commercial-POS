import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { verifyJwt } from 'fastify/jwt';
import { UserRole } from '../types';

export interface AuthRequest extends FastifyRequest {
  user?: {
    id: number;
    email: string;
    role: UserRole;
  };
}

/**
 * Middleware to require authentication
 */
export async function authenticate(request: AuthRequest, reply: FastifyReply) {
  try {
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) {
      return reply.status(401).send({ error: 'Authentication token required' });
    }

    const payload = await request.jwtVerify<{ id: number; email: string; role: UserRole }>(token);
    request.user = payload;
  } catch (error) {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware to require specific roles
 */
export function authorize(...roles: UserRole[]) {
  return async (request: AuthRequest, reply: FastifyReply) => {
    await authenticate(request, reply);

    if (request.user && !roles.includes(request.user.role)) {
      return reply.status(403).send({ error: 'Insufficient permissions' });
    }
  };
}

/**
 * Role-based access constants
 */
export const OwnerOnly = authorize(UserRole.OWNER);
export const ManagerOrOwner = authorize(UserRole.MANAGER, UserRole.OWNER);
export const CashierOrAbove = authorize(UserRole.CASHIER, UserRole.MANAGER, UserRole.OWNER);

/**
 * Check if user has manager or owner role
 */
export function isManagerOrOwner(role: UserRole): boolean {
  return role === UserRole.MANAGER || role === UserRole.OWNER;
}

/**
 * Check if user is owner
 */
export function isOwner(role: UserRole): boolean {
  return role === UserRole.OWNER;
}