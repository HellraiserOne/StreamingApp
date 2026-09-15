const express = require('express')
const routes = express.Router()

const healthCheckController = require('../controllers/healthCheck.controller')

routes.get('/', healthCheckController.healthCheck)


module.exports = routes