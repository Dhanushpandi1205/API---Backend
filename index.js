const express= require ('express');  
const mongoose= require ('mongoose');
const bcrypt= require ('bcryptjs');
const jwt= require ('jsonwebtoken');


//importing models
const userModel = require('./models/userModel');
const foodModel = require('./models/foodModel');
const verifyToken = require("./models/verifytoken");
const trackingModel = require("./models/trackingModel")

//database connection 

mongoose.connect("mongodb://localhost:27017/nutrify")
.then(()=>
{
    console.log("Connection is successful")
})
.catch((err)=>
{
    console.log(err);
})

const app = express();
app.use (express.json());


// endpoint for registering user
app.post("/register",(req,res)=>{
    let user = req.body;
    
          bcrypt.genSalt(10,(err,salt)=>{
            if(!err){
                bcrypt.hash(user.password,salt,async(err,hpass)=>
                {
                  user.password=hpass;
                        
                 try{
                      let doc = await  userModel.create(user)
                      res.status(201).send({message:"User registered"})
                    }
                    catch(err)
                    {
                      res.status(500).send({message: " Some problem"})
                    }  
                })
            }
          })
        
    
})

// endpoint for login user

app.post("/login",async(req,res)=>
{
    let userCred = req.body;

    try{

    const user= await userModel.findOne({email:userCred.email})
    if(user!==null)
    {
        bcrypt.compare(userCred.password,user.password,(err,success)=>
        {
            if(success==true){
               jwt.sign({email:userCred.email},"nutrifyapp",(err,token)=>
            {
                if(!err ){
                    res.send({message:"Login Success",token:token});
                }
                 
            })
            }
            else{
                res.status(403).send({message:"incorrect password"})
            }
        })
    }
    else{
        res.status(404).send({message:"user not found"})
    }

    }
    catch(err){
        res.status(500).send({message:"some problem"})
    }
})

//endpoint to see all foods

app.get("/foods",verifyToken,async(req,res)=>
{
    try{
       
        console.log("get request")
        let food = await  foodModel.find();
    if(food !== null){
        res.send(food)
    }
    }
    catch(err){
         res.send({message:"no data available"})
    }
    
})

//end point to see food by name
app.get("/foods/:name",verifyToken,async(req,res)=>
{
    try{
       
        let foods =  await foodModel.find({name:{$regex:req.params.name,$options:'i'}});
        if(foods.length!==0){
        res.send(foods);
    }
    else{
        res.status(404).send({message:"Food item  not found"})
    }
}
    
    catch(err){
         res.status(500).send({message:"Some problem"})
    }
    
})

//end point to tracking a food

app.post("/track",verifyToken,async(req,res)=>
{
    let track = req.body;
  try{
    let data=await trackingModel.create(track);
    res.status(201).send({message:"Food Added"}) 
}
   catch(err)
   {
      res.status(501).send({message:"Some problem in getting food"})
   }


})

//end point to get foods eaten by user

app.get("/track/:userid/:date",verifyToken,async(req,res)=>{

    let id = req.params.userid;
 let date = new Date(req.params.date)
 let strDate =date.getDate()+"/"+(date.getMonth()+1)+"/"+date.getFullYear();

 console.log(strDate,date,id);
 try{
    let foods= await trackingModel.find({userId:id,eatenDate:strDate}).populate('userId').populate('foodId');
    res.send(foods); 
    console.log(foods)

}
 catch(err){
    res.send({message:" Some problem"})
 }
})


app.listen(8000,()=>{
    console.log("Server is up and running");
})


