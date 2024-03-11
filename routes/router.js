const express = require("express");
const router = new express.Router();
const data = require("../model/schema");
const postSchema = require("../model/postSchema");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const jwt_secret = process.env.JWT_SECRET;
var { expressjwt: jwtE } = require("express-jwt");

const requireSignIn = jwtE({
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
});

router.get('/',(req, res) => {
  return res.status(200).send({
    success: true,
    message: "Welcome to Home page"
  })
})

// Insert user to the database with hashpassword
router.post("/register", async (req, res) => {
  try {
    //get the data from body
    const { name, email, password } = req.body;
    if (!name) {
      return res.status(400).send({
        success: false,
        message: "Name is required",
      });
    }
    let emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!email) {
      return res.status(400).send({
        success: false,
        message: "Email is required",
      });
    }
    if (!email.match(emailPattern)) {
      return res.status(400).send({
        success: false,
        message: "Enter valid email address",
      });
    }
    if (!password || password.length < 6) {
      return res.status(400).send({
        success: false,
        message: "password is required and 6 character long",
      });
    }

    //if user is already register
    const existinguser = await data.findOne({ email });
    if (existinguser) {
      return res.status(400).send({
        success: false,
        message: "This Email is Already Registered",
      });
    }
    //change password to the hashpassword
    const hashPassword = await bcrypt.hash(password, 10);
    //create user and add password to hashpassword
    const user = await data.create({
      name,
      email,
      password: hashPassword,
    });
    user.password = undefined;
    return res.status(200).send({
      success: true,
      message: "User Registration Success",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Internal server error",
      error,
    });
  }
});

//Login user using email and password
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    // if (!email || !password) {
    //   return res.status(401).send({
    //     success: false,
    //     message: "Please provide email and password"
    //   });
    // }
    if (!email) {
      return res.status(401).send({
        success: false,
        message: "Please provide email",
      });
    }
    if (!password) {
      return res.status(401).send({
        success: false,
        message: "Please provide password",
      });
    }

    const user = await data.findOne({ email: email });
    if (!user) {
      return res.status(401).send({
        success: false,
        message: "Email not exist",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(500).send({
        success: false,
        message: "password does not match",
      });
    }

    const token = jwt.sign({ userId: user._id }, jwt_secret, {
      expiresIn: "1h",
    });

    user.token = token;
    user.password = undefined;

    //cookie section
    const options = {
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    };
    res.status(200).cookie("token", token, options).json({
      success: true,
      message: "Login successfull",
      token,
      data: user,
    });
    // res.status(200).send({
    //   success: true,
    //   message: "Login successfull",
    //   token,
    //   data,
    // })
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Internal server error",
      error,
    });
  }
});

//Update User Profile Route(update name and password)
router.put("/update", requireSignIn, async (req, res) => {
  try {
    const { name, password, email } = req.body;

    const user = await data.findOne({ email: email });

    if (password && password.length < 6) {
      return res.status(400).send({
        success: false,
        message: "Password is required and should be 6 character long",
      });
    }
    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : undefined;
    //updated user
    const updatedUser = await data.findOneAndUpdate(
      { email },
      {
        name: name || data.name,
        password: hashedPassword || data.password,
      },
      { new: true }
    );
    updatedUser.password = undefined;
    res.status(200).send({
      success: true,
      message: "Profile Updated Please Login",
      updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in User Update Api",
      error,
    });
  }
});

//--------------Post Api Routes----------------------------------------------

//Post route
router.post("/createPost", requireSignIn, async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(404).send({
        success: false,
        message: "Please enter all fields",
      });
    }
    const postData = await postSchema({
      title,
      description,
      postedBy: req.auth.userId,
    }).save();
    res.status(200).send({
      success: true,
      message: "Post Created Successfully",
      postData,
    });
    // console.log(req);
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "Error in create post",
      error,
    });
  }
});

//Get All Post Route
router.get("/getPosts", async (req, res) => {
  try {
    const posts = await postSchema
      .find()
      .populate("postedBy", "_id name")
      .sort({ createdAt: -1 });
    return res.status(200).send({
      success: true,
      message: "All posts fetched successfully!",
      posts,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "Error in Get All Posts",
      error,
    });
  }
});

//Get User Posts Route
router.get("/getUserPost", requireSignIn, async (req, res) => {
  try {
    const Userposts = await postSchema.find({ postedBy: req.auth.userId });
    res.status(200).send({
      success: true,
      message: "User post fetch successfully",
      Userposts,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in Get User Post",
      error,
    });
  }
});

//Delete User Post Route
router.delete("/deletePost/:id", requireSignIn, async (req, res) => {
  try {
    const { id } = req.params;
    await postSchema.findByIdAndDelete({ _id: id });
    res.status(200).send({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(404).send({
      success: false,
      message: "Error in Delete User Post",
      error,
    });
  }
});

//Update User Post Route
router.put("/updateUserPost/:id", requireSignIn, async (req, res) => {
  try {
    const { title, description } = req.body;

    const post = await postSchema.findById({ _id: req.params.id });

    if (!title || !description) {
      return res.status(500).send({
        success: false,
        message: "Please fill all the details",
      });
    }
    const updatePost = await postSchema.findByIdAndUpdate(
      { _id: req.params.id },
      {
        title: title || post?.title,
        description: description || post?.description,
      },
      { new: true }
    );
    return res.status(200).send({
      success: true,
      message: "Post Updated Successfully",
      updatePost,
    });
  } catch (error) {
    console.log(error);
    res.status(404).send({
      success: false,
      message: "Error in Update User Post",
      error,
    });
  }
});

module.exports = router;
