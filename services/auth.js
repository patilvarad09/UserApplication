const jwt = require("jsonwebtoken")
const UserModel = require("../users/user.model")
const mailer = require("./mailer")

const isAuthorised = (req, res, next) => {
    const loginToken = req.headers["logintoken"]
    console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<", loginToken)
    verifyToken(loginToken).then((payload) => {
        console.log("^^^^^^^^^^^^^^^^^^^^^^", payload)
        if(payload.data.verified) {
            if(payload.data.role === "admin") {
                next()
            } else {
                res.status(401).send({status: "Error", message: "You are not admin so you cannot access the data of all users"})
            }
        } else {
            res.status(401).send({status: "Error", message: "You account is not verified yet."})
        }
    }).catch((err) => {
        res.send({status: "Error", message: err.message})
    })
}

const isUser  = (req, res, next) => {
    const loginToken = req.headers["logintoken"]
    console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<", loginToken)
    verifyToken(loginToken).then((payload) => {
        console.log("^^^^^^^^^^^^^^^^^^^^^^", payload)
        req.email = payload.data.email
        if(payload.data.verified) {
            if(payload.data.role === "user") {
                next()
            } else {
                res.status(401).send({status: "Error", message: "Admin cannot perform this action"})
            }
        } else {
            res.status(401).send({status: "Error", message: "You account is not verified yet."})
        }
    }).catch((err) => {
        res.send({status: "Error", message: err.message})
    })
}

const verifyToken = (data) => {
    //console.log("Token is ---------->       ", data)
    return new Promise((resolve, reject) => {
        jwt.verify(data, 'secret', (err, result) => {
            if (err) {
                console.log("error is ", err)
                reject(err)
            } else {
                console.log("result is ", result)
                console.log("Toke payload verified data ", result)
                resolve(result)
            }
        })
    })   
}

const validateDates = (req, res, next) => {
    console.log(req.body)

    if (!req.body.startDate || !req.body.endDate) {
        return res.status(400).send({status: "Error", message: "startDate and endDate is required"})
    }

    var startDate = req.body.startDate.split("-")[2]
    var endDate = req.body.endDate.split("-")[2]

    var startMonth = req.body.startDate.split("-")[1]
    var endMonth = req.body.endDate.split("-")[1]

    var startYear = req.body.startDate.split("-")[0]
    var endYear = req.body.endDate.split("-")[0]
    //console.log(startDate, endDate)
    var dayCount 

    if (parseInt(startYear) != parseInt(endYear)) {
        return res.status(400).send({status: "Error", message: "startYear and endYear should be same"})
    }

    if (parseInt(startMonth) == parseInt(endMonth)) {
        if (parseInt(startDate) < new Date().getDate() + 1)  {
            return res.status(400).send({status: "Error", message: "startDate should be 1 + today's date. Because it takes one day for approving your application"})
        }       
        if (parseInt(startDate) > parseInt(endDate)) {
            console.log(1)
            return res.status(400).send({status: "Error", message: "endDate should be greater then startDate"})
        } else if (parseInt(startDate) == parseInt(endDate)) {
            console.log(2)
            dayCount = 1
            console.log("DayCount", dayCount)
            req.dayCount = dayCount
            //check available leaves days
            UserModel.findOne({email: req.email}, {remainingLeaves: 1}).then((userData) => {
                var diff_leaves = userData.remainingLeaves - dayCount
                if ((diff_leaves) < 0) {
                    console.log("Subtraction of leaves in 1", diff_leaves)
                    //return res.status(400).send({status: "Error", message: ``})
                    var alertBody = mailer.setAlertBody(req.email, diff_leaves)
                    mailer.sendMail(alertBody).then(() => {
                        next()
                    }).catch((err) => {
                        return res.status(400).send({status: "Error", message: err.message})
                    })
                } else {
                    next()
                }
            }).catch((err) => {
                return res.status(400).send({status: "Error", message: err.message})
            })
        } else {
            console.log(3)
            dayCount = (parseInt(endDate) - parseInt(startDate)) + 1
            console.log("DayCount", dayCount)
            req.dayCount = dayCount
            //check available leaves days 
            UserModel.findOne({email: req.email}, {remainingLeaves: 1}).then((userData) => {
                var diff_leaves = userData.remainingLeaves - dayCount
                if ((diff_leaves) < 0) {
                    console.log("Subtraction of leaves in 3", diff_leaves)
                    //return res.status(400).send({status: "Error", message: ``})
                    var alertBody = mailer.setAlertBody(req.email, diff_leaves)
                    console.log("Alert body is", alertBody)
                    mailer.sendMail(alertBody).then(() => {
                        next()
                    }).catch((err) => {
                        console.log(err)
                        return res.status(400).send({status: "Error", message: err.message})
                    })
                } else {
                    next()
                }
            }).catch((err) => {
                console.log(err)
                return res.status(400).send({status: "Error", message: err.message})
            })
        }
    } else if (parseInt(startMonth) > parseInt(endMonth)) {
        console.log(4)
        return res.status(400).send({status: "Error", message: "endDate should be greater then startDate"})
    } else {
        console.log(5)
        return res.status(400).send({status: "Error", message: "startDate and endDate should be from single month"})
    }

}

