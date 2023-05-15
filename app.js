require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const passportLocalMongoose = require("passport-local-mongoose");
const googleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')
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
    googleId: String
});

//let userscheme use passport local mongoose as plugin
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
//Encrption
// console.log(process.env.SECRET_KEY);
// userSchema.plugin(encrypt, {secret: process.env.SECRET_KEY, encryptedFields: ["password"]});
const User = mongoose.model("User", userSchema);

//use passport local mongoose to create a local strategy:
passport.use(User.createStrategy());

//set passport to serialize and deseralize our user
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
passport.serializeUser(function(user, done) {
   done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id).then((user)=> {
        done(null, user);
  }).catch((err) => {
    done(err);
  });
});

//use third party authentication
passport.use(new googleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/authentication-app",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
  // console.log(profile);
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

app.get('/', (req, res) => {
    res.render("home");
});
app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile"] })
);
app.get('/auth/google/authentication-app', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
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
app.get('/submit', (req, res) => {
  if(req.isAuthenticated()){
    res.render('submit');
}
else{
    res.redirect('/login');
}

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
app.post('/submit',(req, res) => {
  console.log(req.user);
})

app.listen(3000, function() {
    console.log("Server started on port 3000");
});
  