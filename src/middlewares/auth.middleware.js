import { APIError } from "../utils/APIerror.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

const verifyJWT   = asyncHandler( async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.headers("Authorization")?.replace("Bearer", "")

        if (!token) {
            throw new APIError("Not authorized, no token", 401);
        }

        const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodeToken._id).select("-password -refreshToken");

        if (!user) {
            throw new APIError("Not authorized, user not found", 401);
        }

        req.user = user;
        next();

    } catch (error) {
        throw new APIError(401, error?.message || "Invalid access token");
    }
})
export { verifyJWT }