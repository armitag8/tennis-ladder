const crypto = require("crypto");

let database = (function () {
    const Datastore = require("nedb");
    const fs = require("fs");

    const USERS_DB_FILE = "db/users.db";

    const users = new Datastore({ filename: USERS_DB_FILE, autoload: true });

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

    let module = {};

    module.clearUsers = () => fs.unlink(USERS_DB_FILE, err => {});

    module.checkUser = (username, password) => new Promise((resolve, reject) => 
        users.findOne({ _id: username }, (err, user) => {
            if (err) reject(DB_FAIL);
            else if (user === null || ! isCorrectPassword(user.password, password)) resolve(false);
            else resolve(true);
        })
    );

    module.addUser = user => new Promise((resolve, reject) =>
        users.findOne({ _id: user._id }, (err, foundUser) => {
            user.password = saltAndHash(user.password);
            if (err) reject(DB_FAIL);
            else if (foundUser !== null) reject(new HTTPError(409, "User already exists"));
            else users.insert(user, err => err ? reject(DB_FAIL) : resolve(true));
        })
    );

    module.getUser = userID => new Promise((resolve, reject) => 
        users.findOne({ _id: userID }, (err, user) => {
            if (err) reject(DB_FAIL) 
            else if (null === user) reject(new HTTPError(404, "No user found with that email address"));
            else resolve(user);
        })
    );

    const USERS_PER_PAGE = 10;
    module.getUsers = (pageNumber) => new Promise((resolve, reject) => 
        users.find({}).sort({ lastname: -1}).skip(USERS_PER_PAGE * pageNumber).limit(USERS_PER_PAGE)
        .exec((err, users) => err ? reject(DB_FAIL) : resolve(users))
    );

    module.deleteUser = userID => console.log("delete: " + userID);

    return module;
})();

module.exports = database;