import { jwt } from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/user.model.js";
import { APIError } from "../utils/APIerror.js";

const verifyJWT   = asyncHandler( async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.headers("Authorization")?.replace("Bearer", "")

        if (!token) {
            throw new APIError("Not authorized, no token", 401);
        }

        const decodeToken = jwt.verify(token, env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodeToken._id).select("-password -refreshToken");

        if (!user) {
            throw new APIError("Not authorized, user not found", 401);
        }

        req.user = user;
        next();

    } catch (error) {
        throw new APIError("Not authorized, token failed", 401);
    }
})