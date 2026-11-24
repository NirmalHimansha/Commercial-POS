import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '../types';

// JWT payload interface
export interface JwtPayload {
  id: number;
  email: string;
  role: UserRole;
}

// Extend FastifyJWT payload type and user type
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
  }

  interface FastifyRequest {
    user: JwtPayload;
  }
}

/**
 * Middleware to require authentication
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) {
      return reply.status(401).send({ error: 'Authentication token required' });
    }

    const payload = await request.jwtVerify<JwtPayload>();
    request.user = payload;
  } catch (error) {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware to require specific roles
 */
export function authorize(...roles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply);

    if (!request.user || !roles.includes(request.user.role)) {
      return reply.status(403).send({ error: 'Insufficient permissions' });
    }
  };
}

/**
 * Role-based access middleware
 */
export const OwnerOnly = authorize(UserRole.OWNER);
export const ManagerOrOwner = authorize(UserRole.MANAGER, UserRole.OWNER);
export const CashierOrAbove = authorize(UserRole.CASHIER, UserRole.MANAGER, UserRole.OWNER);

/**
 * Alias for OwnerOnly middleware (backward compatibility)
 */
export const isOwner = OwnerOnly;

/**
 * Alias for ManagerOrOwner middleware (backward compatibility)
 */
export const isManagerOrOwner = ManagerOrOwner;

/**
 * Check if role has manager or owner privileges
 */
export function hasManagerOrOwnerRole(role: UserRole): boolean {
  return role === UserRole.MANAGER || role === UserRole.OWNER;
}

/**
 * Check if user is owner
 */
export function isOwnerRole(role: UserRole): boolean {
  return role === UserRole.OWNER;
}