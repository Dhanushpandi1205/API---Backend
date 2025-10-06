const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

// Importing models
const userModel = require('./models/userModel');
const foodModel = require('./models/foodModel');
const verifyToken = require("./models/verifytoken");
const trackingModel = require("./models/trackingModel");

// Database connection
const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/nutrify";

mongoose.connect(mongoURI)

.then(() => {
    console.log("✅ MongoDB connection successful");
})
.catch((err) => {
    console.error("❌ MongoDB connection error:", err);
});

const app = express();
app.use(express.json());
app.use(cors());

// Endpoint for registering user
app.post("/register", (req, res) => {
    let user = req.body;

    bcrypt.genSalt(10, (err, salt) => {
        if (!err) {
            bcrypt.hash(user.password, salt, async (err, hpass) => {
                if (err) {
                    return res.status(500).send({ message: "Error hashing password" });
                }
                user.password = hpass;

                try {
                    let doc = await userModel.create(user);
                    res.status(201).send({
                        message: "User registered",
                        userid: doc._id
                    });
                } catch (err) {
                    res.status(500).send({ message: "Some problem" });
                }
            });
        } else {
            res.status(500).send({ message: "Error generating salt" });
        }
    });
});

// Endpoint for login user
app.post("/login", async (req, res) => {
    let userCred = req.body;

    try {
        const user = await userModel.findOne({ email: userCred.email });
        if (user !== null) {
            bcrypt.compare(userCred.password, user.password, (err, success) => {
                if (success) {
                    jwt.sign({ email: userCred.email }, "nutrifyapp", (err, token) => {
                        if (!err) {
                            res.send({
                                message: "Login Success",
                                token: token,
                                userid: user._id
                            });
                        } else {
                            res.status(500).send({ message: "Token generation failed" });
                        }
                    });
                } else {
                    res.status(403).send({ message: "Incorrect password" });
                }
            });
        } else {
            res.status(404).send({ message: "User not found" });
        }
    } catch (err) {
        res.status(500).send({ message: "Some problem" });
    }
});

// Endpoint to see all foods
app.get("/foods", verifyToken, async (req, res) => {
    try {
        let food = await foodModel.find();
        if (food !== null) {
            res.send(food);
        } else {
            res.status(404).send({ message: "No food found" });
        }
    } catch (err) {
        res.status(500).send({ message: "No data available" });
    }
});

// Endpoint to see food by name
app.get("/foods/:name", verifyToken, async (req, res) => {
    try {
        let foods = await foodModel.find({ name: { $regex: req.params.name, $options: 'i' } });
        if (foods.length !== 0) {
            res.send(foods);
        } else {
            res.status(404).send({ message: "Food item not found" });
        }
    } catch (err) {
        res.status(500).send({ message: "Some problem" });
    }
});

// Endpoint to track a food
app.post("/track", verifyToken, async (req, res) => {
    let track = req.body;
    try {
        await trackingModel.create(track);
        res.status(201).send({ message: "Food Added" });
    } catch (err) {
        res.status(500).send({ message: "Some problem in tracking food" });
    }
});

// Endpoint to get foods eaten by user
app.get("/track/:userid/:date", verifyToken, async (req, res) => {
    let id = req.params.userid;
    let date = new Date(req.params.date);
    let strDate = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();

    try {
        let foods = await trackingModel.find({ userId: id, eatenDate: strDate })
            .populate('userId')
            .populate('foodId');
        res.send(foods);
    } catch (err) {
        res.status(500).send({ message: "Some problem" });
    }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
