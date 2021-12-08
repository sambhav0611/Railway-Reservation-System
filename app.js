const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = new express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

// mongoose.connect("");

mongoose
    .connect("mongodb+srv://RailwayReservation:999999ss@railwayreservation.rwpn6.mongodb.net/RailwayReservation?retryWrites=true&w=majority", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() =>
        app.listen(3333, () =>
            console.log("Database Connected!", "Listening on Port " + 3333)
        )
    );
const trainSchema = new mongoose.Schema({
  number: Number,
  name: String,
  source: String,
  destination: String,
  fare: Number,
  departure: String,
  arrival: String,
  available: Number,
  booked: Number
});
const userSchema = new mongoose.Schema({
  username: String,
  password: String
})
const adminSchema = new mongoose.Schema({
  username: String,
  password: String
})
const ticketSchema = new mongoose.Schema({
  username: String,
  number: Number,
  name: String,
  source: String,
  destination: String,
  fare: Number,
  departure: String,
  arrival: String,
  seats: Number,
  dateofjourney: String,
})

const Train = new mongoose.model("train", trainSchema);
const User = new mongoose.model("user", userSchema);
const Admin = new mongoose.model("admin", adminSchema);
const Ticket = new mongoose.model("ticket", ticketSchema);

// This object is used for booking purpose
var current;

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
})

app.route("/userregister")
.get((req, res) => {
  res.sendFile(__dirname + "/register.html");
})
.post((req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  })
  user.save();
  res.sendFile(__dirname + "/userPage.html");
});

app.route("/userlogin")
.get((req, res) => {
  res.sendFile(__dirname + "/userLogin.html");
})
.post((req, res) => {
  User.findOne({username: req.body.username}, (error, foundUser) => {
    if (error) res.send(error);
    else {
      if (!foundUser) {
        res.render("response.ejs", {content: "You are not registered."});
      }
      else {
        if (foundUser.password == req.body.password) {
          res.sendFile(__dirname + "/userPage.html");
        }
        else {
          res.render("response.ejs", {content: "You Entered incorrect password"});
        }
      }
      
    }
  })
})

app.route("/adminlogin")
.get((req, res) => {
  res.sendFile(__dirname + "/adminPage.html");
})


app.route("/addtrain")
.get((req, res) => {
  res.sendFile(__dirname + "/addTrain.html");
})
.post((req, res) => {
  const newTrain = new Train({
    number: req.body.trainNumber,
    name: req.body.trainName,
    source: req.body.source,
    destination: req.body.destination,
    fare: req.body.fare,
    departure: req.body.departure,
    arrival: req.body.arrival,
    available: req.body.total,
    booked: 0
  })

  newTrain.save((error) => {
    if (error) res.send(error);
    else res.render("response.ejs", {content: "Train added successufully."});
  });
})

app.get("/showtrains", (req, res) => {
  Train.find({}, (error, foundTrains) => {
    if (error) res.send(error);
    else {
      res.render("showTrains.ejs", {trainList: foundTrains});
    }
  })
});

app.route("/enquiry")
.get((req, res) => {
  var today = new Date() 
  var dd = String(today.getDate() + 1).padStart(2, "0"); 
  var mm = String(today.getMonth()).padStart(2, "0"); 
  var yyyy = today.getFullYear(); 
  res.render("enquiry.ejs", {date: yyyy + "-" + mm + "-" + dd})
})
.post((req, res) => {
  Train.findOne({source: req.body.source, destination: req.body.destination}, (error, foundTrain) => {
    if (error) res.send(error)
    else {
      if (!foundTrain) res.send("Train not found");
      else {
        current = foundTrain;
        console.log(current);
        res.render("result.ejs", {train: foundTrain});
      }
    }
  })
});

app.route("/bookticket")
.get((req, res) => {
  console.log("clicked");
  res.sendFile(__dirname + "/ticketForm.html");
})
.post((req, res) => {
  const newAvailable = current.available - req.body.seats
  if (newAvailable < 0) {
    res.render("response.ejs", {content: "Ticket booked successfully"});
  }
  const ticket = new Ticket({
    username: req.body.username,
    number: current.number,
    name: current.name,
    source: current.source,
    destination: current.destination,
    fare: current.fare*req.body.seats,
    departure: current.departure,
    arrival: current.arrival,
    seats: req.body.seats,
    dateofjourney: req.body.date,
  })
  
  ticket.save((error, ticket) => {
    if (error) res.send(error);
    else {
      Train.updateOne({number: current.number}, {available: newAvailable});
      res.render("booked.ejs", {pnr: ticket._id});
    }
  });
});

app.get("/viewtickets", (req, res) => {
  Ticket.find({}, (error, foundTickets) => {
    if (error) res.send(error);
    else {
      res.render("viewTickets.ejs", {ticketList: foundTickets});
    }
  })
});

app.route("/reshedule")
.get((req, res) => {
  res.sendFile(__dirname + "/resheduleForm.html");
})
.post((req, res) => {
  console.log(req.body.number);
  Train.findOneAndUpdate({number: req.body.number}, {
    fare: req.body.fare,
    departure: req.body.departure,
    arrival: req.body.arrival
  },
  (error, foundTrain) => {
    if (error) res.send(error);
    else {
      res.send(foundTrain);
    }
  })
  res.render("response.ejs", {content: "Train rescheduled successfully."});
});

app.route("/cancelticket")
.get((req, res) => {
  res.sendFile(__dirname + "/cancellationForm.html");
})
.post((req, res) => {
  Ticket.findByIdAndRemove(req.body.pnr, (error, ticket) => {
    if (error) res.send(error);
    else {
      res.render("response.ejs", {content: "Ticket cancelled successfully."});
    }
  });
})

// app.listen(4000, () => {
//   console.log("Server is up and running on post: 3000");
// })