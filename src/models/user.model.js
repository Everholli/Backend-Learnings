import mongoose, {Schema} from "mongoose";

const userSchema = new Schema(
    {
        username: {
            type: String,
            require: true,
            lowercase: true,
            uniuqe: true,
            trim: true, 
            index: true
        },
        email: {
            type: String,
            require: true,
            lowercase: true,
            uniuqe: true,
            trim: true, 
        },
        fullname: {
            type: String,
            require: true,
            trim: true, 
            index: true
        },
        avatar: {
            type: String, //cloudnary url
            require: true,
        },
        coverImage: {
            type: String, //cloudnary url
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "video"
            }   
        ],
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        refreshToken: {
            type: String
        }
    },
    {
        timestamps: true,
    }
)

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next();
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

//jwt is bearing token

userSchema.methods.generateAccessToken = async function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    )
}

userSchema.methods.generateRefreshToken = async function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)