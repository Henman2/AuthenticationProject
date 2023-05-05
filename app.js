// require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
const mongoose = require("mongoose");
const md5 = require("md5");
// const encrypt = require('mongoose-encryption');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/userDB").then(()=>{ console.log("connection sucessfully established")})
                                                    .catch((err)=>{ console.log(err);});
//define user
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});


//Encrption
// console.log(process.env.SECRET_KEY);
// userSchema.plugin(encrypt, {secret: process.env.SECRET_KEY, encryptedFields: ["password"]});
const User = mongoose.model("User", userSchema);

app.get('/', (req, res) => {
    res.render("home");
});
app.get('/register', (req, res) => {
    res.render("register"); 
});
app.get('/login', (req, res) => {
    res.render("login");
});
app.get('/logout', (req, res) => {
    res.redirect("/");
});
app.post('/register', (req, res)=>{
    //register user
    const newUser = new User({email: req.body.username, password: md5(req.body.password)});
    newUser.save().then(() => {
        res.render("secrets");
    })
    .catch((err) => {
        res.send(err);
    });
});
app.post('/login', (req, res) => {
    const email = req.body.username;
    const password = md5(req.body.password);
    //check if user already registered
    User.findOne({email: email}).then((userFound)=>{
        if(userFound.password === password){
            res.render("secrets");
        }
        else{
            res.send("User does not exist")
            // res.redirect('/register');
        }
    })
    .catch((err) => {
        res.send(err);
    });
});

app.listen(3000, function() {
    console.log("Server started on port 3000");
});
  