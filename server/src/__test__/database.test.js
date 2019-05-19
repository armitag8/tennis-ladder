const database = require("../database.js")


let id = "alice@domain.com";
const alice = {
    _id: id,
    password: "word",
    firstname: "Alice",
    lastname: "In Wonderland"
}
const bob  = {
    _id: "bob@domain.com",
    password: "pass",
    firstname: "Bob",
    lastname: "The Builder"
}

let alice_exp = Object.assign({}, alice);
delete alice_exp.password;
let bob_exp = Object.assign({}, bob);
delete bob_exp.password;

const game1 = {player1: "alice@domain.com", player2: "bob@domain.com", week: 1, score: [8, 3]};

describe("User", () => {
    beforeEach(database.clearUsers);

    describe("Create", () => {
        it("Adds a User and checks that one record has been updated", () =>
            expect(database.addUser(bob)).resolves.toEqual(true)
        )
    });

    describe("Read", () => {
        test("Adds a User then reads it back and checks properties are equal", async () => {
            await database.addUser(alice);
            await expect(database.getUser(id)).resolves.toMatchObject(alice_exp);
        });

        test("Adds two users then reads both back in a list", () => {
            return expect(database.getUsers()).resolves.toMatchObject([bob_exp, alice_exp]);
        });
    });
});

describe("Game", () => {
    beforeEach(async done => {
        //await database.clearGames();
        //await database.clearUsers();
        //await database.addUser(alice);
        //await database.addUser(bob);
        done();
    });

    describe("Create", () => {
        it("Adds a game and checks that promise resolves true.", () => {
            return database.clearGames().then(
                expect(database.playGame(game1)).resolves.toEqual(true));
        });
    });
});