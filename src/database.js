let database = (function () {
    const Datastore = require("nedb");

    const users = new Datastore({ filename: "db/users.db", autoload: true });
    users.ensureIndex({fieldName: "email", unique: true}, 
        err => err? console.log(err.message): null);

    const HTTPError = function () {
        return function (code, message) {
            this.code = code;
            this.message = message;
        };
    };

    const DB_FAIL = new HTTPError(500, "Database Failure");

    let module = {};
    
    module.inputUser = user => new Promise((resolve, reject) => 
        users.update({ email : user.email }, user, { upsert: true }, (newUser, err) => 
            err ? reject(DB_FAIL) : resolve(newUser)
        )
    );
    
    const USERS_PER_PAGE = 10;
    module.getUsers = (pageNumber) => console.log(pageNumber, USERS_PER_PAGE);

    module.deleteUser = userID => console.log("delete: " + userID);

    return module;
})();
module.exports = database;