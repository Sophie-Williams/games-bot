const app = require('express')();
const PORT = process.env.PORT || 5000;
const commands = require('./src/internal/commands.js');

// We use the ejs module to view our pages
app.set('view engine', 'ejs');

// The home page
app.get('/', (req, res) => res.render('pages/index'));

// We loop through all of the commands. If the user goes under /commands/cmdName,
// we show the data for that command.
let cmdDesc = '';
commands.forEach(cmd => {
  let pretty = JSON.stringify(commands[cmd.cmd], null, 2);
  cmdDesc += pretty + '\n';

  app.get(`/commands/${cmd.cmd}`, (req, res) => {
    res.send(pretty);
  });
});

app.get('/commands', (req, res) => {
  res.send(`<pre>${cmdDesc}<\\pre>`);
});

app.listen(PORT, () => console.log(`Listening on ${ PORT }`));