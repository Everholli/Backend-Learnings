import mongoose, {Schema} from "mongoose";

const videoSchema = new Schema(
    {
        videofile: {
            type: String,   //cloudinary url
            require: true,
        },
        thumnail: {
            type: String,   //cloudinary url
            require: true,
        },
        description: {
            type: String,   
            require: true,
        },
        title: {
            type: String,  
            require: true,
        },
        duration: {
            type: Number,  
            require: true,
        },
        veiws: {
            type: Number,  
            default: 0,
        },
        ispublished: {
            type: Boolean,  
            default: true,
        },
        owner: {
            type: Schema.Types.ObjectId,  
            ref: "User",
        },
    },
    {
        timestamps: true
    }
)

export const Video = mongoose.model("Video", videoSchema) 