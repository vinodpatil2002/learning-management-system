import express from "express";
const router = express.Router();
import { addAnswer, addQuestion, addReview, editCourse, getAllCourses, getCourseByUser, getSingleCourse, replyToReview, uploadCourse } from "../controllers/course.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { get } from "http";

router.post(
    "/create-course",
    isAuthenticated,
    authorizeRoles("admin"),
    uploadCourse
);
router.put(
    "/edit-course",
    isAuthenticated,
    authorizeRoles("admin"),
    editCourse
);
router.get(
    "/get-course/:id",
    getSingleCourse
);
router.get(
    "/get-courses",
    getAllCourses
);
router.get(
    "/get-course-content/:id",
    getCourseByUser
);
router.put(
    "/add-question",
    isAuthenticated,
    addQuestion
);
router.put(
    "/add-answer",
    isAuthenticated,
    addAnswer
);
router.put(
    "/add-review/:id",
    isAuthenticated,
    addReview
);
router.put(
    "/add-review/:id",
    isAuthenticated,
    authorizeRoles("admin"),
    replyToReview
);

export default router;
