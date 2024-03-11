import mongoose, { Document, Model, Schema } from "mongoose";
import bcryptjs from "bcryptjs";
require("dotenv").config();
import jwt from "jsonwebtoken";

const emailRegexPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    avatar: {
        public_id: string;
        url: string;
    };
    role: string;
    isVerified: boolean;
    courses: Array<{ courseId: string }>;
    comparePassword: (password: string) => Promise<boolean>;
    signAccessToken: () => string;
    signRefreshToken: () => string;
}

const userSchema: Schema<IUser> = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please enter your name"],
        },
        email: {
            type: String,
            required: [true, "Please enter your email"],
            unique: true,
            validate: {
                validator: function (v: string) {
                    return emailRegexPattern.test(v);
                },
                message: (props: any) =>
                    `${props.value} is not a valid email address!`,
            },
        },
        password: {
            type: String,
            required: [true, "Please enter your password"],
            minLength: [6, "Your password must be at least 6 characters long"],
            select: false,
        },
        avatar: {
            public_id: {
                type: String,
            },
            url: {
                type: String,
            },
        },
        role: {
            type: String,
            default: "user",
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        courses: [
            {
                courseId: String,
            },
        ],
    },
    {
        timestamps: true,
    }
);

// hash password before saving user
userSchema.pre<IUser>("save", async function (next) {
    if (!this.isModified("password")) {
        next();
    }
    this.password = await bcryptjs.hash(this.password, 10);
    next();
});

// sign access token
userSchema.methods.signAccessToken = function (){
    return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN || "");
}

// sign refresh token
userSchema.methods.signRefreshToken = function (){
    return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN || "");
}

// compare user password
userSchema.methods.comparePassword = async function (
    enteredPassword: string
): Promise<boolean> {
    return await bcryptjs.compare(enteredPassword, this.password);
};

const userModel: Model<IUser> = mongoose.model("User", userSchema);

export default userModel;
