const passport = require('passport');
const bcrypt = require('bcrypt');

module.exports = function (app, myDataBase) {
  app.route('/').get((req, res) => {
    res.render(__dirname + '/views/pug', {title: "Connected to Database", message: "Please login", showLogin: true, showRegistration: true, showSocialAuth: true });
  });

  app.post('/login', passport.authenticate('local', { failureRedirect: '/', successRedirect: '/profile' }), (req, res) => {
    res.redirect('/profile');
  });

  app.get('/profile', ensureAuthenticated, (req, res) => {
    res.render(__dirname + '/views/pug/profile', { username: req.user.username });
  });

  app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
  });

 app.route('/register')
  .post((req, res, next) => {
    myDataBase.findOne({ username: req.body.username }, function(err, user) {
      if (err) {
        next(err);
      } else if (user) {
        res.redirect('/');
      } else {
        const hash = bcrypt.hashSync(req.body.password, 12);
        myDataBase.insertOne({
          username: req.body.username,
          password: hash
        },
          (err, doc) => {
            if (err) {
              res.redirect('/');
            } else {
              // The inserted document is held within
              // the ops property of the doc
              next(null, doc.ops[0]);
            }
          }
        )
      }
    })
  },
    passport.authenticate('local', { failureRedirect: '/' }),
    (req, res, next) => {
      res.redirect('/profile');
    }
  );

  app.get('/auth/github', (req, res) => {
    passport.authenticate('github');
  });
  
  app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/profile');
  });

  app.use((req, res, next) => {
    res.status(404)
      .type('text')
      .send('Not Found');
  });
}

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}