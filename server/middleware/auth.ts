import { Request, Response, NextFunction } from "express";
import { catchAsyncError } from "./catchAsyncErrors";
import errorHandler from "../utils/errorHandler";
import jwt from "jsonwebtoken";
import { redis } from "../utils/redis";
import { JwtPayload } from "jsonwebtoken";
import { IUser } from "../models/user.model";

// authenticated user
export const isAuthenticated = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        const access_token = req.cookies.access_token;
        if (!access_token) {
            return next(
                new errorHandler("Login first to access this resource", 401)
            );
        }

        const decoded = jwt.verify(
            access_token,
            process.env.ACCESS_TOKEN as string
        ) as JwtPayload;
        if (!decoded) {
            return next(new errorHandler("Access token is not valid", 401));
        }
        const user = await redis.get(decoded.id);
        if (!user) {
            return next(new errorHandler("User not found", 404));
        }
        // console.log(typeof user); // Log the type of user
        req.user = JSON.parse(user) as IUser; // Assign user to req.user

        next();
    }
);

// validate user roles

export const authorizeRoles = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!roles.includes(req.user?.role)) {
            return next(
                new errorHandler(`Role (${req.user?.role}) is not allowed to access this resource`,403));
        }
        next();
    };
};
