require("dotenv").config()
const express = require("express")
const bodyparser = require("body-parser")
const Mongoose = require("mongoose")
const routes = require("./routes")


const app = express()
const PORT = process.env.PORT || 3000

app.use(bodyparser.json())
app.use(bodyparser.urlencoded({extended: true}))
// app.use(express.json())
// app.use(express.urlencoded({extended: true}))
app.use(routes)

app.get("/", (req, res) => {
    res.send("Welcome to Leave reporting application!!")
})

console.log("Mongodb url", process.env.DBURL)
Mongoose.connect(process.env.DBURL).then(function(){
    console.log("Connetcted to database")

    app.listen(PORT, () => {
    console.log("Server running on ", PORT)
    })

}, function(error){
    console.log("Error in connecting to mongodb", error.message)
})


