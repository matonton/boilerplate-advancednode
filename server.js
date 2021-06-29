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

myDB(async client =>  {
  const myDataBase = await client.db('database').collection('users');

  app.route('/').get((req, res) => {
    res.render(__dirname + '/views/pug', {title: "Connected to Database", message: "Please login", showLogin: true });
  });

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => { 
      done(null, doc);
    });
  });
}).catch(e => {
  app.route('/', (req, res) => {
    res.render('pug', { title: e, message: 'unable to login'})
  });
});

passport.use(new LocalStrategy(
  function(username, password, done) {
    myDataBase.findOne({ username: username }, function(err, user) {
      console.log('User:' + username + 'attempted to login.');
      if (err) { return done(err); }
      if (!user) { return done(null, false, { message: 'Incorrect username.' }); }
      if (password != user.password) { return done(null, false); }
      return done(null, user);
    });
  }
));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
