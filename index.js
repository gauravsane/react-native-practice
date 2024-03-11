require('dotenv').config();
const express = require('express');
require('./database/db');
const app = express();
const cors = require('cors');
const router = require('./routes/router');
const cookieParser = require('cookie-parser');
const port = 3300;


app.use(express.json());
app.use(cookieParser());
app.use(router);
app.use(cors());

app.listen(port, ()=>{
    console.log('server listen on http://localhost:3300')
})