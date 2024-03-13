import mongoose from "mongoose";
import { IUser } from "./user.model";

interface IComment extends mongoose.Document {
    user: IUser;
    question: string;
    questionReplies?: IComment[];
}

interface IReview extends mongoose.Document {
    user: IUser;
    rating: number;
    comment: string;
    commentReplies: IComment[];
}

interface ILink extends mongoose.Document {
    title: string;
    url: string;
}

interface ICourseData extends mongoose.Document {
    title: string;
    description: string;
    videoUrl: string;
    videoThumbnail: object;
    videoSection: string;
    videoLength: number;
    videoPlayer: string;
    suggestions: string[];
    questions: IComment[];
    links: ILink[];
}

interface ICourse extends mongoose.Document {
    name: string;
    description: string;
    price: number;
    estimatedPrice?: number;
    thumbnail: object;
    tags: string;
    level: string;
    demoUrl: string;
    benefits: { title: string }[];
    prerequisites: { title: string }[];
    reviews: IReview[];
    courseData: ICourseData;
    rating?: number;
    purchased?: number;
}

const reviewSchema = new mongoose.Schema<IReview>({
    user: Object,
    rating: { type: Number, default: 0 },
    comment: String,
});

const linkSchema = new mongoose.Schema<ILink>({
    title: String,
    url: String,
});

const commentSchema = new mongoose.Schema<IComment>({
    user: Object,
    question: String,
    questionReplies: Object,
});

const courseDataSchema = new mongoose.Schema<ICourseData>({
    title: String,
    description: String,
    videoUrl: String,
    videoSection: String,
    videoLength: Number,
    videoPlayer: String,
    suggestions: [String],
    questions: [commentSchema],
    links: [linkSchema],
});

const courseSchema = new mongoose.Schema<ICourse>({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    estimatedPrice: Number,
    thumbnail: {
        public_id: {
            type: String,
        },
        url: {
            type: String,
        },
    },
    tags: {
        type: String,
        required: true,
    },
    level: {
        type: String,
        required: true,
    },
    demoUrl: {
        type: String,
        required: true,
    },
    benefits: [{ title: String }],
    prerequisites: [{ title: String }],
    reviews: [reviewSchema],
    courseData: [courseDataSchema],
    rating: { type: Number, default: 0 },
    purchased: { type: Number, default: 0 },
});

const CourseModel = mongoose.model<ICourse>("Course", courseSchema);

export default CourseModel;
