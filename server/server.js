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

router.use(bodyParser.json());
router.use(session({
  secret: "tennis-ladder-3][.;./-o0;,l98uyjbhl87r6tcruy5 534y;.][34a2s32afty6iu9y8-moi",
  resave: false,
  saveUninitialized: true,
}));
router.use(express.static(path.join(__dirname,
  process.env.NODE_ENV === "production" ? "tennis-ladder/build/" : "public/")
));
router.use(logger("dev"));
router.use(express.json());
router.use(express.urlencoded({
  extended: false
}));
//router.use(cookieParser());

class User {
  constructor(user) {
    this._id = user._id;
    this.password = user.password;
    this.firstname = validator.escape(user.firstname);
    this.lastname = validator.escape(user.lastname);
  }
}

const startServer = handler => process.env.NODE_ENV === "production" ?
  require("https").createServer({
    cert: fs.readFileSync("/etc/letsencrypt/live/utsc.tennisladder.ca/cert.pem", "utf8"),
    key: fs.readFileSync("/etc/letsencrypt/live/utsc.tennisladder.ca/privkey.pem", "utf8"),
    ca: fs.readFileSync("/etc/letsencrypt/live/utsc.tennisladder.ca/chain.pem", "utf8")
  }, handler).listen(443)
  : require("http").createServer(handler).listen(3001);

const isAuthenticated = (req, res, next) => 
  req.session.user ? next() : res.status(401).end("Access Denied");

const authenticate = (req, res) => {
  user = req.params._id;
  res.setHeader("Set-Cookie", cookie.serialize("user", user, {
      path: "/",
      maxAge: 60 * 60 * 24 * 31
  }));
  console.log("USER: " + user);
  req.session.user = user;
  res.json(user);
};

const sanitizeUser = (req, res, next) => {
  req.body = new User(req.body);
  next();
}

const validateUserId = (req, res, next) => 
  validator.isEmail(req.params._id) ? next() : res.status(422).send("Not a valid email");

const checkIdMatchesBody = (req, res, next) =>
  req.params._id === req.body._id ? next() : res.status(422).send("Body does not match URL (ID).");

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

startServer(router);
