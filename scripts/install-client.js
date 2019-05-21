const installClient = () => require("child_process").spawn(
    "npm",
    ['install'],
    {
        stdio: 'inherit', cwd: 'client', shell: true
    });

if (process.env.NODE_ENV !== "test")
    require("fs").copyFile("config.json", "client/src/config.json", err => {
        if (err) throw err;
        installClient();
    });
else installClient();