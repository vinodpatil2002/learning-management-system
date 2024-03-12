import express from "express";
const router = express.Router();
import { editCourse, uploadCourse } from "../controllers/course.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";

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

export default router;
