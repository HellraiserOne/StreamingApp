const express = require('express')
const routes = express.Router()

const userController = require('../controllers/user.controller')

routes.post('/register', userController.userRegistration)
routes.post('/login', userController.userLogin)
routes.post('/forgetPassword', userController.forgetPassword)
routes.get('/verify', userController.checkUserLoginStatus)
routes.get('/val/:vid/:email', userController.verificationEmailAfterUserClick)


module.exports = routes