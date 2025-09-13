import { asyncHandler } from '../utils/asyncHandler.js'
import { User} from "../models/user.model.js"
import { APIError } from '../utils/APIerror.js';
import { APIResponse } from '../utils/APIResponse.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import bcrypt from 'bcryptjs';

const generateTokens = async (userId) => {
    try {
        // generate access token
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();    // generate refresh token
        user.refreshToken = refreshToken;    
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
        
    } catch (error) {
        throw new APIError("Token generation failed", 500); 
    }


}

const registerUser = asyncHandler( async (req, res) => {

    // 1st validation
    const {  username, fullname, email, password } = req.body
    // console.log("email: ", email);

    // 2nd validation

    if (
        [fullname, username, email, password].some(field => field?.trim() === "")
    ){
        throw new APIError("All fields are required", 400);
    }

    // 3rd checking if user already exists
    const existeduser = await User.findOne({
        "$or": [ { email },{ username } ]
    })
    if (existeduser) {
        throw new APIError(409, "User already exists");
    }

    // 4th check for avatar, cover photo

    const avatarlocalpath = req.file?.avatar[0]?.path
    const coverlocalpath = req.file?.cover[0]?.path

    // if (!avatarlocalpath) {
    //     throw new APIError("Avatar is required", 400);
    // }
    // console.log(req.file);
    // console.log(req.file?.cover[0]?.path);

    const avatar = await uploadOnCloudinary(avatarlocalpath)
    const cover = await uploadOnCloudinary(coverlocalpath)

    // if (!avatar) {
    //     throw new APIError("Avatar is required", 400);
    // }

    // 5th create user
    const user = await User.create({
        username: username.toLowerCase(),
        fullname,
        email,
        password,
        // avatar: avatar.url || "",
        // cover: cover.url || ""
   })

   const createdUser = await User.findById(user._id).select("-password -refreshToken -watchHistory -__v")

   if (!createdUser) {
        throw new APIError("User creation failed", 500);
   }

   return res.status(201).json(
    new APIResponse(200, createdUser, "User created successfully")
   )

})

const loggInUser = asyncHandler( async (req, res) => {
    
    const { email,username, password } = req.body

    const user = await User.findOne({
        "$or": [ { email },{ username } ]
    });

    if (!user) {
        throw new APIError("User not found", 404);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw new APIError("Invalid credentials", 401);
    }

    const {accessToken, refreshToken} = await generateTokens(user._id);

    if (!accessToken || !refreshToken) {
        throw new APIError("Token generation failed", 500);
    }
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken -watchHistory")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).cookie("refreshToken", refreshToken, options)
    ,cookie("accessToken", accessToken, options)
    .json(
        new APIResponse(200, {user: loggedInUser, accessToken, refreshToken}, "Login successful")
    )
})

const logoutUser = asyncHandler( async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: { refreshToken: 1 }  // this removes the field from document
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("refreshToken", options)
    .cookie("accessToken", options)
    .json(
        new APIResponse(200, null, "Logout successful")
    )

})

export  {
    registerUser,
    loggInUser,
    logoutUser
} 