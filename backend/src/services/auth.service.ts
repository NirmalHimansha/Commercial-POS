import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { prisma } from '../utils/prisma';
import { UserRole, LoginResponse } from '../types';

export class AuthService {
  constructor(private app: FastifyInstance) {}

  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const token = this.app.jwt.sign(
      { id: user.id, email: user.email, role: user.role as UserRole },
      { expiresIn: '8h' }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as UserRole,
      },
    };
  }

  async loginWithPin(userId: number, pin: string): Promise<LoginResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.pin) {
      throw new Error('Invalid PIN');
    }

    const isValid = await bcrypt.compare(pin, user.pin);
    if (!isValid) {
      throw new Error('Invalid PIN');
    }

    const token = this.app.jwt.sign(
      { id: user.id, email: user.email, role: user.role as UserRole },
      { expiresIn: '8h' }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as UserRole,
      },
    };
  }

  async setPin(userId: number, pin: string): Promise<void> {
    const saltRounds = 12;
    const pinHash = await bcrypt.hash(pin, saltRounds);

    await prisma.user.update({
      where: { id: userId },
      data: { pin: pinHash },
    });
  }

  async verifyPin(userId: number, pin: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.pin) {
      return false;
    }

    return bcrypt.compare(pin, user.pin);
  }
}