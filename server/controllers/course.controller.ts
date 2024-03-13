import e, { Request, Response, NextFunction } from "express";
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import errorHandler from "../utils/errorHandler";
import cloudinary from "cloudinary";
import { createCourse } from "../services/course,service";
import CourseModel from "../models/course.model";
import { redis } from "../utils/redis";
import mongoose from "mongoose";

// upload course

export const uploadCourse = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = req.body;
            const thumbnail = data.thumbnail;
            if (thumbnail) {
                const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
                    folder: "course",
                });
                data.thumbnail = {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,
                };
            }
            createCourse(data, res);
        } catch (error: any) {
            return next(new errorHandler(error.message, 500));
        }
    }
);

// edit course

export const editCourse = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = req.body;

            const thumbnail = data.thumbnail;

            const courseId = req.params.id;

            const courseData = (await CourseModel.findById(courseId)) as any;

            if (thumbnail) {
                await cloudinary.v2.uploader.destroy(
                    courseData.thumbnail.public_id
                );

                const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
                    folder: "courses",
                });

                data.thumbnail = {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,
                };
            }

            if (thumbnail) {
                data.thumbnail = {
                    public_id: courseData?.thumbnail.public_id,
                    url: courseData?.thumbnail.url,
                };
            }

            const course = await CourseModel.findByIdAndUpdate(
                courseId,
                {
                    $set: data,
                },
                { new: true }
            );

            res.status(201).json({
                success: true,
                course,
            });
        } catch (error: any) {
            return next(new errorHandler(error.message, 500));
        }
    }
);

// get single course --- without purchasing

export const getSingleCourse = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const courseId = req.params.id;
            const isCacheExist = await redis.get(courseId);
            if (isCacheExist) {
                return res.status(200).json({
                    success: true,
                    course: JSON.parse(isCacheExist),
                });
            } else {
                const course = await CourseModel.findById(req.params.id).select(
                    "-courseData.videoUrl -courseData.suggestions -courseData.questions -courseData.links"
                );
                await redis.set(courseId, JSON.stringify(course));
                res.status(200).json({
                    success: true,
                    course,
                });
            }
        } catch (error: any) {
            return next(new errorHandler(error.message, 500));
        }
    }
);

// get all courses
export const getAllCourses = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const isCacheExist = await redis.get("courses");
            if (isCacheExist) {
                return res.status(200).json({
                    success: true,
                    courses: JSON.parse(isCacheExist),
                });
            } else {
                const courses = await CourseModel.find().select(
                    "-courseData.videoUrl -courseData.suggestions -courseData.questions -courseData.links"
                );
                await redis.set("courses", JSON.stringify(courses));
                res.status(200).json({
                    success: true,
                    courses,
                });
            }
        } catch (error: any) {
            return next(new errorHandler(error.message, 500));
        }
    }
);

// get course content for valid user

export const getCourseByUser = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userCourseList = req.user?.courses;
            const courseId = req.params.id;
            const courseExist = userCourseList?.find(
                (course: any) => course.courseId.toString() === courseId
            );
            if (!courseExist) {
                return next(
                    new errorHandler(
                        "You are not authorized to access this course",
                        400
                    )
                );
            }
            const course = await CourseModel.findById(courseId);
            const content = course?.courseData;
            res.status(200).json({
                success: true,
                content,
            });

            res.status(200).json({
                success: true,
                course,
            });
        } catch (error: any) {
            return next(new errorHandler(error.message, 500));
        }
    }
);

// add questions in course
interface IAddQuestionData {
    question: string;
    courseId: string;
    contentId: string;
}

export const addQuestion = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { question, courseId, contentId } =
                req.body as IAddQuestionData;
            const course = await CourseModel.findById(courseId);
            if (!mongoose.Types.ObjectId.isValid(contentId)) {
                return next(new errorHandler("Invalid content id", 400));
            }
            const courseContent = course?.courseData?.find((item: any) =>
                item._id.equals(contentId)
            );
            if (!courseContent) {
                return next(new errorHandler("Invalid content id", 400));
            }
            // create a new question object
            const newQuestion: any = {
                user: req.user,
                question,
                questionReplies: [],
            };

            // add the question to the content
            courseContent.questions.push(newQuestion);

            // save the course
            await course?.save();

            res.status(200).json({
                success: true,
                course,
            });
        } catch (error: any) {
            return next(new errorHandler(error.message, 500));
        }
    }
);
