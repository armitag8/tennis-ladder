// From https://www.fullstackreact.com/articles/using-create-react-app-with-a-server/
const args = [ 'start' ];
const opts = { stdio: 'inherit', cwd: 'client', shell: true };
require('child_process').spawn('npm', args, opts);