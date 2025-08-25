import "express";

declare global {
  namespace Express {
    interface User {
      _id: string; // Adjust to your actual user object type
      email?: string;
      role?: string;
    }

    interface Request {
      user?: User; // user is optional
    }
  }
}
