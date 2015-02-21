var   express = require('express')
    , router = express.Router()
    , LocalStrategy = require('passport-local').Strategy
    , FacebookStrategy = require('passport-facebook').Strategy
    , ForceDotComStrategy = require('passport-forcedotcom').Strategy
//    , bcrypt = require('bcrypt')
    , ObjectID = require('mongodb').ObjectID;


module.exports = function (passport, options) {

    console.log ('setting up auth routes ');
    var orm = require ("../libs/orm_mongo")(options);
    var meta = require('../libs/orm_mongo_meta')(options);
    var db = options.db;

    // Passport session setup.
    // To support persistent login sessions, Passport needs to be able to
    // serialize users into and deserialize users out of the session. Typically,
    // this will be as simple as storing the user ID when serializing, and
    // finding the user by ID when deserializing.
    passport.serializeUser(function (user, done) {
        console.log ('passport.serializeUser : ' + JSON.stringify(user));
        done(null, user._id);
    });

    // from the id, retrieve the user details
    passport.deserializeUser(function (id, done) {
        console.log('passport.deserializeUser : ' + id);

        orm.find(meta.forms.Users, {_id: new ObjectID(id)}, function success(j) {
            var user = j.documents;
            console.log('passport.deserializeUser : ' + JSON.stringify(user));
            done(null, user);
        }, function error(e) {
            res.status(400).send(e);
        }, true);
/*
        db.collection('user').findOne({_id: new ObjectID(id)}, function (err, user) {
        });
*/
    });

    passport.use(new LocalStrategy(
        function (username, password, done) {
            // console.log('login attempt : ' + username);
            db.collection('user').findOne({
                email: username
            }, function (err, user) {
                if (err) {
                    console.log('login attempt : ' + err);
                    return done(null, false, err);
                }
                if (!user) {
                    console.log('login attempt : ' + 'Unknown user');
                    return done(null, false, 'Unknown user');
                }
                if (!user.provider.internal) {
                    return done(null, false, 'No password setup for this user');
                }
      //          if (!bcrypt.compareSync(password, user.provider.internal.password)) {
      //              console.log('login attempt : ' + 'Invalid password ');
      //              return done(null, false, 'Invalid password');
      //          }
                return done(null, user);
            });
        }
    ));

    passport.use(new FacebookStrategy({
            clientID: '448297785208364', // myapp
            clientSecret: 'b9b07e0f0067868f597f1fa6deb279cd',
            callbackURL: "/auth/facebook/callback"
        },
        function (accessToken, refreshToken, profile, done) {
            // console.log ('FacebookStrategy :' + JSON.stringify(profile));

            //db.collection('user').find({"provider.facebook.id": profile.id}).toArray(function (err, existinguser) {

            orm.find(meta.forms.Users, {'provider.provider_id': profile.id}, function success(j) {
                var existinguser = j.documents;
                console.log('FacebookStrategy find existing user returned : ' + JSON.stringify (existinguser));
                if (!existinguser) {
                    console.log('FacebookStrategy: no existing user, creating from facebook profile : ' + JSON.stringify(profile));

                    // exps.forms.AuthProviders
                    orm.save (meta.forms.Users, null,null,
                        {
                            name: profile.name.givenName + ' ' + profile.name.familyName,
                            role: "new",
                            email: profile.emails[0].value,
                            provider: [
                                { _id: new ObjectID(), type: "facebook", provider_id: profile.id }]
                        }, function success(newuser) {
                            console.log ('Saved new user : ' + JSON.stringify(newuser));
                            done(null, newuser);
                        }, function error(ee) {
                            return done(null, false, 'error creating user');
                        });
                    /*
                    db.collection('user').insert({
                        'provider': { 'facebook': { 'id': profile.id }},
                        'name': profile.name.givenName + ' ' + profile.name.familyName,
                        'email': profile.emails[0].value    }, function (err, newuser) {
                        console.log('created a user?? : ' + newuser);
                        if (newuser) {
                            done(null, newuser);
                        } else {
                            return done('error creating user');
                        }
                    });
                    */
                } else {
                    console.log('found existing user :' + JSON.stringify(existinguser));
                    return done(null, existinguser);
                }
            }, function error (e) { console.log('FacebookStrategy find user error:' + JSON.stringify(e)); }, true);
        }));

    passport.use(new ForceDotComStrategy({
            authorizationURL: 'https://bbc-idp.secure.force.com/services/oauth2/authorize',
            tokenURL: 'https://bbc-idp.secure.force.com/services/oauth2/token',
            clientID: '3MVG99qusVZJwhsnJY.PGdFYIIM_eGD7IVwzFwGMtPw0q3dAZD9iCmnBZbpJCB4hGrhwkW6Q3Uno1ymHfzUQ.',
            clientSecret: '524803988440627480',
            callbackURL: "/auth/salesforce/callback"
        },
        function (token, tokenSecret, profile, done) {
            console.log('ForceDotComStrategy : ' + profile);
            db.collection('user').find({"provider.chatter.id": profile.id}, function (err, existinguser) {
                if (existinguser.length === 0) {
                    console.log('no existing user, creating a user : ' + JSON.stringify(profile));

                    db.collection('user').save({
                        'provider': { 'chatter': { 'id': profile.id }},
                        'name': 'Chatter User',
                        'email': 'chatter@email.com'    }, function (newuser) {
                        console.log('created a user?? : ' + newuser);
                        if (newuser) {
                            done(null, newuser);
                        } else {
                            return done('error creating user');
                        }
                    });
                } else {
                    console.log('found existing user :' + existinguser + ':');
                    done(null, existinguser[0]);
                }
            });
        }));

    // redirects the user to Facebook login, including the relay
    router.get('/facebook', function (req, res, next) {

        var startURL = req.query.state  || '/';
        console.log ('/auth/facebook : ' + startURL);
        console.log ('user : ' + JSON.stringify(req.user));
     //   if (req.user) {

     //   } else {
            passport.authenticate('facebook', {  state: startURL, scope: 'email' })(req, res, next);
     //   }
    });


    router.get('/facebook/callback',
/*
        passport.authenticate('facebook', { successRedirect: '/',
                failureRedirect: '/login' })
*/
        function (req, res, next) {

            console.log ('/auth/facebook/callback, custom callback to handle the state');
            // supplying a function to 'authenticate' makes this a Custom Callback,
            // When using a custom callback, it becomes the application's responsibility to establish a session
            passport.authenticate('facebook', function(err, user, info) {

                if (err) { return next(err); }
                if (!user) { return res.redirect('/'); }

                // res.send(req.user);
                console.log('facebook callback authenticate, err : ' + JSON.stringify(err) + ' user : ' + JSON.stringify(user) + ' info : ' + JSON.stringify(info) + ' state : ' + req.query.state);
                req.logIn(user, function(err){
                    if (err) {
                        return next(err);
                    }
                    res.redirect(req.query.state || '/');
                });
            })(req,res,next);
        }

    );

    router.get('/salesforce', passport.authenticate('forcedotcom'));

    router.get('/salesforce/callback',
        passport.authenticate('forcedotcom', { successRedirect: '/#home',
            failureRedirect: '/' }));


    router.post('/ajaxlogin', function (req, res, next) {
        passport.authenticate('local', function (err, user, info) {

            if (err) {
                return next(err);
            }
            if (!user) {
                console.log('local  ajaxlogin : NO user : ' + JSON.stringify(info));
                return res.json({result: false, message: info});
            } else {

                // res.send(req.user);
                console.log('local  ajaxlogin : user : ' + JSON.stringify(user) + ' info : ' + JSON.stringify(info) + ' state : ' + req.query.state);

                req.logIn(user, function (err) {
                    if (err) {
                        return next(err);
                    }
                    return res.json({result: true, user: user});
                });
            }
        })(req, res, next);
    });
/*

            { failureFlash: true}),
        function(req, res) {
            console.log('ajaxlogin: ' + JSON.stringify(req.user));
            res.send(req.user);
        });
*/

    router.get('/me',   function(req, res) {
        console.log('/me: ' + JSON.stringify(req.user));
        res.send(req.user);
    });

    router.get('/logout', function (req,res) {
        console.error('logout called');
        req.logOut();
        res.redirect('/');

    });

    return router;
}
