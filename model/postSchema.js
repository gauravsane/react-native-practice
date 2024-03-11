const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title:{
        type: String,
        required: [true, "Please enter a title"]
    },
    description:{
        type:String,
        required: [true, "Please enter a description"]
    },
    postedBy:{
        type: mongoose.Schema.ObjectId,
        ref: "user",
        required: true
    }
},{timestamps: true})

const post = new mongoose.model("post",postSchema);
module.exports = post;