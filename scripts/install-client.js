require("fs").copyFile("config.json", "client/src/config.json", err => {
    if (err) throw err;
    require("child_process").spawn(
        "npm", 
        [ 'install' ],
         { stdio: 'inherit', cwd: 'client', shell: true 
    });
});