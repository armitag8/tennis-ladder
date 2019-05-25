const crypto = require("crypto");

let database = (function () {
    const Datastore = require("nedb");
    const fs = require("fs");

    const USERS_DB_FILE = "db/users.db";
    const GAMES_DB_FILE = "db/games.db";
    const INVITES_DB_FILE = "db/invites.db";

    const users = new Datastore({ filename: USERS_DB_FILE, autoload: true });
    const games = new Datastore({ filename: GAMES_DB_FILE, autoload: true });
    const invites = new Datastore({ filename: INVITES_DB_FILE, autoload: true });

    const HTTPError = function () {
        return function (code, message) {
            this.code = code;
            this.message = message;
        };
    }();

    const DB_FAIL = new HTTPError(500, "Database Failure");

    const saltAndHash = password => {
        let salt = crypto.randomBytes(16).toString("base64");
        return { "salt": salt, "hash": hashWithSalt(password, salt) };
    };

    const hashWithSalt = (password, salt) => {
        let hash = crypto.createHmac("sha512", salt);
        hash.update(password);
        return hash.digest("base64");
    };

    const isCorrectPassword = (fromDB, given) => fromDB.hash === hashWithSalt(given, fromDB.salt);

    const removePassword = user => {
        delete user["password"];
        return user;
    };

    const findWinner = score => {
        let s0 = score[0];
        let s1 = score[1];
        let s2 = score[2];
        let s3 = score[3];
        if (s0 === 8 && s1 <= 6 && s1 >= 0)
            return 1;
        else if (s1 === 8 && s0 <= 6 && s0 >= 0)
            return 2;
        else if (s0 === 9 && s1 === 7)
            return 1;
        else if (s1 === 9 && s0 === 7)
            return 2;
        else if (s0 === 8 && s1 === 8 && s2 - s3 >= 2 && s2 > 9 && s3 > 0)
            return 1;
        else if (s0 === 8 && s1 === 8 && s3 - s2 >= 2 && s3 > 9 && s2 > 0)
            return 2;
        else
            throw Error("Not a valid score");
    }

    let module = {};

    module.clearUsers = () => new Promise((resolve, reject) => fs.existsSync(USERS_DB_FILE) ?
        fs.unlink(USERS_DB_FILE, err => err ? reject(err) : resolve(true)) : resolve(false));

    module.clearGames = () => new Promise((resolve, reject) => fs.existsSync(GAMES_DB_FILE) ?
        fs.unlink(GAMES_DB_FILE, err => err ? reject(err) : resolve(true)) : resolve(false));

    module.checkUser = (username, password) => new Promise((resolve, reject) =>
        users.findOne({ _id: username }, (err, user) => {
            if (err) reject(DB_FAIL);
            else if (user === null || !isCorrectPassword(user.password, password)) resolve(false);
            else resolve(true);
        })
    );

    module.inviteUser = (email, confirmed = false) => new Promise((resolve, reject) =>
        invites.count({ _id: email, confirmed: false }, (err, count) => {
            if (err) reject(DB_FAIL);
            else if (count) reject(new HTTPError(409, "Invite already sent"));
            else {
                users.count({ _id: email }, (err, count) => {
                    if (err) reject(DB_FAIL);
                    else if (count) reject(new HTTPError(409, "User already exists"));
                    let invite = {
                        _id: email,
                        code: crypto.randomBytes(64).toString("hex"),
                        confirmed: confirmed
                    };
                    invites.update({ _id: email }, invite, { upsert: true },
                        err => err ? reject(DB_FAIL) : resolve(invite));
                })
            }
        })
    );

    module.confirmInvite = (email, code) => new Promise((resolve, reject) =>
        invites.findOne({ _id: email, code: code }, (err, invite) => {
            if (err) reject(DB_FAIL);
            else if (!invite) reject(new HTTPError(404, "Invite not found"));
            else invites.update({ _id: email }, { $set: { confirmed: true } },
                err => err ? reject(DB_FAIL) : resolve(true));
        })
    );

    module.addUser = user => new Promise((resolve, reject) =>
        users.count({}, (err, count) => err ? reject(DB_FAIL) : users.findOne({ _id: user._id },
            (err, foundUser) => {
                let newUser = Object.assign({}, user);
                newUser.password = saltAndHash(user.password);
                newUser.position = count + 1;
                if (err) reject(DB_FAIL);
                else if (foundUser) reject(new HTTPError(409, "User already exists"));
                else invites.findOne({ _id: newUser._id, confirmed: true }, (err, foundInvite) => {
                    if (err) reject(DB_FAIL);
                    else if (!foundInvite) reject(new HTTPError(401, "No confirmed invite"));
                    else users.insert(newUser, err => err ? reject(DB_FAIL) : resolve(true));
                });
            })
        )
    );


    module.getUser = userID => new Promise((resolve, reject) =>
        users.findOne({ _id: userID }, (err, user) => {
            if (err) reject(DB_FAIL)
            else if (null === user) reject(new HTTPError(404, "No user found with that email address"));
            else resolve(removePassword(user));
        })
    );

    const USERS_PER_PAGE = 10;
    module.getUsers = pageNumber => new Promise((resolve, reject) =>
        users.find({}).sort({ position: 1 }).skip(USERS_PER_PAGE * pageNumber).limit(USERS_PER_PAGE)
            .exec((err, foundUsers) => err ? reject(DB_FAIL) : resolve(foundUsers.map(removePassword)))
    );

    module.deleteUser = userID => new Promise((resolve, reject) => users.findOne(
        { _id: userID }, (err, user) => {
            if (err) reject(DB_FAIL)
            else if (!user) reject(new HTTPError(404, "No user found with that email address"))
            else users.remove(
                { _id: userID }, err => err ? reject(DB_FAIL) : users.update(
                    { position: { $gt: user.position } },
                    { $inc: { position: -1 } },
                    { multi: true },
                    err => err ? console.log(err) || reject(DB_FAIL) : resolve(true)))
        })
    );

    module.updateUser = (userID, firstname, lastname, password) => new Promise((resolve, reject) => {
        let updates = {};
        if (firstname) updates.firstname = firstname
        if (lastname) updates.lastname = lastname;
        if (password) updates.password = saltAndHash(password);
        users.update({ _id: userID }, { $set: updates }, err =>
            err ? reject(DB_FAIL) : resolve(true))
    });

    module.moveUser = (userID, position) => new Promise((resolve, reject) => users.findOne(
        { _id: userID }, (err, user) => {
            if (err) reject(DB_FAIL)
            else if (!user) reject(new HTTPError(404, "No user found with that email address"))
            else users.count({}, (err, count) => {
                if (err) reject(DB_FAIL);
                else if (position < 1 || count < position) reject(new HTTPError(422, "Invalid position"));
                else if (position < user.position) users.update( // move up
                    {
                        $and: [
                            { position: { $gte: position } },
                            { position: { $lt: user.position } }
                        ]
                    },
                    { $inc: { position: 1 } },
                    { multi: true },
                    err => err ? reject(DB_FAIL) :
                        users.update({ _id: userID }, { $set: { position: position } }, err =>
                            err ? reject(DB_FAIL) : resolve(true)));
                else users.update( // move down
                    {
                        $and: [
                            { position: { $lte: position } },
                            { position: { $gt: user.position } }
                        ]
                    },
                    { $inc: { position: -1 } },
                    { multi: true },
                    err => err ? reject(DB_FAIL) :
                        users.update({ _id: userID }, { $set: { position: position } }, err =>
                            err ? reject(DB_FAIL) : resolve(true)));
            });
        }));

    module.scheduleGames = (week, sendEmail) => users.find({}, (err, users) =>
        err ? console.log(err) : users.forEach((user, index) => {
            if (index !== 0) {
                let game = {
                    player1: user._id,
                    player2: users[index - 1]._id,
                    week: week,
                    played: false
                };
                module.scheduleGame(game)
                    .then(() => sendEmail(game))
                    .catch(console.log);
            }

        })
    );

    module.scheduleGame = game => new Promise((resolve, reject) =>
        games.findOne({
            $or: [
                { player1: game.player1, player2: game.player2 },
                { player1: game.player2, player2: game.player1 }
            ],
            week: game.week
        }, (err, foundGame) => {
            if (err)
                reject(DB_FAIL);
            else if (foundGame)
                reject(new HTTPError(409, "This game has already been scheduled"));
            else
                games.insert(game, err => err ? reject(DB_FAIL) : resolve(true));
        })
    );

    module.getPastGames = player => new Promise((resolve, reject) => {
        games.find({
            $or: [{ player1: player }, { player2: player }],
            played: true
        }, (err, foundGames) => {
            if (err) reject(DB_FAIL);
            else {
                let opponents = foundGames.map(
                    game => game.player1 === player ? game.player2 : game.player1);
                users.find({ _id: { $in: opponents } }, (err, players) => {
                    if (err) reject(DB_FAIL);
                    else {
                        let result = foundGames.map(game => {
                            let isPlayer1 = game.player1 === player;
                            let opponentID = isPlayer1 ? game.player2 : game.player1;
                            let opponent = players.find(player => player._id === opponentID);
                            return {
                                _id: game._id,
                                opponent: {
                                    _id: opponentID,
                                    firstname: opponent ? opponent.firstname : "Deleted",
                                    lastname: opponent ? opponent.lastname : "Player"
                                },
                                week: game.week,
                                score: game.score,
                                win: findWinner(game.score) === 1 && isPlayer1
                            }
                        });
                        resolve(result);
                    }
                });
            }
        })
    });

    module.getScheduledGames = player => new Promise((resolve, reject) => {
        games.find({
            $or: [{ player1: player }, { player2: player }],
            played: false
        }, (err, foundGames) => {
            if (err) reject(DB_FAIL)
            else {
                let opponents = foundGames.map(
                    game => game.player1 === player ? game.player2 : game.player1);
                users.find({ _id: { $in: opponents } }, (err, players) => {
                    if (err) reject(DB_FAIL);
                    else resolve(players.map(removePassword));
                });
            };
        });
    });


    module.playGame = game => new Promise((resolve, reject) =>
        games.findOne({
            $or: [
                { player1: game.player1, player2: game.player2 },
                { player1: game.player2, player2: game.player1 }
            ],
            week: game.week
        }, (err, foundGame) => {
            if (err)
                reject(DB_FAIL);
            else if (foundGame && foundGame.played)
                reject(new HTTPError(409, "This game has already been played"));
            else {
                let id = foundGame ? foundGame._id : "this is not an id, probably";
                let player1Wins = findWinner(game.score) === 1;
                let winner = player1Wins ? game.player1 : game.player2;
                let loser = player1Wins ? game.player2 : game.player1;
                users.find({ $or: [{ _id: winner }, { _id: loser }] }).sort({ position: 1 }).exec(
                    (err, foundUsers) => {
                        game.played = true;
                        if (err)
                            reject(DB_FAIL);
                        else if (foundUsers.length !== 2)
                            reject(new HTTPError(404, "Player(s) not found"));
                        else
                            games.update({ _id: id }, game, { upsert: true }, () => {
                                users.update({ _id: winner }, { $inc: { wins: 1 } });
                                users.update({ _id: loser }, { $inc: { losses: 1 } });
                                if (foundUsers[0]._id === loser) {
                                    users.update(
                                        {
                                            $and: [
                                                { position: { $gte: foundUsers[0].position } },
                                                { position: { $lt: foundUsers[1].position } }
                                            ]
                                        },
                                        { $inc: { position: 1 } },
                                        { multi: true },
                                        err => err ? reject(DB_FAIL) : users.update(
                                            { _id: winner }, { $set: { position: foundUsers[0].position } }
                                        ));
                                }
                                resolve(true)
                            });
                    }
                );
            }
        })
    )

    return module;
})();

module.exports = database;
