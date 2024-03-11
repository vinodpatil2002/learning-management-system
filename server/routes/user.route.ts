import express from "express";
import { activateUser, loginUser, logoutUser, registerUser } from "../controllers/user.controller";

const router = express.Router();

router.post("/register", registerUser);
router.post("/activate-user", activateUser);
router.post("/login-user", loginUser);
router.get("/logout-user", logoutUser);

export default router;