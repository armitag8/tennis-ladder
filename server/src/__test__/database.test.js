const database = require("../database.js")

describe("User", () => {
    let id = "alice@domain.com";
    let alice = {
        _id: id,
        password: "word",
        firstname: "Alice",
        lastname: "In Wonderland"
    }
    let bob  = {
        _id: "bob@domain.com",
        password: "pass",
        firstname: "Bob",
        lastname: "The Builder"
    }
    beforeEach(database.clearUsers);

    describe("Create", () => {
        it("Adds a User and checks that one record has been updated", () =>
            expect(database.addUser(bob)).resolves.toEqual(true)
        )
    });

    describe("Read", () => {
        test("Adds a User then reads it back and checks properties are equal", async () => {
            await database.addUser(alice);
            await expect(database.getUser(id)).resolves.toMatchObject(alice);
        });

        test("Adds two users then reads both back in a list", () => {
            return expect(database.getUsers()).resolves.toMatchObject([bob, alice]);
        });
    });
});