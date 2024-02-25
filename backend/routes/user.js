const express = require("express");
const router = express.Router();
const zod =  require("zod");
const { User, Account } = require("../db");
const { JWT_SECRET } = require("../config");
const jwt = require("jsonwebtoken");
const { authMiddleware } = require("../middleware");
 
//zod validation
const signupBody = zod.object({
  username:zod.string(),
  password: zod.string(),
  firstName: zod.string(),
	lastName: zod.string(),
	 
})


router.post("/signup", async function(req, res) {
  const { success } = signupBody.safeParse(req.body);

  if (!success) {
    return res.status(411).json({
      message: "Email already taken/incorrect inputs"
    });
  }

  const existingUser = await User.findOne({
    username: req.body.username
  });

  if (existingUser) {
    return res.status(411).json({
      message: "Email already taken"
    });
  }

  const user = await User.create({
    username: req.body.username,
    password: req.body.password,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
  });

  const userId = user._id;
  await Account.create({
    userId,
    balance: 1 + Math.random() * 10000
  });

  const token = jwt.sign({
    userId
  }, JWT_SECRET);

  res.json({
    message: "User created successfully",
    token: token
  });
});

const signinBody = zod.object({
  username:zod.string(),
  password:zod.string()
})

router.post("/signin", async function(req,res){
    const {success} = signinBody.safeParse(req.body)
    if(!success){
      return res.status(411).json({
        message:"incorrect inputs"
      })
    }

  const user  = await User.findOne({
    username:req.body.username,
    password:req.body.password
  });
  if(user){
    const token = jwt.sign({
      userid:user._id
    },JWT_SECRET);
    res.json({
      token:token
    })
    return;
  }

  res.status(411).json({
    messsage:"Error while logging in"
  })

})

 


const updateBody = zod.object({
	password: zod.string().optional(),
    firstName: zod.string().optional(),
    lastName: zod.string().optional(),
})

router.put("/update", authMiddleware, async (req, res) => {
    const { success } = updateBody.safeParse(req.body)
    if (!success) {
        res.status(411).json({
            message: "Error while updating information"
        })
      }

    await User.updateOne(req.body, {
        id: req.userId
    })

    res.json({
        message: "Updated successfully"
    })
})


router.get("/bulk",async function(req,res){
  const filter=req.query.filter || "";
  const users = await User.find({
    $or:[{
      firstName:{
        "$regex":filter
      }
    },{
      lastName:{
        "$regex":filter
      }
    }]
  })
  res.json({
    user:users.map(user=>({
      username:user.username,
      firstname:user.firstName,
      lastname:user.lastName,
      _id:user._id
    }))
  })
})

module.exports = router;