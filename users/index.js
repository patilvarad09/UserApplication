const express = require("express")
const router = express.Router()
const userController = require("./user.controller")
const services = require("../services/auth")

router.post('/register', userController.register)

router.get("/verify", userController.verify)

router.post("/login", userController.loginUser)

module.exports = router 