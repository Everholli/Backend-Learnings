import dotenv from "dotenv";
// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
import connectDB from "./db/index.js";

dotenv.config({
    path: "./.env"
})

console.log("MONGODB_URL is: ", process.env.MONGODB_URL);


connectDB();

















/*
import express from "express"
const app = express()
( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("errror", (error) => {
            console.log("ERRR: ", error);
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        })

    } catch (error) {
        console.error("ERROR: ", error)
        throw err
    }
})()

*/







