import express from "express";
import { activateUser, getUserInfo, loginUser, logoutUser, registerUser, socialAuth, updateAccessToken, updateUserInfo } from "../controllers/user.controller";
import { isAuthenticated } from "../middleware/auth";
const router = express.Router();

router.post("/register", registerUser);
router.post("/activate-user", activateUser);
router.post("/login-user", loginUser);
router.get("/logout-user", isAuthenticated ,logoutUser);

router.get("/refreshtoken", updateAccessToken);
router.get("/me", isAuthenticated, getUserInfo);

router.post("/social-auth", socialAuth);
router.put("/update-user-info",isAuthenticated, updateUserInfo);


export default router;