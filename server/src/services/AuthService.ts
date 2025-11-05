import { User } from '../models/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthUser {
  id: string;
  email: string | null;
}

export class AuthService {
  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify a password against a hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate a JWT token for a user
   */
  static generateToken(user: AuthUser): string {
    const payload = { id: user.id, email: user.email };
    const secret = JWT_SECRET as string;
    const options = { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions;
    return jwt.sign(payload, secret, options);
  }

  /**
   * Verify and decode a JWT token
   */
  static verifyToken(token: string): AuthUser | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Register a new user with email and password
   * If user already exists as anonymous, link the email/password to that account
   */
  static async register(
    email: string,
    password: string,
    existingUserId?: string
  ): Promise<{ user: User; token: string }> {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Validate password strength
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Check if email already exists
    const existingUserByEmail = await User.findOne({ where: { email } });
    if (existingUserByEmail && existingUserByEmail.id !== existingUserId) {
      throw new Error('Email already registered');
    }

    const passwordHash = await this.hashPassword(password);

    let user: User;

    if (existingUserId) {
      // Link email/password to existing anonymous account
      const existingUser = await User.findByPk(existingUserId);
      if (!existingUser) {
        throw new Error('User not found');
      }
      if (existingUser.email) {
        throw new Error('User already has an email registered');
      }
      existingUser.email = email;
      existingUser.password_hash = passwordHash;
      await existingUser.save();
      user = existingUser;
    } else {
      // Create new user
      user = await User.create({
        id: uuidv4(),
        email,
        password_hash: passwordHash,
      });
    }

    const token = this.generateToken({ id: user.id, email: user.email });

    return { user, token };
  }

  /**
   * Login with email and password
   */
  static async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const user = await User.findOne({ where: { email } });
    if (!user || !user.password_hash) {
      throw new Error('Invalid email or password');
    }

    const isValid = await this.verifyPassword(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    const token = this.generateToken({ id: user.id, email: user.email });

    return { user, token };
  }
}

