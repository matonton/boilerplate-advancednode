'use strict';
require('dotenv').config();
const express = require('express');
console.log("dirname is: " + __dirname);
console.log(`Current working directory (NodeJS): ${process.cwd()}`);

const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');

const app = express();
app.set('view engine', 'pug')

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const ObjectID = require('mongodb').ObjectID;

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }  
}));

app.use(passport.initialize());
app.use(passport.session());

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}

myDB(async client =>  {
  const myDataBase = await client.db('database').collection('users');

  app.route('/').get((req, res) => {
    res.render(__dirname + '/views/pug', {title: "Connected to Database", message: "Please login", showLogin: true });
  });

  app.post('/login', passport.authenticate('local', { failureRedirect: '/', successRedirect: '/profile' }), (req, res) => {
    res.redirect('/profile');
  });

  app.get('/profile', ensureAuthenticated, (req, res) => {
    res.render(__dirname + 'views/pug/profile');
  });

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => { 
      done(null, doc);
    });
  });

  passport.use(new LocalStrategy(
    function(username, password, done) {
      myDataBase.findOne({ username: username }, function(err, user) {
        console.log('User: ' + username + ' attempted to login.');
        if (err) { return done(err); }
        if (!user) { return done(null, false, { message: 'Incorrect username.' }); }
        if (password != user.password) { return done(null, false); }
        return done(null, user);
      });
    }
  ));

}).catch(e => {
  app.route('/', (req, res) => {
    res.render('pug', { title: e, message: 'unable to login'})
  });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
