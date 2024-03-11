const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    // token:{
    //     type: String,
    //     default: null
    // },
    role: {
        type: String,
        default: "user"
    }
},{ timestamps: true});

const data = new mongoose.model('user',schema);
module.exports = data;