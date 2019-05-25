const config = require("../../config.json");
const credentials = require("../credentials.json");
const express = require("express");
const path = require("path");
const logger = require("morgan");
const bodyParser = require("body-parser");
const fs = require("fs");
const validator = require("validator");
const session = require("express-session");
const cookie = require("cookie");
const database = require("./database.js");
const NedbStore = require('connect-nedb-session')(session);
const mailer = require("nodemailer");
const schedule = require("node-schedule");

const transporter = mailer.createTransport({
  service: "gmail",
  auth: {
    user: config.admin,
    pass: credentials.email
  }
});


const WEEK_IN_SECONDS = 7 * 24 * 60 * 60 * 1000;

const isProduction = () => process.env.NODE_ENV === "production";

const thisWeek = () => Math.floor((new Date() - new Date(config.startDate)) / WEEK_IN_SECONDS) + 1;

const startServer = handler => {
  if (isProduction()) {
    require("https").createServer({
      cert: fs.readFileSync(`/etc/letsencrypt/live/${config.publicURL}/cert.pem`, "utf8"),
      key: fs.readFileSync(`/etc/letsencrypt/live/${config.publicURL}/privkey.pem`, "utf8"),
      ca: fs.readFileSync(`/etc/letsencrypt/live/${config.publicURL}/chain.pem`, "utf8")
    }, handler).listen(443);
    require("http").createServer(
      express().use((req, res) => res.redirect(`https://${req.headers.host}${req.url}`)).listen(80)
    );
  } else require("http").createServer(handler).listen(3001);
}

const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    setUserCookie(req.session.user, res);
    next()
  } else res.status(401).end("Access Denied");
};

const authenticate = (req, res) => {
  let user = req.params._id;
  req.session.user = user;
  setUserCookie(user, res); 
  res.setHeader("Set-Cookie", cookie.serialize(
    "invite",
    "",
    { path: "/", maxAge: 1 }
  ));
  if (isMod(req))  
    res.setHeader("Set-Cookie", cookie.serialize(
      "mod",
      "true",
      { path: "/", maxAge: 60 * 60 * 24 * 31 }
    ));
  res.status(201).send();
};

const unAuthenticate = (req, res, next) => {
  req.session.user = null;
  setUserCookie("", res);
  res.setHeader("Set-Cookie", cookie.serialize(
    "mod",
    "",
    { path: "/", maxAge: 60 * 60 * 24 * 31 }
  ));
  res.status(204).end();
}

const setUserCookie = (user, res) => res.setHeader("Set-Cookie",
  cookie.serialize(
    "user",
    user,
    { path: "/", maxAge: 60 * 60 * 24 * 31 }
  )); 

const isMod = (req) => req.session.user === config.admin || credentials.mods.includes(req.session.user);

const checkMod = (req, res, next) =>
  isMod(req) ? next() : res.status(403).send("Access denied: moderators and administrator only");

const checkOwnerOrMod = (req, res, next) =>
  isMod(req) || req.params._id === req.session.user ? next() : res.status(403).send("Access denied");

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
    if (user.password.length < 5) 
      throw Error("Password must have at least 5 characters");
    else if (validator.escape(user.password) !== user.password)
      throw Error("Password cannot contain: <, >, &, ', \" or /");
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
    else if (game.player1 === game.player2)
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
    else if (s0 === 8 && s1 === 8 && s2 - s3 >= 2 && s2 > 9 && s3 > 0)
      return true;
    else if (s0 === 8 && s1 === 8 && s3 - s2 >= 2 && s3 > 9 && s2 > 0)
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
  isProduction() ? "../../client/build/" : "../../client/public/")
));
router.use(logger("dev"));
router.use(express.json());
router.use(express.urlencoded({ extended: false }));

// Sign out
router.put("/api/user/", unAuthenticate);

