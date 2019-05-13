const crypto = require("crypto");

let database = (function () {
    const Datastore = require("nedb");
    const fs = require("fs");

    const USERS_DB_FILE = "db/users.db";
    const GAMES_DB_FILE = "db/games.db";

    const users = new Datastore({ filename: USERS_DB_FILE, autoload: true });
    const games = new Datastore({ filename: GAMES_DB_FILE, autoload: true });

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
        else if (s0 === 8 && s1 === 8 && s2 - s3 >= 2 && s2 > 10 && s3 > 0)
            return 1;
        else if (s0 === 8 && s1 === 8 && s3 - s2 >= 2 && s3 > 10 && s2 > 0)
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

    module.addUser = user => new Promise((resolve, reject) =>
        users.count({}, (err, count) => err ? reject(DB_FAIL) : users.findOne({ _id: user._id },
            (err, foundUser) => {
                let newUser = Object.assign({}, user);
                newUser.password = saltAndHash(user.password);
                newUser.position = count + 1;
                if (err) reject(DB_FAIL);
                else if (foundUser !== null) reject(new HTTPError(409, "User already exists"));
                else users.insert(newUser, err => err ? reject(DB_FAIL) : resolve(true));
            })
        )
    );


    module.getUser = userID => new Promise((resolve, reject) =>
        users.findOne({ _id: userID }, (err, user) => {
            if (err) reject(DB_FAIL)
            else if (null === user) reject(new HTTPError(404, "No user found with that email address"));
            else resolve(user);
        })
    );

    const USERS_PER_PAGE = 50;
    module.getUsers = (pageNumber) => new Promise((resolve, reject) =>
        users.find({}).sort({ position: 1 }).skip(USERS_PER_PAGE * pageNumber).limit(USERS_PER_PAGE)
            .exec((err, foundUsers) => err ? reject(DB_FAIL) : resolve(foundUsers))
    );

    module.deleteUser = userID => console.log("delete: " + userID);

    module.addGame = game => new Promise((resolve, reject) =>
        games.find({
            $or: [
                { player1: game.player1, player2: game.player2 },
                { player1: game.player2, player2: game.player1 }
            ],
            week: game.week
        }, (err, foundGames) => {
            if (err)
                reject(DB_FAIL);
            else if (foundGames.length > 0)
                reject(new HTTPError(409, "This game has already been played"));
            else {
                let player1Wins = findWinner(game.score) === 1;
                let winner = player1Wins ? game.player1 : game.player2;
                let loser = player1Wins ? game.player2 : game.player1;
                users.find({ $or: [{ _id: winner }, { _id: loser }] }).sort({ position: 1 }).exec(
                    (err, foundUsers) => {
                        if (err)
                            reject(DB_FAIL);
                        else if (foundUsers.length !== 2)
                            reject(new HTTPError(404, "Player(s) not found"));
                        else
                            games.insert(game, () => {
                                users.update({ _id: winner }, { $inc: { wins: 1 } });
                                users.update({ _id: loser }, { $inc: { losses: 1 } });
                                if (foundUsers[0]._id === loser) {
                                    users.update(
                                        { $and: [
                                            { position: { $gte: foundUsers[0].position } },
                                            { position: { $lt: foundUsers[1].position } }
                                        ] },
                                        { $inc: { position: 1 } },
                                        { multi: true },
                                        err => err ? reject(DB_FAIL) : users.update(
                                            { _id: winner }, { $set : { position: foundUsers[0].position }}
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