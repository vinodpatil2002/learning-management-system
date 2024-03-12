require("dotenv").config();
import jwt from "jsonwebtoken";
import { IUser } from "../models/user.model";
import { NextFunction, Request, Response } from "express";
import { redis } from "./redis";
import { CookieOptions } from "express";

interface ITokenOptions {
    expires: Date;
    maxAge: number;
    httpOnly: boolean;
    sameSite: "lax" | "strict" | "none" | "undefined";
    secure?: boolean;
}

    // parse env variables to integrate with the fallbackvalues
    const accessTokenExpire = parseInt(
        process.env.ACCESS_TOKEN_EXPIRE || "300",
        10
    );
    const refreshTokenExpire = parseInt(
        process.env.REFRESH_TOKEN_EXPIRE || "1200",
        10
    );

    // set the token options
    export const accessTokenOptions: ITokenOptions = {
        expires: new Date(Date.now() + accessTokenExpire * 60 * 60 * 1000),
        maxAge: accessTokenExpire * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "lax",
    };

    export const refreshTokenOptions: ITokenOptions = {
        expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
        maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "lax",
    };


export const sendToken = (user: IUser, statusCode: number, res: Response) => {
    const accessToken = user.signAccessToken();
    const refreshToken = user.signRefreshToken();

    // upload session to redis
    redis.set(user._id, JSON.stringify(user) as any); 


    // only set secure true in production
    if (process.env.NODE_ENV === "production") {
        accessTokenOptions.secure = true;
    }

    res.cookie(
        "access_token",
        accessToken,
        accessTokenOptions as CookieOptions
    );
    res.cookie(
        "refresh_token",
        refreshToken,
        refreshTokenOptions as CookieOptions
    );
    res.status(statusCode).json({
        success: true,
        user,
        accessToken,
    });
};
