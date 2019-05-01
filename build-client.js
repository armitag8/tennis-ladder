// From https://www.fullstackreact.com/articles/using-create-react-app-with-a-server/
const args = [ 'run', 'build' ];
const opts = { stdio: 'inherit', cwd: 'tennis-ladder', shell: true };
require('child_process').spawn('npm', args, opts);