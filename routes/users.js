const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const passport = require('passport')
const mongoose = require('mongoose')
const randomstring = require('randomstring')
const nodemailer = require('nodemailer')

//User model
const User = require('../models/User')

//autentication
const { ensureAuthenticated } = require('../config/auth')

//autentication
const { ensureVerification } = require('../config/auth')

//.env variables
require('dotenv').config() 

//login page
router.get('/login', (req, res) => res.render('login'))

//register
router.get('/register', (req, res) => res.render('register'))

//register handel
router.post('/register', (req, res) =>{
    const{ name, email, password, password2 } = req.body
    let errors = []

    if(!name || !email || !password || !password2 ){
        errors.push({msg: 'all fields are required'})
    }

    if(password != password2){
        errors.push({msg: 'Password doesnt match'})
    }

    if(password.length < 6){
        errors.push({msg: 'length less than 8'})
    }

    if(errors.length>0){
        res.render('register', {
            errors,
            name,
            email,
            password,password2
        })

    }else{
       User.findOne({ email: email })
       .then(user =>{
           if(user){
               //if user exist
               errors.push({ msg: 'Email already exists' })
               res.render('register', {
                   errors,name,email,password,password2
               })
           }else{
               const secretToken = randomstring.generate()
               const newUser = new User({
                   name,
                   email,
                   password,
                   secretToken: secretToken,
                   active: false
               })

               //Hash password
               bcrypt.genSalt(10, (err, salt) =>{
                   bcrypt.hash(newUser.password, salt, (err, hash) =>{
                       if(err) throw err
                       // set password to hash
                       newUser.password = hash
                       //save new user
                       newUser.save()
                         .then(user => {
                             req.flash('success_msg', `You are now registered, A verification code has been sent to ${email}`)
                             res.redirect('/users/verify')
                         })
                         .catch((err) => console.log(err))
                      
                       //compose an email
                       const output = `
                          <h1> Thank You for registration </h1>
                          <ul>
                            <li>Email: ${email}</li>
                            <li>code: ${secretToken}</li>
                          </ul>
                          <p>Please verify on url: <a herf = "http://localhost:1000/users/verify">http://localhost:1000/users/verify</a></p>
                       `
                      
                        //send email
                        // create reusable transporter object using the default SMTP transport
                        let transporter = nodemailer.createTransport({
                            
                            service: 'gmail',
                            auth: {
                                user: process.env.EMAIL, // generated ethereal user
                                pass: process.env.PASSWORD  // generated ethereal password
                            },
                            
                        });

                        
                        // setup email data with unicode symbols
                        let mailOptions = {
                            from: '"GlobeTrotters" <globetrotters0820@gmail.com>', // sender address
                            to: `${email}`, // list of receivers
                            subject: 'Verification code', // Subject line
                            text: 'Hello world?', // plain text body
                            html: output // html body
                        };

                        // send mail with defined transport object
                        transporter.sendMail(mailOptions, (error, info) => {
                            if (error) {
                                return console.log(error);
                            }
                            console.log('Message sent: %s', info.messageId);   
                            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                        });

                })
            })

        }
    })
    }
})

// Login
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
      successRedirect: '/dashboard',
      failureRedirect: '/users/login',
      failureFlash: true
    })(req, res, next);
  })

//Verify email
router.get('/verify', ensureVerification, (req, res) => res.render('verifyEmail'))

//Verify Email Handle
router.post('/verify', (req, res, next) => {
    const { secretToken } = req.body
    
     User.findOne({ 'secretToken': secretToken })
       .then((user) => { 
           if(!user) {
                req.flash('error_msg', 'No User Found')
                res.redirect('/users/verify')
           }else{
                user.active = true
                user.secretToken = ""
                user.save()

                req.flash('success_msg', 'You are Succesfully Verified In!')
                res.redirect('/users/login')
           }
       }).catch((err) => console.log(err))
})

//logout
router.get('/logout', (req, res) => {
    req.logout()
    req.flash('success_msg', 'You are logged out')
    res.redirect('/users/login')
})



module.exports = router