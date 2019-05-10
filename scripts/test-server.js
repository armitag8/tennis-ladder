// From https://www.fullstackreact.com/articles/using-create-react-app-with-a-server/
const args = [ 'test' ];
const opts = { stdio: 'inherit', cwd: 'server', shell: true };
require('child_process').spawn('npm', args, opts);