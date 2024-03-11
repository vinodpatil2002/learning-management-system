import errorHandler from "../utils/errorHandler";
import { NextFunction, Request, Response } from "express";

export const ErrorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  // wrong mongodb id
  if (err.name === "CastError") {
    const message = `Resource not found. Invalid: ${err.path}`;
    err = new errorHandler(message, 404);
  }

  // duplicate key
  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
    err = new errorHandler(message, 400);
  }

  // wrong jwt token
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid token. Please login again";
    err = new errorHandler(message, 401);
  }

  // token expired

  if (err.name === "TokenExpiredError") {
    const message = "Token expired. Please login again";
    err = new errorHandler(message, 401);
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};
