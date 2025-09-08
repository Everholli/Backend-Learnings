import { asyncHandler } from '../utils/asyncHandler.js'
import { User} from "../models/user.model.js"
import { APIError } from '../utils/APIerror.js';
import { APIResponse } from '../utils/APIResponse.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';

const generateTokens = async (userId) => {
    try{
        const user = User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateAccessToken()

        user.refreshToken = refreshToken;
        await user.save({ValidationBeforeSave: false})

        return {accessToken, refreshToken}
    }catch{
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
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
    
    const user = User.findOne({
        $or: [{username} , {email}],
    })

    if(!user) {
        throw new APIError(400, "Üser doesn't exist");
    }

    const hashPassword = await bcrypt.compare(password, user.password)

    if(!hashPassword){
        throw new APIError(400, "Inappropriate Password")
    }

})

export  {
    registerUser
} 