import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/user.model";
import errorHandler from "../utils/errorHandler";
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import cloudinary from "cloudinary";
import {
    accessTokenOptions,
    refreshTokenOptions,
    sendToken,
} from "../utils/jwt";
import { redis } from "../utils/redis";
import { getUserById } from "../services/user.services";
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

//  login user

interface ILoginRequest {
    email: string;
    password: string;
}

export const loginUser = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password }: ILoginRequest = req.body;
            if (!email || !password) {
                return next(
                    new errorHandler("Please enter email and password", 400)
                );
            }
            const user = await userModel.findOne({ email }).select("+password");
            if (!user) {
                return next(new errorHandler("Invalid email or password", 400));
            }
            const isPasswordMatch = await user.comparePassword(password);
            if (!isPasswordMatch) {
                return next(new errorHandler("Invalid email or password", 400));
            }
            sendToken(user, 200, res);
        } catch (error: any) {
            return next(new errorHandler(error.message, 400));
        }
    }
);

//  logout user

export const logoutUser = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            res.cookie("access_token", "", {
                maxAge: 1,
            });
            res.cookie("refresh_token", "", {
                maxAge: 1,
            });
            const userId = req.user?._id || "";
            redis.del(userId);
            res.status(200).json({
                success: true,
                message: "Logged out successfully",
            });
        } catch (error: any) {
            return next(new errorHandler(error.message, 400));
        }
    }
);

// update access token

export const updateAccessToken = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const refresh_token = req.cookies.refresh_token;
            if (!refresh_token) {
                return next(
                    new errorHandler(
                        "Please login to access this resource",
                        401
                    )
                );
            }
            const decoded = jwt.verify(
                refresh_token,
                process.env.REFRESH_TOKEN as Secret
            ) as JwtPayload;
            const message = "Could not update access token";
            if (!decoded) {
                return next(new errorHandler("User not found", 404));
            }
            const session = await redis.get(decoded.id as string);
            if (!session) {
                return next(new errorHandler(message, 404));
            }
            const user = JSON.parse(session);
            const accessToken = jwt.sign(
                { id: user._id },
                process.env.ACCESS_TOKEN as string,
                {
                    expiresIn: "5m",
                }
            );
            const refreshToken = jwt.sign(
                { id: user._id },
                process.env.REFRESH_TOKEN as string,
                {
                    expiresIn: "7d",
                }
            );

            req.user = user;

            res.cookie("access_token", accessToken, accessTokenOptions as any);
            res.cookie(
                "refresh_token",
                refreshToken,
                refreshTokenOptions as any
            );
            res.status(200).json({
                success: true,
                accessToken,
            });
        } catch (error: any) {
            return next(new errorHandler(error.message, 400));
        }
    }
);

// get user details
export const getUserInfo = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?._id;
            getUserById(userId, res);
        } catch (error: any) {
            return next(new errorHandler(error.message, 400));
        }
    }
);

interface ISocialAuthBody {
    name: string;
    email: string;
    avatar: string;
}

// social auth
export const socialAuth = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { name, email, avatar } = req.body as ISocialAuthBody;
            const user = await userModel.findOne({ email });
            if (!user) {
                const newUser = await userModel.create({ name, email, avatar });
                sendToken(newUser, 200, res);
            } else {
                sendToken(user, 200, res);
            }
        } catch (error: any) {
            return next(new errorHandler(error.message, 400));
        }
    }
);

// update user info

interface IUpdateUserInfo {
    name?: string;
    email?: string;
}

export const updateUserInfo = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { name, email }: IUpdateUserInfo = req.body;
            const userId = req.user?._id;
            const user = await userModel.findById(userId);
            if (email && user) {
                const isEmailExist = await userModel.findOne({ email });
                if (isEmailExist) {
                    return next(new errorHandler("Email already exists", 400));
                }
                user.email = email;
            }
            if (name && user) {
                user.name = name;
            }
            await user?.save();
            await redis.set(userId, JSON.stringify(user));
            res.status(200).json({
                success: true,
                message: "User updated successfully",
                user,
            });
        } catch (error: any) {
            return next(new errorHandler(error.message, 400));
        }
    }
);

// update user password

interface IUpdatePassword {
    oldPassword: string;
    newPassword: string;
}

export const updatePassword = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { oldPassword, newPassword }: IUpdatePassword = req.body;
            if (!oldPassword || !newPassword) {
                return next(
                    new errorHandler("Please enter old and new password", 400)
                );
            }
            const user = await userModel
                .findById(req.user?._id)
                .select("+password");
            if (user?.password === undefined) {
                return next(new errorHandler("User not found", 404));
            }
            const isPasswordMatch = await user?.comparePassword(oldPassword);
            if (!isPasswordMatch) {
                return next(new errorHandler("Invalid old password", 400));
            }
            user.password = newPassword;
            await user?.save();
            await redis.set(user?._id, JSON.stringify(user));

            res.status(200).json({
                success: true,
                message: "Password updated successfully",
                user,
            });
        } catch (error: any) {
            return next(new errorHandler(error.message, 400));
        }
    }
);

// update prpfile picture
interface IUpdateProfilePicture {
    avatar: string;
}

export const updateProfilePicture = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { avatar } = req.body;

            const userId = req.user?._id;

            const user = await userModel.findById(userId);

            if (avatar && user) {
                if (user?.avatar?.public_id) {
                    await cloudinary.v2.uploader.destroy(
                        user?.avatar?.public_id
                    );

                    const myCloud = await cloudinary.v2.uploader.upload(
                        avatar,
                        {
                            folder: "avatars",
                            width: 150,
                        }
                    );
                    user.avatar = {
                        public_id: myCloud.public_id,
                        url: myCloud.secure_url,
                    };
                } else {
                    const myCloud = await cloudinary.v2.uploader.upload(
                        avatar,
                        {
                            folder: "avatars",
                            width: 150,
                        }
                    );

                    user.avatar = {
                        public_id: myCloud.public_id,
                        url: myCloud.secure_url,
                    };
                }
            }

            await user?.save();

            await redis.set(userId, JSON.stringify(user));

            res.status(200).json({
                success: true,
                user,
            });
        } catch (error: any) {
            return next(new errorHandler(error.message, 400));
        }
    }
);
