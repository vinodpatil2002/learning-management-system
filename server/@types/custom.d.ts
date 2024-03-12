import { Request } from "express";
import { IUser } from "../models/user.model";

declare global {
    namespace Express {
        interface Request {
            user?: IUser; // Assuming 'IUser' is the correct type for your user object
        }
    }
}
