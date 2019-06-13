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

const siteURL = isProduction() ? "https://" + config.publicURL : "http://localhost:3001";

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
    autoScheduleGames();
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
  res.append("Set-Cookie", cookie.serialize(
    "invite",
    "",
    { path: "/", maxAge: 1 }
  ));
  if (isMod(req))
    res.append("Set-Cookie", cookie.serialize(
      "mod",
      "true",
      { path: "/", maxAge: 60 * 60 * 24 * 31 }
    ));
  res.status(201).send();
};

const unAuthenticate = (req, res, next) => {
  req.session.user = null;
  setUserCookie("", res);
  res.append("Set-Cookie", cookie.serialize(
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
    this._id = user._id.toLowerCase();
    this.password = user.password;
    this.firstname = user.firstname;
    this.lastname = user.lastname;
    this.position = user.position;
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
    else if (this.confirmed && this.confirmed !== true)
      throw Error("Not a valid 'confirmed' flag");
    this.player1 = game.player1;
    this.player2 = game.player2;
    this.week = game.week || thisWeek();
    this.score = game.score;
    this.played = game.played || false;
    this.confirmed = game.confirmed || false;
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
const frontend = path.join(__dirname, isProduction() ? "../../client/build/" : "../../client/public/");
router.use(express.static(frontend));
router.get(/^\/((?!(api)).)*$/, (req, res, next) => res.sendFile(frontend));
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

// Get Rankings
router.get("/api/user/", isAuthenticated, (req, res, next) => {
  let pageNumber = parseInt(req.query.page || "0", 10);
  database.getUsers(pageNumber, validator.escape(req.query.search || ""))
    .then(users => users.length > 0 ? res.json(users) : res.status(204).send())
    .catch(error => res.status(error.code).send(error.message));
});

// Get User Data
router.get("/api/user/:_id", isAuthenticated, validateUserId, checkOwnerOrMod, (req, res, next) =>
  database.getUser(req.params._id)
    .then(user => res.json(user))
    .catch(error => res.status(error.code).send(error.message))
);

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
  if ((!firstname || validator.isAlpha(firstname)) && (!lastname || validator.isAlpha(lastname)))
    database.updateUser(req.params._id, firstname, lastname, validator.escape(req.body.password))
      .then(result => res.json(result))
      .catch(error => res.status(error.code).send(error.message));
  else
    res.status(422).send("Invalid name(s)");
});

// ADMIN: Schedule a Game
router.post("/api/games/scheduled/:player1/:player2", isAuthenticated, checkMod, (req, res, next) => {
  let game = new Game({
    player1: req.params.player1,
    player2: req.params.player2,
  });
  database.scheduleGame(game)
    .then(result => {
      sendGameNotification(game);
      res.json(result);
    }).catch(error => res.status(error.code).send(error.message))
});

// ADMIN: Get all Scheduled Games
router.get("/api/games/scheduled/", isAuthenticated, checkMod, (req, res, next) =>
  database.getAllScheduledGames()
    .then(docs => res.json(docs))
    .catch(error => res.status(error.code).send(error.message))
);

const gameRejectedEmail = async game => (
  `
<h3>Match Score Rejected</h3>
<p>
Your opponent, ${await makeMailToLink(game.player2)}, 
rejected the match score you posted for week ${game.week}.
</p>
<p>
Please contact your opponent to find out why. Either of you may now enter a new score for this match.
You may respond to this email or contact a court supervisor for additional help.
</p>
` + emailFooter);


const matchCancelledEmail = (admin, opponent, week) => (
  `
<h3>Scheduled Match Cancelled</h3>
<p>
Your match against ${opponent} for week ${week} was cancelled by ${admin}.
</p>
<p>
You may still play this match, by challenge, if you wish. 
You may respond to this email or contact a court supervisor to find out why your match was cancelled.
</p>
` + emailFooter);

// Delete Game
router.delete("/api/games/:_id", isAuthenticated, (req, res, next) =>
  !validator.isAlphanumeric(req.params._id) ? res.status(422).send("invalid ID") :
    database.deleteGame(req.params._id, isMod(req))
      .then(async game => Promise.all(game.played ?
          [sendEmail(game.player1, "Match Score Rejected", await gameRejectedEmail(game))] :
          [
            sendEmail(game.player1, "Scheduled Match Cancelled", matchCancelledEmail(
              req.session.user, await makeMailToLink(game.player2), game.week)),
            sendEmail(game.player2, "Scheduled Match Cancelled", matchCancelledEmail(
              req.session.user, await makeMailToLink(game.player1), game.week))
          ]).then(result => res.json(result))
          .catch(error => res.status(error.code).send(error.message))
      ).catch(error => res.status(error.code).send(error.message))
);

// ADMIN: Delete game by players and week
router.delete("/api/games/:player1/:player2/:week", isAuthenticated, checkMod, (req, res, next) =>
  !validator.isEmail(req.params.player1) ||
    !validator.isEmail(req.params.player2) ||
    !validator.isInt(req.params.week) ?
    res.status(422).send("invalid ID") :
    database.deleteGameAdmin(req.params.player1, req.params.player2, Number.parseInt(req.params.week))
      .then(result => res.json(result))
      .catch(error => res.status(error.code).send(error.message))
);

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

// Get Past Games (Filtered)
router.get("/api/games/past/:_id/:opponent", isAuthenticated, validateUserId, (req, res, next) =>
  !validator.isEmail(req.params.opponent) ? res.status(422).send("Not a valid email") :
    database.getPastGames(req.params._id, req.params.opponent)
      .then(docs => res.json(docs))
      .catch(error => res.status(error.code).send(error.message))
);

const emailFooter = (
  `
<footer>
<p>
You are receiving this email because you are a member of ${config.club}'s Tennis Ladder.
If you would like to <em>unsubscribe</em>, you must delete your account 
<a href="${siteURL}/profile">here</a>.
</p>
<p>
If you have received this email in error (you are not a patron of ${config.club}), please ignore it,
or respond to it to alert us if the issue is ongoing.
</p>
</footer>
`);

const beautifyAddress = async address => {
  let user = await database.getUser(address)
  return `${user.firstname} ${user.lastname} 🎾 <${validator.normalizeEmail(address)}>`;
}

const makeMailToLink = async address => {
  let user = await database.getUser(address);
  return `<a href="mailto:${address}">${user.firstname} ${user.lastname}</a>`;
}

const gamePlayedEmail = (opponent, score) => (
  `
<h2>Match Score Recorded</h2>
<p>Did you just play a match? Your opponent, ${opponent} recorded a score:</p>
<h3>Score</h3>
<ul>
  <li>${opponent}: ${score[0]}</li>
  <li>You: ${score[1]}</li>
</ul>
${score.length < 3 ? "" : `
<h3>Tiebreak</h3>
<ul>
  <li>${opponent}: ${score[2]}</li>
  <li>You: ${score[3]}</li>
</ul>`}
<p>Please <strong>confirm</strong> this score on <a href=${siteURL}/matches>the website</a></p>
` + emailFooter);

const sendEmail = (to, subject, content) => new Promise((resolve, reject) => transporter.sendMail({
  from: beautifyAddress(config.admin),
  to: to,
  subject: subject,
  html: content
}, err => err ? reject("Email failure") : resolve(true)));

// Record Game
router.post("/api/games/", isAuthenticated, (req, res, next) => {
  try {
    let game = new Game(req.body);
    if (req.session.user !== game.player1 && !isMod())
      return res.status(422).send("Submitter must be player1 or admin");
    database.playGame(game)
      .then(async ok => transporter.sendMail({
        from: beautifyAddress(config.admin),
        to: game.player2,
        subject: "Confirm New Match Score",
        html: gamePlayedEmail(await makeMailToLink(game.player1), game.score)
      }, err => err ? res.status(500).send("Email failure") : res.status(201).send())
      ).catch(error => res.status(error.code).send(error.message));
  } catch (e) {
    res.status(422).send(e.message);
  }
});

// Confirm Game Score
router.put("/api/games/:_id/confirmation", isAuthenticated, (req, res, next) =>
  !validator.isAlphanumeric(req.params._id) ? res.status(422).send("Invalid Game ID") :
    database.confirmGame(req.params._id, req.session.user)
      .then(result => res.json(result))
      .catch(error => res.status(error.code).send(error.message))
);

const inviteEmail = (invite, isMod) => `<h2>Welcome</h2>
<p>
  You've been invited to join ${config.club}'s Tennis Ladder${isMod ?
    " and will be granted <em>moderator</em> privileges (inviting, deleting and moving players)"
    : ""}. Click the link below if you'd like to join or to learn more.
</p>
<p>
<a href=${siteURL}/api/invite/${
  encodeURIComponent(invite._id)}/${invite.code}>Join Now</a>
</p>
<p>
  You are receiving this email because we believe you have participated in our Tennis Ladder before,
  or have expressed an interest in doing so this year, and we hope that you would like to again.
  If you have received this email in error (you are not a patron of ${config.club}), please ignore it.
</p>
`

const sendInvite = (invite, to, succ, fail, isMod = false) =>
  transporter.sendMail({
    from: beautifyAddress(config.admin),
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
    .then(exists => {
      if (!exists) res.setHeader("Set-Cookie", cookie.serialize(
        "invite",
        req.params._id,
        { path: "/", maxAge: 60 * 30 }
      ));
      res.redirect(isProduction() ? "/" : "http://localhost:3000/");
    })
    .catch(error => res.status(error.code).send(error.message))
);

// Delete Invite
router.delete("/api/invite/:_id", validateUserId, checkOwnerOrMod, (req, res, next) => 
    database.removeInvite(req.params._id)
      .then(result => res.json(result))
      .catch(error => res.status(error.code).send(error.message))
);

//router.get("*", (req, res) => res.redirect("/"));

const gameScheduledEmail = (game, player1, player2) => (
  `
<h2>New Match Scheduled: Week ${game.week}</h2>
<p>
  A new match has been scheduled this week between the two recipients of this email:
</p>
<ol>
  <li>${player1}</li>
  <li>${player2}</li>
</ol>
<p>
  Please, if possible, arrange a time to play when is convenient for both of you.
</p>
<p>
  Visit <a href="${siteURL}">the website</a> for more information and to record 
  the score once the match has been played.
</p>
<p>
  Reminder: playing no games in a week may affect your ranking in the ladder. 
  Missing too many weeks may result in your removal from the ladder.
</p>
` + emailFooter);

const sendGameNotification = async game => {
  try {
    let player1MailTo = await makeMailToLink(game.player1);
    let player2MailTo = await makeMailToLink(game.player2);
    transporter.sendMail({
      from: beautifyAddress(config.admin),
      to: `${game.player1}, ${game.player2}`,
      subject: "Match Scheduled",
      html: gameScheduledEmail(game, player1MailTo, player2MailTo)
    }, (err, info) => err ? console.log(err) : console.log(info.response))
  } catch (e) {
    console.log(e.message);
  }
}

const autoScheduleGames = () => {
  let recurrance = new schedule.RecurrenceRule();
  recurrance.dayOfWeek = 1; // Monday
  recurrance.hour = 12; // 1 PM (GMT => 8 AM EST)
  recurrance.minute = 0;
  schedule.scheduleJob(recurrance, () => database.scheduleGames(thisWeek(), sendGameNotification),
    () => console.log(`scheduled games for week ${thisWeek()}`));
}

const inviteList = (list, isMod = false) => list.forEach(user =>
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
