const express = require('express')

const routes = express.Router()

const healthController = require('../controllers/health.controller')

routes.get('/', healthController.healthCheck)

module.exports = routes