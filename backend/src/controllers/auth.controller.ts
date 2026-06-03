import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email et mot de passe requis', 400);
    }

    const user = await prisma.utilisateur.findUnique({ where: { email } });
    if (!user || !user.actif) {
      throw new AppError('Identifiants invalides', 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new AppError('Identifiants invalides', 401);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
    );

    res.json({
      token,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.utilisateur.findUnique({
      where: { id: req.user!.id },
      select: { id: true, nom: true, prenom: true, email: true, role: true, createdAt: true },
    });

    if (!user) throw new AppError('Utilisateur non trouvé', 404);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nom, prenom, email, password, role } = req.body;

    const exists = await prisma.utilisateur.findUnique({ where: { email } });
    if (exists) throw new AppError('Email déjà utilisé', 409);

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.utilisateur.create({
      data: { nom, prenom, email, password: hashedPassword, role: role || 'OPERATEUR' },
      select: { id: true, nom: true, prenom: true, email: true, role: true },
    });

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const utilisateurs = await prisma.utilisateur.findMany({
      select: { id: true, nom: true, prenom: true, email: true, role: true, actif: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ utilisateurs });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { nom, email, role, password } = req.body;

    const data: Record<string, unknown> = { nom, email, role };
    if (password) data.password = await bcrypt.hash(password, 12);

    const user = await prisma.utilisateur.update({
      where: { id: Number(id) },
      data,
      select: { id: true, nom: true, email: true, role: true },
    });
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.utilisateur.update({ where: { id: Number(id) }, data: { actif: false } });
    res.json({ message: 'Utilisateur désactivé' });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.utilisateur.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new AppError('Utilisateur non trouvé', 404);

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new AppError('Mot de passe actuel incorrect', 400);

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.utilisateur.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    next(error);
  }
};
