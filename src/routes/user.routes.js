import { Router } from 'express';
import { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    updatePassword,
    getCurrentUser,
    updateAccDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
 } from '../controllers/user.controller.js';
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar", 
            maxCount: 1
        },
        {
            name: "cover",
            maxCount: 1
        }
    ]), 
    registerUser);

router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, updatePassword);
router.route("/get-user").post(verifyJWT, getCurrentUser);
router.route("/update-profile").post(verifyJWT, updateAccDetails);
router.route("/update-avatar").post(verifyJWT, upload.single("avatar"), updateUserAvatar);
router.route("/update-cover").post(verifyJWT, upload.single("cover"), updateUserCoverImage);
router.route("/c/:username").post(verifyJWT, getUserChannelProfile);
router.route("/get-watch-history").post(verifyJWT, getWatchHistory);

export default router;