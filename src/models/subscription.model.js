import mongoose, { Schema } from "mongoose";

const subcriptionSchema = new mongoose.Schema(
    {
        subcriber: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        channel:{
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    }, {timestamps: true}
)

export const Subscription = mongoose.model("Subscription", subcriptionSchema);