// Sign in
router.put("/api/user/:_id", validateUserId, checkIdMatchesBody, (req, res, next) =>
  database.checkUser(req.body._id, validator.escape(req.body.password))
    .then(result => result ? authenticate(req, res) : res.status(401).send("Access denied"))
    .catch(error => res.status(error.code).send(error.message))
);

// Sign up
router.post("/api/user/:_id", validateUserId, checkIdMatchesBody, sanitizeUser,
  (req, res, next) =>
    database.addUser(new User(req.body))
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
router.delete("/api/user/:_id", isAuthenticated, validateUserId, checkOwnerOrMod, (req, res, next) => {
  let userID = req.params._id;
  if (userID === config.admin)
    res.status(422).send("Cannot delete administrator");
  else
    database.deleteUser(userID)
      .then(res.status(204).send())
      .catch(error => res.status(error.code).send(error.message));
});

// Move User into position (ADMIN)
router.put("/api/user/:_id/position/:pos", checkMod, validateUserId, (req, res, next) =>
  database.moveUser(req.params._id, Number.parseInt(req.params.pos))
    .then(x => res.status(200).send())
    .catch(error => res.status(error.code).send(error.message))
);

// Modify User
router.patch("/api/user/:_id", isAuthenticated, validateUserId, checkOwnerOrMod, (req, res, next) => {
  let firstname = req.body.firstname;
  let lastname = req.body.lastname;
  if ((! firstname || validator.isAlpha(firstname)) && (! lastname || validator.isAlpha(lastname)))
    database.updateUser(req.params._id, firstname, lastname, validator.escape(req.body.password))
      .then(result => res.json(result))
      .catch(error => res.status(error.code).send(error.message));
  else
    res.status(422).send("Invalid name(s)");
});

// Get Scheduled Games
router.get("/api/games/scheduled/:_id", isAuthenticated, validateUserId, (req, res, next) =>
  database.getScheduledGames(req.params._id)
    .then(docs => res.json(docs))
    .catch(error => res.status(error.code).send(error.message))
);

// Get Past Games
router.get("/api/games/past/:_id", isAuthenticated, validateUserId, (req, res, next) =>
  database.getPastGames(req.params._id)
    .then(docs => res.json(docs))
    .catch(error => res.status(error.code).send(error.message))
);

const beautifyAddress = (name, address) => `${name} 🎾 <${validator.normalizeEmail(address)}>`;

const gamePlayedEmail = game => (
`
<h2>Match Recorded</h2>
<p>A match has been recorded:</p>
<h3>Score<h3>
<ul>
  <li>${game.player1}: ${game.score[0]}</li>
  <li>${game.player2}: ${game.score[1]}</li>
</ul>
${game.score.length < 3 ? "" : `
<h4>Tiebreak</h4>
<ul>
  <li>${game.player1}: ${game.score[2]}</li>
  <li>${game.player2}: ${game.score[3]}</li>
</ul>`}
`
);

// Record Game
router.post("/api/games/", isAuthenticated, (req, res, next) => {
  try {
    let game = new Game(req.body);
    database.playGame(game)
      .then(ok => {
        transporter.sendMail({
          from: beautifyAddress("Tennis Ladder", config.admin),
          to: `${game.player1}, ${game.player2}`,
          subject: "New Match Score",
          html: gamePlayedEmail(game)
        }, err => err ? res.status(500).send("Email failure") : res.status(201).send());
      }).catch(error => res.status(error.code).send(error.message));
  } catch (e) {
    res.status(422).send(e.message);
  }
});

const inviteEmail = (invite, isMod) => `<h2>Welcome</h2>
<p>
  You've been invited to join ${config.club}'s Tennis Ladder${isMod ? 
    " and will be granted <em>moderator</em> privileges (inviting, deleting and moving players)" 
    : ""}. Click the link below if you'd like to join or to learn more.
</p>
<p>
<a href=${isProduction() ? "https://" + config.publicURL : "http://localhost:3001"}/api/invite/${
  encodeURIComponent(invite._id)}/${invite.code}>Join Now</a>
</p>
<p>
  You are receiving this email because we believe you have participated in our Tennis Ladder before,
  or have expressed an interest in doing so this year, and we hope that you would like ot again.
  If you have received this email in error (you are not a patron of ${config.club}), please ignore it.
</p>
`

const sendInvite = (invite, to, succ, fail, isMod=false) =>
  transporter.sendMail({
    from: beautifyAddress("Tennis Ladder", config.admin),
    to: to,
    subject: "Join Our Tennis Ladder",
    html: inviteEmail(invite, isMod)
  }, err => err ? fail() : succ());

// Send Invite
router.post("/api/invite/:_id", checkMod, validateUserId, (req, res, next) =>
  database.inviteUser(req.params._id)
    .then(invite => sendInvite(
      invite,
      req.params._id,
      () => res.status(201).send(),
      () => res.status(500).send("Email failure")
    )).catch(error => res.status(error.code).send(error.message))
);

// Confirm Invite
router.get("/api/invite/:_id/:code", validateUserId, (req, res, next) =>
  database.confirmInvite(req.params._id, validator.escape(req.params.code))
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

const gameScheduledEmail = game => (
  `
<h2>New Match: Week ${game.week}</h2>
<p>
  A new match has been scheduled this week between the two recipients of this email:
</p>
<ol>
  <li><a href="mailto:${game.player1}">${game.player1}</a></li>
  <li><a href="mailto:${game.player2}">${game.player2}</a></li>
</ol>
<p>
  Please, if possible, arrange a time to play when is convenient for both of you.
</p>
<p>
  Visit <a href="${config.publicURL}"">The Website</a> for more information and to record 
  the score once the match has been played.
</p>
<p>
  Reminder: playing no games in a week may affect your ranking in the ladder. 
  Missing too many weeks may result in your removal from the ladder.
</p>
`
);

const sendGameNotification = game => {
  transporter.sendMail({
    from: beautifyAddress("Tennis Ladder", config.admin),
    to: `${game.player1}, ${game.player2}`,
    subject: "Match Scheduled",
    html: gameScheduledEmail(game)
  }, (err, info) => err ? console.log(err) : console.log(info.response))
}

const autoScheduleGames = () => {
  let recurrance = new schedule.RecurrenceRule();
  recurrance.dayOfWeek = 1; // Monday
  recurrance.hour = 12; // 1 PM (GMT => 8 AM EST)
  recurrance.minute = 0;
  schedule.scheduleJob(recurrance, () => database.scheduleGames(thisWeek(), sendGameNotification),
    () => console.log(`scheduled games for week ${thisWeek()}`));
}

const inviteList = (list, isMod=false) => list.forEach(user => 
  validator.isEmail(user) ? database.inviteUser(user).then(
    invite => sendInvite(
      invite,
      user,
      () => console.log(`${isMod ? "Moderator: " : "User: "}${user} has been invited.`),
      () => console.log("Email failure"),
      isMod
  )).catch(console.log) : console.log(`invalid email: ${user}`)
);

const initialize = () => {
  if (isProduction()) {
    inviteList(credentials.mods, true);
    autoScheduleGames();
  } else {
    inviteList(credentials.test);
    setTimeout(() => database.scheduleGames(thisWeek(), sendGameNotification), 100000);
  };
  
  database.inviteUser(config.admin, true)
    .then(() => database.addUser(new User({
      _id: config.admin,
      firstname: config.owner.split(" ")[0],
      lastname: config.owner.split(" ")[1],
      password: credentials.admin,
      position: 1,
      wins: 0,
      losses: 0
    })).then(console.log)
    ).catch(console.log);
}

module.exports = {
  inviteList: inviteList,
  initialize: initialize,
  startServer: startServer,
  router: router  
};