const database = require("../src/database.js")

describe("User", () => {
    describe("Input", () => {
        it("Adds a User and checks a promise that resolves as that user is returned", () => {
            let bob  = {
                email: "bob@domain.com",
                password: "pass",
                firstname: "Bob",
                lastname: "The Builder"
            }
            expect(database.inputUser(bob)).resolves.toEqual(bob);
        });
    });
});
