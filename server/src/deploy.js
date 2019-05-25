const {inviteList, initialize} = require("./server.js");
const list = require('../../user-list.json');
initialize();
inviteList(list);