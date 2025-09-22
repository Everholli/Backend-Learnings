import { asyncHandler } from '../utils/asyncHandler.js'
import { User} from "../models/user.model.js"
import { APIError } from '../utils/APIerror.js';
import { APIResponse } from '../utils/APIResponse.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import mongoose from 'mongoose';


const generateTokens = async (userId) => {
    try {
        // generate access token
        const user = await User.findById(userId);
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

const loginUser = asyncHandler( async (req, res) => {
    const {username, email, password} = req.body

    if(!(username || email)){
        throw new APIError(400, "All fields are required");
    }
    
    const user = await User.findOne({
        $or: [{username} , {email}],
    })

    if(!user) {
        throw new APIError(400, "Üser doesn't exist");
    }

    console.log("User found:", user._id);

   const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new APIError(400, "Inappropriate Password")
    }

    const {accessToken, refreshToken} = await generateTokens(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new APIResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
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

const refreshAcessToken =  asyncHandler( async (req, res) => {
    const  {incomingRefreshToken}  = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new APIError("Refresh token is required", 400);
    }

    try {
        const decodeToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
        const user = await User.findById(decodeToken?._id)
    
        if(!user) {
            throw new APIError("User not found", 404);
        }
    
        if (user?.refreshToken !== incomingRefreshToken) {
            throw new APIError("Invalid refresh token", 401);
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const { accessToken, newRefreshToken } = await generateTokens(user._id);
    
        return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new APIResponse(200, { accessToken, newRefreshToken }, "Token refreshed successfully")
        )
    
    } catch (error) {
        throw new APIError("Token refresh failed", 500);            
    }

})

const updatePassword = asyncHandler(async(req, res) => {
    const { oldPassword, newPassword } = req.body;

    if(!oldPassword|| !newPassword){
        throw new APIError(400, "All fields are required");
    }    

    const user = User.findById(req.user._id)
    const isPasswordValid = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordValid){
        throw new APIError(400, "Inappropriate Password");
    }

    user.password = newPassword;
    user.save({validateBeforeSave: false});

    return res.status(200).json(
        new APIResponse(200, {}, "Password updated successfully")
    )
})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(
        new APIResponse(200, req.user, "User retrieved successfully")
    )
})

const updateAccDetails = asyncHandler( async(req, res) =>{
    const { fullname, email} = req.body;

    if (!( fullname || email)){
        throw new APIError(400, "At least one field is required to update");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname,
                email
            }
        },
        { new: true }
    ).select( "-password")
    

    return res
    .status(200)
    .json(
        new APIResponse(200, user, "User updated successfully")
    )
})

const updateUserAvatar = asyncHandler( async(req,res) => {
    const avatarLoacalPath = req.file?.path;

    if (!avatarLoacalPath) {
        throw new APIError("Avatar file is required", 400);
    }

    // const user = await User.findByIdAndDelete(req.user._id, {avatarLoacalPath});

    const avatar = await uploadOnCloudinary(avatarLoacalPath);

    if (!avatar.url) {
        throw new APIError("Error while uploading on avatar", 400);
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { avatar: avatar.url }
        },
        { new: true }
    ).select("-password");

    return res
    .status(200)
    .json(
        new APIResponse(200, user, "Avatar updated successfully")
    )
})

const updateUserCoverImage = asyncHandler( async(req,res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new APIError("Cover image file is required", 400);
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage.url) {
        throw new APIError("Error while uploading cover image", 400);
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { coverImage: coverImage.url }
        },
        { new: true }
    ).select("-password");

    return res
    .status(200)
    .json(
        new APIResponse(200, user, "Cover image updated successfully")
    )
})

const getUserChannelProfile = asyncHandler( async(req, res) => {
    const {username} = req.params;

    if(!username?.trim()){
        throw new APIError("Username is missing", 400);
    }

    const channel = await User.aggregate([
        {
            $match: { username: username?.toLowerCase() }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "Channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "channelSubscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                subscribedToCount: {
                    $size: "$channelSubscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }

                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                email: 1,
                subscribersCount: 1,
                subscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                cover: 1,
                createdAt: 1
            }
        }
    ])

    if(!channel.length) {
        throw new APIError("Channel not found", 404);
    }

    return res
    .status(200)
    .json(
        new APIResponse(200, channel[0], "User channel profile fetched successfully")
    )
})

const getWatchHistory =asyncHandler(async(req, res) =>{
    const user = await User.aggregate([
        {
            $match: {
                _id : new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "watchHistory",
                localField: "owner",
                foreignField: "_id",
                as: "watcHistory",
                pipeline: [{
                    $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner",
                        pipeline:{
                            $project: {
                                username: 1,
                                fullname: 1,
                                avatar: 1,
                            }
                        }
                    }
                }]
            }
        },
        {
            $addFields: {
                $owner:{
                    $First: "owner"
                }
            }
        }
    ])
})

export  {
    registerUser,
    loginUser,
    logoutUser,
    refreshAcessToken,
    updatePassword,
    getCurrentUser,
    updateAccDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
} 