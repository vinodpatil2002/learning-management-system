import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/user.model";
import errorHandler from "../utils/errorHandler";
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import jwt, { Secret } from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
require("dotenv").config();
//  register user

interface IRegistrationBody {
    name: string;
    email: string;
    password: string;
    avatar?: string;
}

export const registerUser = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { name, email, password }: IRegistrationBody = req.body;
            const isEmailExist = await userModel.findOne({ email });
            if (isEmailExist) {
                return next(new errorHandler("Email already exists", 400));
            }
            const user: IRegistrationBody = {
                name,
                email,
                password,
            };
            const activationToken = createActivationToken(user);

            const activationCode = activationToken.activationCode;
            const data = { user: { name: user.name }, activationCode };
            const html = ejs.renderFile(
                path.join(__dirname, "../mails/activation-mail.ejs"),
                data
            );

            try {
                await sendMail({
                    email: user.email,
                    subject: "Activate your account",
                    template: "activation-mail.ejs",
                    data,
                });
                res.status(201).json({
                    success: true,
                    message: `Please check mail sent at  ${user.email} to activate your account!`,
                    activationToken: activationToken.token,
                });
            } catch (error: any) {
                return next(new errorHandler(error.message, 400));
            }
        } catch (error: any) {
            return next(new errorHandler(error.message, 400));
        }
    }
);
interface IActivationToken {
    token: string;
    activationCode: string;
}

export const createActivationToken = (user: any): IActivationToken => {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const token = jwt.sign(
        { user, activationCode },
        process.env.ACTIVATION_SECRET as Secret,
        {
            expiresIn: "5m",
        }
    );
    return { token, activationCode };
};

// activate user

interface IActivationRequest {
    activation_token: string;
    activation_code: string;
}

export const activateUser = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { activation_token, activation_code }: IActivationRequest =
                req.body;
            const newUser: { user: IUser; activationCode: string } = jwt.verify(
                activation_token,
                process.env.ACTIVATION_SECRET as Secret
            ) as { user: IUser; activationCode: string };
            if (newUser.activationCode !== activation_code) {
                return next(new errorHandler("Invalid activation code", 400));
            }
            const { name, email, password } = newUser.user;
            const existUser = await userModel.findOne({ email });
            if (existUser) {
                return next(new errorHandler("User already exists", 400));
            }
            const user = await userModel.create({ name, email, password });
            res.status(201).json({
                success: true,
                message: "Account has been activated successfully",
            });
        } catch (error: any) {
            return next(new errorHandler(error.message, 400));
        }
    }
);
