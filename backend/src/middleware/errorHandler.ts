import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(err);

  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Conflit de données',
      message: 'Une entrée avec ces données existe déjà.',
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Non trouvé',
      message: 'L\'enregistrement demandé n\'existe pas.',
    });
  }

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  return res.status(500).json({
    error: 'Erreur interne du serveur',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue.',
  });
};
