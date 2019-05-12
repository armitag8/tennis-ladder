const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const bodyParser = require("body-parser");
const fs = require("fs");
const validator = require("validator");
const session = require("express-session");
const cookie = require("cookie");
const database = require("./src/database.js")

const router = express();

const LADDER_MASTER = "joe.armitage@mail.utoronto.ca";
const startDate = new Date("2019-05-19");

router.use(bodyParser.json());
router.use(session({
  secret: "tennis-ladder-3][.;./-o0;,l98uyjbhl87r6tcruy5 534y;.][34a2s32afty6iu9y8-moi",
  resave: false,
  saveUninitialized: true,
}));
router.use(express.static(path.join(__dirname,
  process.env.NODE_ENV === "production" ? "../client/build/" : "../client/public/")
));
router.use(logger("dev"));
router.use(express.json());
router.use(express.urlencoded({
  extended: false
}));
//router.use(cookieParser());

class User {
  constructor(user) {
    if (! user)
      throw Error("Not a valid user");
    else if (undefined === user._id || ! validator.isEmail(user._id))
      throw Error("Not a valid email address");
    else if (undefined === user.lastname || ! validator.isAlpha(user.lastname))
      throw Error("Not a valid last name");
    else if (undefined === user.firstname || ! validator.isAlpha(user.firstname))
      throw Error("Not a valid first name");
    else if (! Number.isInteger(user.position) || user.position < 0)
      throw Error("Not a valid position")
    else if (! Number.isInteger(user.wins) || user.wins < 0)
      throw Error("Not a valid number of wins")
    else if (! Number.isInteger(user.losses) || user.losses < 0)
      throw Error("Not a valid number of losses")
    this._id = user._id;
    this.password = user.password;
    this.firstname = user.firstname;
    this.lastname = user.lastname;
    this.position = user.position;
    this.wins = user.wins;
    this.losses = user.losses;
  }
}

class Game {
  constructor(game) {
    if (undefined === game.player1 || ! validator.isEmail(game.player1))
      throw Error("Not a valid email address1");
    else if (undefined === game.player2 || ! validator.isEmail(game.player2))
      throw Error("Not a valid email address2");
    else if (game.player1 == game.player2)
      throw Error("Cannot play against yourself");
    else if (Number.isInteger(game.week) && game.week < 1)
      throw Error("Not a valid week number");
    else if (undefined === game.score || ! this.isValidScore(game.score))
      throw Error("Not a valid score");
    this.player1 = game.player1;
    this.player2 = game.player2;
    this.week = game.week || Math.floor((new Date() - startDate) / (7 * 24 * 60 * 60 * 1000));
    this.score = game.score;
  }

  isValidScore(score){
      let s0 = score[0];
      let s1 = score[1];
      let s2 = score[2];
      let s3 = score[3];
      if (s0 === 8 && s1 <= 6 && s1 >= 0)
          return true;
      else if (s1 === 8 && s0 <= 6 && s0 >= 0)
          return true;
      else if (s0 === 9 && s1 === 7)
          return true;
      else if (s1 === 9 && s0 === 7)
          return true;
      else if (s0 === 8 && s1 === 8 && s2 - s3 >= 2 && s2 > 10 && s3 > 0)
          return true;
      else if (s0 === 8 && s1 === 8 && s3 - s2 >= 2 && s3 > 10 && s2 > 0)
          return true;
      else
          return false;
  }
}

const startServer = handler => {
  if (process.env.NODE_ENV === "production") {
    require("https").createServer({
      cert: fs.readFileSync("/etc/letsencrypt/live/utsc.tennisladder.ca/cert.pem", "utf8"),
      key: fs.readFileSync("/etc/letsencrypt/live/utsc.tennisladder.ca/privkey.pem", "utf8"),
      ca: fs.readFileSync("/etc/letsencrypt/live/utsc.tennisladder.ca/chain.pem", "utf8")
    }, handler).listen(443);
    require("http").createServer(
      express().use((req, res) => res.redirect(`https://${req.headers.host}${req.url}`)).listen(80)
    );
  } else require("http").createServer(handler).listen(3001); 
}

const isAuthenticated = (req, res, next) => 
  req.session.user ? next() : res.status(401).end("Access Denied");

const authenticate = (req, res) => {
  user = req.params._id;
  res.setHeader("Set-Cookie", cookie.serialize("user", user, {
      path: "/",
      maxAge: 60 * 60 * 24 * 31
  }));
  req.session.user = user;
  res.json(user);
};

const sanitizeUser = (req, res, next) => {
  try {
    req.body = new User(req.body);
  } catch (e) {
    res.status(422).send(e.message);
  } 
  next();
}

const validateUserId = (req, res, next) => 
  validator.isEmail(req.params._id) ? next() : res.status(422).send("Not a valid email");

const checkIdMatchesBody = (req, res, next) =>
  req.params._id === req.body._id ? next() : res.status(422).send("Body does not match URL (ID).");

// Sign out
router.put("/api/user/", (req, res, next) => {
  req.session.user = null;
  res.setHeader("Set-Cookie", cookie.serialize("user", "", {
      path: "/",
      maxAge: 60 * 60 * 24 * 31
  }));
  res.status(200).end();
});

// Sign in
router.put("/api/user/:_id", validateUserId, checkIdMatchesBody, (req, res, next) =>
  database.checkUser(req.body._id, req.body.password)
  .then(result => result ? authenticate(req, res) : res.status(401).send("access denied"))
  .catch(error => res.status(error.code).send(error.message))
);

// Sign up
router.post("/api/user/:_id", validateUserId, checkIdMatchesBody, sanitizeUser,
  (req, res, next) => 
    database.addUser(req.body)
    .then(result => authenticate(req, res))
    .catch(error => res.status(error.code).send(error.message))
);

router.get("/api/user/", isAuthenticated, (req, res, next) => {
  let pageNumber = parseInt(req.query.page || "0", 10);
  database.getUsers(pageNumber).then(users => res.json(users)).catch(
    error => res.status(error.code).send(error.message));
});

router.delete("/api/user/:_id", isAuthenticated, validateUserId, (req, res, next) => {
  let userID = req.params._id;
  if (userID !== LADDER_MASTER && userID !== req.user)
    res.status(403).send("access denied");
  else
    database.deleteUser(userID).then(res.json).catch(
      error => res.status(error.code).send(error.message));
});

router.get("/api/week/:number/", isAuthenticated, (req, res, next) => {
  let pageNumber = parseInt(req.query.page || "0", 10);
  database.getUsers(pageNumber)
  .then(users => res.json(users))
  .catch(error => res.status(error.code).send(error.message));
});

router.post("/api/games/", isAuthenticated, (req, res, next) => {
  try {
    console.log(req.body);
    database.addGame(new Game(req.body))
    .then(console.log).catch(error => res.status(error.code).send(error.message));
  } catch (e) {
    res.status(422).send(e.message);
  }
});

startServer(router);
