import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
require('dotenv').config();
export const app = express();

// body-parser
app.use(express.json({limit: '50mb'}));

// cookie-parser
app.use(cookieParser());

// cors cross origin resource sharing
app.use(cors({
    origin: process.env.ORIGIN,
}));

// testing api

app.get('/test', (req:Request, res:Response,next:NextFunction) => {
    res.status(200).json({message: 'Hello World'});
});

// unknown routes
app.use('*', (req:Request, res:Response, next:NextFunction) => {
    res.status(404).json({message: 'Route not found'});
});
