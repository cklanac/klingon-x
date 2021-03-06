import 'babel-polyfill';
import express from 'express';
import mongoose from 'mongoose';
import passport from 'passport';
import GoogleStrategy from 'passport-google-oauth20';
import User from '../models/user';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '../../config';

const router = express.Router();

mongoose.Promise = global.Promise;

passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:8080/auth/google/callback',
}, (accessToken, refreshToken, profile, done) => {
  User.findOneAndUpdate({ googleId: profile.id },
    {
      $set: {
        name: profile.name,
        email: profile.emails[0].value,
        accessToken,
      },
    },
    { upsert: true, new: true })
    .then((user) => {
      done(null, user);
    }).catch((err) => {
      done(err, false);
    });
}));

// apply passport.authenticate('google'...) to all `/auth/` paths
// router.use(passport.authenticate('google', {
//   scope: ['profile', 'email'],
//   failureRedirect: '/#/home',
//   session: false
// }));

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/#/home', session: false }),
  (req, res) => {
    res.cookie('accessToken', req.user.accessToken, { expires: 0 });
    // res.set('accessToken', req.user.accessToken);
    res.redirect('/#/quiz');
  });

router.get('/logout', (req, res) => {
  req.logout();
  res.clearCookie('accessToken');
  // console.log('cookie', req.cookies.accessToken);
  // res.redirect(`https://accounts.google.com/o/oauth2/revoke?token=${req.cookies.accessToken}`);
});

module.exports = router;
