const express = require('express');
const session    = require('express-session');
const MongoStore = require('connect-mongo')(session);
const passport = require ('passport');
const path = require('path');
//var favicon = require('static-favicon');
const handlebars = require('handlebars');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');


//var herokuMemcachedStore = require('connect-heroku-memcached')(express);
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;

var app = express();

MongoClient.connect(process.env.MONGO_DB, function(err, db) {
    if (err) throw err;

    // view engine setup
    //app.set('views', path.join(__dirname, 'views'));
    //app.set('view engine', 'hjs');

    //app.use(favicon());
    //app.use(logger('dev'));
    console.log ('serving :'  + path.join(__dirname, '../static'));
    app.use(express.static(path.join(__dirname, '../static')));
    app.use('/bower_components', express.static(path.join(__dirname, '../bower_components')));

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(cookieParser());

    app.use(session({
            secret: '99hashfromthis99',
            store:  new MongoStore({ db: db}),
            saveUninitialized: true,
            resave: true
         //   store: new herokuMemcachedStore({   servers: ["localhost:11211"],  username: "",   password: ""})
        })
    );


    // use passport session (allows user to be captured in req.user)
    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser(function (user, done) {
        console.log ('passport.serializeUser : ' + JSON.stringify(user));
        done(null, user._id);
    });

    // from the id, retrieve the user details
    passport.deserializeUser(function (id, done) {
        console.log('passport.deserializeUser : ' + id);
        db.collection('user').findOne({_id: new ObjectID(id)}, function (err, user) {
            console.log('passport.deserializeUser : ' + JSON.stringify(user));
            done(null, user);
        });
    });

    // routes are the last thing to be initialised!
    app.use('/auth', require('./routes/auth')(passport, {  db: db }));
    app.use('/dform', require('./routes/dform')({  db: db }));

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
                message: err.message,
                error: err
            });
        });
    }

    // production error handler
    // no stacktraces leaked to user
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: {}
        });
    });
});

module.exports = app;
