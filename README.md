# Notice:
This project is in development and some features may not be complete. Pull requests are welcome.

# Running reporter-bot

## Setup
    git clone https://github.com/DNSBLim/reporter-bot.git && cd reporter-bot
    npm install
Don't forget to configure your bot and move `config.example.json` to `config.json`.

## Execute
To run the bot simply run `nodejs ./app.js`.

# Commands
***add**
Adds an IP to the blacklist.
**Syntax:** *add &lt;ip&gt; &lt;type&gt; &lt;reason&gt;

***madd**
Adds a list of IPs to the blacklist from a remote text file which contains a list of IPs separated by new line.
**Syntax:** *add &lt;url&gt; &lt;type&gt; &lt;reason&gt;