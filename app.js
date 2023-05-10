// require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const passportLocalMongoose = require("passport-local-mongoose");
// const md5 = require("md5");
// const encrypt = require('mongoose-encryption');
// const bcrypt = require('bcrypt');
// const saltRounds = 5;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//start using session
app.use(session({
    secret: 'my secretes',
    resave: false,
    saveUninitialized: false
  }));

  //initialize passport to use for authentication
  app.use(passport.initialize());
  //use passsport to manage session
  app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB").then(()=>{ console.log("connection sucessfully established")})
                                                    .catch((err)=>{ console.log(err);});
//define user
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    // active: Boolean
});

//let userscheme use passport local mongoose as plugin
userSchema.plugin(passportLocalMongoose);
//Encrption
// console.log(process.env.SECRET_KEY);
// userSchema.plugin(encrypt, {secret: process.env.SECRET_KEY, encryptedFields: ["password"]});
const User = mongoose.model("User", userSchema);

//use passport local mongoose to create a local strategy:
passport.use(User.createStrategy());

//set passport to serialize and deseralize our user
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/', (req, res) => {
    res.render("home");
});
app.get('/secrets', (req, res) => {
    if(req.isAuthenticated()){
        res.render('secrets');
    }
    else{
        res.redirect('/login');
    }
});
app.get('/register', (req, res) => {
    res.render("register"); 
});
app.get('/login', (req, res) => {
    res.render("login");
});
app.get('/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});
app.post('/register', (req, res)=>{
    //register user
    // bcrypt.hash(req.body.password, saltRounds).then(function(hash) {
    //     // Store hash in your password DB.
    //     const newUser = new User({email: req.body.username, password: hash});
    //     newUser.save().then(() => {
    //         res.render("secrets");
    //     })
    //     .catch((err) => {
    //         res.send(err);
    //     });
    // });
    User.register({username:req.body.username}, req.body.password, (err, user)=> {
        if (err) {
            console.log(err);
            res.redirect('/register');
          }
      else {
            passport.authenticate("local")(req, res, function() {
                res.redirect('/secrets');
            //     if(result === true) {
            // res.render("/secrets");
            //     }
              // Value 'result' is set to false. The user could not be authenticated since the user is not active
        });
      }
    });
});
app.post('/login', (req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
      });
      req.login(user, function(err){
        if (err) {
          console.log(err);
        } else {
          passport.authenticate("local")(req, res, function(){
            res.redirect("/secrets");
          });
        }
      });
    //check if user already registered
    // User.findOne({email: email}).then((userFound)=>{
    //         bcrypt.compare(password, userFound.password).then(function(result) {
    //             if(result === true){
    //                 res.render("secrets");
    //             }
    //             else{
    //                 res.send("User does not exist");
    //             }
    //         });
    // })
    // .catch((err) => {
    //     res.send(err);
    // });
});

app.listen(3000, function() {
    console.log("Server started on port 3000");
});
  