const isAdmin  = (req, res, next) => {
    const loginToken = req.headers["logintoken"]
    console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<", loginToken)
    verifyToken(loginToken).then((payload) => {
        console.log("^^^^^^^^^^^^^^^^^^^^^^", payload)
        if(payload.data.verified) {
            if(payload.data.role === "admin") {
                next()
            } else {
                res.status(401).send({status: "Error", message: "User cannot perform this action"})
            }
        } else {
            res.status(401).send({status: "Error", message: "You account is not verified yet."})
        }
    }).catch((err) => {
        res.send({status: "Error", message: err.message})
    })
}

const isNotApproved = (req, res, next) => {
    console.log("Inside isNotApproved")
    LeaveModel.findOne({leaveID: req.query.leaveID}, {status: 1}).then((data) => {
        console.log("Status is isNotApproved", data)
        if(data.status === "approved") {
            return res.status(400).send({status: "Error", message: "You cannot update approved report"})
        }
        console.log("Inside isNotApproved next")
        next()
    }).catch((err) => {
        console.log("Inside isNotApproved error")
        res.status(500).send({status: "Error", message: err.message})
    })
}

const isNotRejected = (req, res, next) => {
    LeaveModel.findOne({leaveID: req.query.leaveID}, {status: 1}).then((data) => {
        console.log("Status is isNotRejected", data)
        if(data.status === "rejected") {
            return res.status(400).send({status: "Error", message: "You cannot update rejected report"})
        }
        next()
    }).catch((err) => {
        res.status(500).send({status: "Error", message: err.message})
    })
}

const isPending = (req, res, next) => {
    LeaveModel.findOne({leaveID: req.query.leaveID}, {status: 1}).then((data) => {
        console.log("Status is ", data)
        if(!(data.status === "pending")) {
            return res.status(400).send({status: "Error", message: "You cannot perform this action"})
        }
        next()
    }).catch((err) => {
        res.status(500).send({status: "Error", message: err.message})
    })
}

const isSuggestion = (req, res, next) => {
    LeaveModel.findOne({leaveID: req.query.leaveID}, {status: 1}).then((data) => {
        console.log("Status is ", data)
        if(!(data.status === "suggestion")) {
            return res.status(400).send({status: "Error", message: "You cannot perform this action"})
        }
        next()
    }).catch((err) => {
        res.status(500).send({status: "Error", message: err.message})
    })
}

const isSuggestionOrPending = (req, res, next) => {
    LeaveModel.findOne({leaveID: req.query.leaveID}, {status: 1}).then((data) => {
        console.log("Status is ", data)
        if((data.status === "suggestion") || (data.status === "pending")) {
            console.log("Inside isSuggestionOrPending next()")
            return next()
        }
        res.status(400).send({status: "Error", message: "You cannot perform this action"})
    }).catch((err) => {
        res.status(500).send({status: "Error", message: err.message})
    })
}

module.exports = {
    isAuthorised,
    verifyToken,
    isUser,
    validateDates,
    isAdmin,
    isNotApproved,
    isNotRejected,
    isPending,
    isSuggestion,
    isSuggestionOrPending
}
