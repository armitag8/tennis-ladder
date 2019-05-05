const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const logger = require("morgan");
const bodyParser = require("body-parser");
const fs = require("fs");
const validator = require("validator");
const session = require("express-session");
const cookie = require("cookie");
const database = require("./src/database.js")

const router = express();

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
router.use(cookieParser());

router.use((req, res, next) => {
  req.user = ("user" in req.session) ? req.session.user : null;
  var username = req.user ? req.user : "";
  res.setHeader("Set-Cookie", cookie.serialize("username", username, {
    path: "/",
    maxAge: 60 * 60 * 24 * 31 // 1 month in number of seconds
  }));
  next();
});

const startServer = handler => process.env.NODE_ENV === "production" ?
  require("https").createServer({
    cert: fs.readFileSync("/etc/letsencrypt/live/utsc.tennisladder.ca/cert.pem", "utf8"),
    key: fs.readFileSync("/etc/letsencrypt/live/utsc.tennisladder.ca/privkey.pem", "utf8"),
    ca: fs.readFileSync("/etc/letsencrypt/live/utsc.tennisladder.ca/chain.pem", "utf8")
  }, handler).listen(443)
  : require("http").createServer(handler).listen(3001);

const isAuthenticated = (req, res, next) => req.user ? next() : res.status(401).end("Access Denied");

const sanitizeContent = (req, res, next) => {
  req.body.content = validator.escape(req.body.content);
  next();
}

const validateUserId = (req, res, next) => 
  validator.isEmail(req.params.id) ? next() : res.status(422).send("Not a valid email");

const handleError = error => res.status(error.code).send(error.message);

router.put("/api/user/:id", validateUserId, sanitizeContent, (req, res, next) => 
  database.inputUser(req.params.id).then(res.json).catch(handleError)
);

router.get("/api/user/", isAuthenticated, (req, res, next) => {
  let pageNumber = parseInt(req.query.page || "0", 10);
  database.getUsers(pageNumber).then(res.json).catch(handleError);
});

router.delete("/api/user/:id", isAuthenticated, validateUserId, (req, res, next) => {
  let userID = req.params.id;
  if (userID !== LADDER_MASTER && userID !== req.user)
    res.status(403).send();
  else
    database.deleteUser(userID).then(res.json).catch(handleError);
});

router.get("/api/week/:number/", isAuthenticated, (req, res, next) => console.log("wow"));

startServer(router);
