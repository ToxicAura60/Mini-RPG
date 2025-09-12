import type { Request, Response, NextFunction } from "express";
import { validationResult, type FieldValidationError } from "express-validator";

// aman
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => {
      const e = err as FieldValidationError;
      return {
        field: e.path,
        message: e.msg,
      };
    });
    return res.status(422).json({ 
      success: false,
      errors: formattedErrors 
    });
  }
  next();
};
