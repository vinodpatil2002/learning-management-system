import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ErrorMiddleware } from "./middleware/error";
import userRouter from "./routes/user.route";
import courseRouter from "./routes/course.route";
require("dotenv").config();
export const app = express();

// body-parser
app.use(express.json({ limit: "50mb" }));

// cookie-parser
app.use(cookieParser());

// cors cross origin resource sharing
app.use(
    cors({
        origin: process.env.ORIGIN,
    })
);

// routes

app.use("/api/v1/", userRouter);
app.use("/api/v1/", courseRouter);

// testing api

app.get("/test", (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({ message: "Hello World" });
});

// unknown routes
app.use("*", (req: Request, res: Response, next: NextFunction) => {
    res.status(404).json({ message: "Route not found" });
});

app.use(ErrorMiddleware);
