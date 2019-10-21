import {home} from "./home.js";
import {credits} from "./credits.js";

export const views = {
    home: new Promise(r => r(home)),
    credits: new Promise(r => r(credits))
};
