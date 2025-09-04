import { asyncHandler } from '../utils/asyncHandler.js'
import { User} from "../models/user.model.js"
import { APIError } from '../utils/APIerror.js';
import { APIResponse } from '../utils/APIResponse.js';

const registerUser = asyncHandler( async (req, res) => {

    // 1st validation
    const {  username, fullname, email, password } = req.body
    console.log("email: ", email);

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
        throw new APIError("User already exists", 400);
    }

    // 4th check for avatar, cover photo

    const avatarlocalpath = req.file?.avatar[0]?.path
    const coverlocalpath = req.file?.cover[0]?.path

    if (!avatarlocalpath) {
        throw new APIError("Avatar is required", 400);
    }
    // console.log(req.file);
    // console.log(req.file?.cover[0]?.path);

    const avatar = await uploadOnCloud(avatarlocalpath)
    const cover = await uploadOnCloud(coverlocalpath)

    if (!avatar) {
        throw new APIError("Avatar is required", 400);
    }

    // 5th create user
    const user = await User.create({
        username: username.toLowerCase(),
        fullname,
        email,
        password,
        avatar: avatar.url,
        cover: cover.url
   })

   const createdUser = await User.findById(user._id).select("-password -refreshToken -watchHistory -__v")

   if (!createdUser) {
        throw new APIError("User creation failed", 500);
   }

   return res.status(201).json(
    new APIResponse(200, createdUser, "User created successfully")
   )


})

export  {
    registerUser
} 