'use strict';
require('dotenv').config();
const express = require('express');
console.log("dirname is: " + __dirname);
console.log(`Current working directory (NodeJS): ${process.cwd()}`);

const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const bcrypt = require('bcrypt');

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

myDB(async (client) =>  {
  const myDataBase = await client.db('database').collection('users');

  routes(app, myDatabase);
  auth(app, myDatabase);
}).catch(e => {
  app.route('/', (req, res) => {
    res.render('pug', { title: e, message: 'unable to login'})
  });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
