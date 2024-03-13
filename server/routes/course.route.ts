import express from "express";
const router = express.Router();
import { editCourse, getSingleCourse, uploadCourse } from "../controllers/course.controller";
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

export default router;
