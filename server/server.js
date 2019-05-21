const config = require("../config.json");
const express = require("express");
const path = require("path");
const logger = require("morgan");
const bodyParser = require("body-parser");
const fs = require("fs");
const validator = require("validator");
const session = require("express-session");
const cookie = require("cookie");
const database = require("./src/database.js");
const NedbStore = require('connect-nedb-session')(session);
const mailer = require("nodemailer");

const transporter = mailer.createTransport({
  service: "gmail",
  auth: {
    user: config.admin,
    pass: config.password
  }
});

const START_DATE = new Date("2019-05-19");
const A_WEEK_IN_SECONDS = 7 * 24 * 60 * 60 * 1000;

const isProduction = () => process.env.NODE_ENV === "production";

const thisWeek = () => Math.floor((new Date() - START_DATE) / A_WEEK_IN_SECONDS);

const startServer = handler => {
  if (isProduction()) {
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
  let user = req.params._id;
  req.session.user = user;
  setUserCookie(user, res); res.setHeader("Set-Cookie", cookie.serialize(
    "invite",
    "",
    { path: "/", maxAge: 1 }
  ));
  res.json(user);
};

const setUserCookie = (user, res) => res.setHeader("Set-Cookie",
  cookie.serialize(
    "user",
    user,
    { path: "/", maxAge: 60 * 60 * 24 * 31 }
  ));

const isMod = (req, res, next) =>
  req.session.user === config.admin || config.mods.includes(req.session.user) ? next() :
    res.status(403).send("Access denied: moderators and administrator only");

const sanitizeUser = (req, res, next) => {
  try {
    req.body = new User(req.body);
  } catch (e) {
    res.status(422).send(e.message);
  }
  next();
}

const validateUserId = (req, res, next) => {
  if (validator.isEmail(req.params._id)) {
    req.params._id = req.params._id.toLowerCase();
    next()
  } else res.status(422).send("Not a valid email");
}

const checkIdMatchesBody = (req, res, next) =>
  req.params._id === req.body._id ? next() : res.status(422).send("Body does not match URL (ID).");

class User {
  constructor(user) {
    if (!user)
      throw Error("Not a valid user");
    else if (undefined === user._id || !validator.isEmail(user._id))
      throw Error("Not a valid email address");
    else if (undefined === user.lastname || !validator.isAlpha(user.lastname))
      throw Error("Not a valid last name");
    else if (undefined === user.firstname || !validator.isAlpha(user.firstname))
      throw Error("Not a valid first name");
    else if (!Number.isInteger(user.position) || user.position < 0)
      throw Error("Not a valid position")
    else if (!Number.isInteger(user.wins) || user.wins < 0)
      throw Error("Not a valid number of wins")
    else if (!Number.isInteger(user.losses) || user.losses < 0)
      throw Error("Not a valid number of losses")
    this._id = user._id.toLowerCase();
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
    if (undefined === game.player1 || !validator.isEmail(game.player1))
      throw Error("Not a valid email address1");
    else if (undefined === game.player2 || !validator.isEmail(game.player2))
      throw Error("Not a valid email address2");
    else if (game.player1 == game.player2)
      throw Error("Cannot play against yourself");
    else if (Number.isInteger(game.week) && game.week < 1)
      throw Error("Not a valid week number");
    else if (this.played && this.played !== true)
      throw Error("Not a valid 'played' flag");
    else if (this.played && (undefined === game.score || !this.isValidScore(game.score)))
      throw Error("Not a valid score");
    this.player1 = game.player1;
    this.player2 = game.player2;
    this.week = game.week || thisWeek();
    this.score = game.score;
    this.played = game.played || false;
  }

  isValidScore(score) {
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

const router = express();

router.use(bodyParser.json());
router.use(session({
  secret: "tennis-ladder-3][.;./-o0;,l98uyjbhl87r6tcruy5 534y;.][34a2s32afty6iu9y8-moi",
  cookie: { secure: isProduction() },
  resave: false,
  saveUninitialized: true,
  httpOnly: true,
  store: new NedbStore({ filename: 'db/sessions.db' })
}));
router.use(express.static(path.join(__dirname,
  isProduction() ? "../client/build/" : "../client/public/")
));
router.use(logger("dev"));
router.use(express.json());
router.use(express.urlencoded({ extended: false }));

// Sign out
router.put("/api/user/", (req, res, next) => {
  req.session.user = null;
  setUserCookie("", res);
  res.status(204).end();
});

// Sign in
router.put("/api/user/:_id", validateUserId, checkIdMatchesBody, (req, res, next) =>
  database.checkUser(req.body._id, req.body.password)
    .then(result => result ? authenticate(req, res) : res.status(401).send("Access denied"))
    .catch(error => res.status(error.code).send(error.message))
);

// Sign up
router.post("/api/user/:_id", validateUserId, checkIdMatchesBody, sanitizeUser,
  (req, res, next) =>
    database.addUser(req.body)
      .then(result => authenticate(req, res))
      .catch(error => res.status(error.code).send(error.message))
);

// Get Ranking
router.get("/api/user/", isAuthenticated, (req, res, next) => {
  let pageNumber = parseInt(req.query.page || "0", 10);
  database.getUsers(pageNumber)
    .then(users => users.length > 0 ? res.json(users) : res.status(204).send())
    .catch(error => res.status(error.code).send(error.message));
});

// Remove User
router.delete("/api/user/:_id", isAuthenticated, validateUserId, (req, res, next) => {
  let userID = req.params._id;
  if (!config.mods.concat([config.admin, userID]).includes(req.session.id))
    res.status(403).send("Access denied");
  else
    database.deleteUser(userID)
      .then(x => res.json(x))
      .catch(error => res.status(error.code).send(error.message));
});

// Move User into position (ADMIN)
router.put("/api/user/:_id/position/:pos", isMod, validateUserId, (req, res, next) =>
  database.moveUser(req.params._id, Number.parseInt(req.params.pos))
    .then(x => res.json(x))
    .catch(error => res.status(error.code).send(error.message))
);

// Get Scheduled Games
router.get("/api/games/scheduled/:_id", isAuthenticated, validateUserId, (req, res, next) =>
  database.getScheduledGames(req.params._id)
    .then(docs => res.json(docs))
    .catch(error => res.status(error.code).send(error.message))
);

// Record Game
router.post("/api/games/", isAuthenticated, (req, res, next) => {
  try {
    database.playGame(new Game(req.body))
      .then(doc => res.json(doc))
      .catch(error => res.status(error.code).send(error.message));
  } catch (e) {
    res.status(422).send(e.message);
  }
});

const inviteEmail = invite => `<h1>Welcome</h1>
<p>
  You've been invited to join ${config.club}'s Tennis Ladder. Click the link below if you'd like to
  join or to learn more.
</p>
<p>
<a href=${isProduction() ?   "https://" + config.publicURL : "http://localhost:3001"}/api/invite/${
    encodeURIComponent(invite._id)}/${invite.code}>Join Now</a>
</p>
<p>
  If you have received this email in error (you are not a patron of ${config.club}), please ignore it.
</p>
<p>
  You will receive no further emails regarding this offer, in accordance with CAN-SPAM regulations.
</p>
`

// Send Invite
router.post("/api/invite/:_id", isMod, validateUserId, (req, res, next) =>
  database.inviteUser(req.params._id)
    .then(invite => 
      transporter.sendMail({
        from: config.admin,
        to: req.params._id,
        subject: "Join Our Tennis Ladder",
        html: inviteEmail(invite)
      }, (err, info) =>
          err ? res.status(500).send("Email failure") : res.json(info.response)
      )
    )
    .catch(error => res.status(error.code).send(error.message))
);

// Confirm Invite
router.get("/api/invite/:_id/:code", validateUserId, (req, res, next) =>
  database.confirmInvite(req.params._id, req.params.code)
    .then(() => {
      res.setHeader("Set-Cookie", cookie.serialize(
        "invite",
        req.params._id,
        { path: "/", maxAge: 60 * 30 }
      ));
      res.redirect(isProduction() ? "/" : "http://localhost:3000/");
    })
    .catch(error => res.status(error.code).send(error.message))
);

const autoScheduleGames = () => {
  database.scheduleGames(thisWeek());
  setTimeout(() => autoScheduleGames(), A_WEEK_IN_SECONDS);
}

autoScheduleGames();

database.inviteUser(config.admin, true).then(console.log).catch(console.log);

startServer(router);
