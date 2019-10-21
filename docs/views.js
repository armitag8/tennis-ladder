import {home} from "./home.js";

export const views = {
    home: new Promise(r => r(home)),
};
