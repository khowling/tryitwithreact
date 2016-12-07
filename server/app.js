"use strict"

const express = require('express');
const session    = require('express-session');
const MongoStore = require('connect-mongo')(session);
const passport = require ('passport');
const path = require('path');
//var favicon = require('static-favicon');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

//var herokuMemcachedStore = require('connect-heroku-memcached')(express);
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var mongoPool = { db: null};
var app = express();


let pdb = new Promise((resolve, reject) => {

  MongoClient.connect(process.env.MONGO_DB || "mongodb://localhost:27017/mydb01", function(err, database) {
    if (err) throw err;
    mongoPool.db = database;

    // session
    app.use(session({
            secret: '99hashfromthis99',
            store:  new MongoStore(mongoPool),
            saveUninitialized: true,
            resave: true
         //   store: new herokuMemcachedStore({   servers: ["localhost:11211"],  username: "",   password: ""})
        })
    );

    // use passport session (allows user to be captured in req.user)
    app.use(passport.initialize());
    app.use(passport.session());

    // routes
    // routes are the last thing to be initialised!
    app.use('/auth', require('./routes/auth')(passport, mongoPool));
    app.use('/api', require('./routes/dform')(mongoPool));

    /// catch 404 and forward to error handler
    app.use(function (req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    /// error handlers

    // development error handler
    // will print stacktrace
    if (app.get('env') === 'development') {
        app.use(function (err, req, res, next) {
            res.status(err.status || 500).json({
                message: 'dev : ' + err.message,
                error: err
            });
        });
    } else {

      // production error handler
      // no stacktraces leaked to user
      app.use(function (err, req, res, next) {
          res.status(err.status || 500);
          res.render('error', {
              message: err.message,
              error: {}
          });
      });
    }
    resolve(database);
  });
})

// Start the application after the database connection is ready
// This is requried if serving client app from react hot loader, and server from node (different ports)
app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:8000");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "X-Requested-With,Authorization,Content-Type");
  res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE");
  
  if ('OPTIONS' === req.method) {
      return res.send(204)
  }
  next()
});


app.use('/assets', express.static(path.join(__dirname, '../assets')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.get('/dbready', (req,res) => {
  pdb.then((db) => res.json({"gotdb": 1}));
})

app.listen(process.env.PORT || 3000);
console.log("Listening on port 3000");


module.exports = app;
