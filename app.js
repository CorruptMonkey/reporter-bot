#!/usr/bin/nodejs
const config = require("./config.json");
const pkg = require("./package.json");
const IRC = require("irc-framework");
const ipval = require('ip-validator');
var rp = require('request-promise');
const chomp = require('chomp');
console.log("Starting " + pkg.name + " v" + pkg.version);
console.log("Project page:\t" + pkg.author.url);
console.log("Home page:\t" + pkg.author.homepage);

var Client = new IRC.Client();
const https = require("https");

Client.connect({
    host: config.irc.hostname,
    port: config.irc.port,
    ssl: config.irc.ssl,
    nick: config.irc.nickname,
    username: config.irc.nickname,
    realname: "DNSBL Reporter v" + pkg.version
});

Client.on("motd", function(event){
    console.log("Received end of /MOTD");
    Client.join(config.irc.channel);
});

Client.on("error", function(err){
    console.log(err);
});

function handleCMD(event)
{
    var args = event.message.split(" ");
    var cmd = args[0];
    var argstr = args.shift();
    Client.whois(event.nick, function(wData){
        if(!wData.account)
        {
            return;
        }
        config.admins.forEach(function(account){
            if(account.toLowerCase() == wData.account.toLowerCase())
            {
                switch(cmd.toLowerCase())
                {
                    case "*add":
                        if(!args[2])
                        {
                            event.reply("Usage:\t *add <ip> <type> <reason>");
                            break;
                        }
                        rp(
                            {
                                method: 'POST',
                                uri: 'https://api.dnsbl.im/import',
                                body:{
                                    key: config.api.key,
                                    addresses:[
                                        {
                                            ip: args[0],
                                            type: args[1],
                                            reason: args.slice(2).join(" ")
                                        }
                                    ]
                                },
                                json:true
                            }
                        ).then(function(reply){
                            if(config.debug == true)
                            {
                                console.log(reply);
                            }
                            if(reply.success == true)
                            {
                                event.reply("Added " + args[0] + " typeof: " + args[1] + " Reason: " + args.slice(2).join(" "));
                            } else {
                                event.reply("Error adding to blacklist: " + reply.message.join(" "));
                            }
                            return;
                        }).catch(function(err){
                            event.reply("Failed to add that to the blacklist due to an unknown error. Please try again later.");
                            console.log(err);
                            return;
                        });
                        break;
                    case "*madd":
                        if(!args[2])
                        {
                            event.reply("Usage:\t *madd <url> <type> <reason>");
                            break;
                        }
                        https.get(args[0], response => {
                            response.on("data", function(chunk){
                                var ip_addresses = [];
                                lines = chunk.toString().split("\n");
                                lines.forEach(function(data){
                                    var line = data.toString();
                                    if (ipval.ipv4(line.chomp())) {
                                        var ip_addr = line.chomp();
                                        ip_addresses.push(
                                            {
                                                ip: ip_addr,
                                                type: args[1],
                                                reason: args.slice(2).join(" ")
                                            }
                                        );
                                    }
                                });
                                rp(
                                    {
                                        method: 'POST',
                                        uri: 'https://api.dnsbl.im/import',
                                        body:{
                                            key: config.api.key,
                                            addresses:ip_addresses
                                        },
                                        json:true
                                    }
                                ).then(function(reply){
                                    if(config.debug == true) { console.log(reply); }
                                    if(reply.success == true)
                                    {
                                        event.reply("Added " + (ip_addresses.length - reply.dupes.length) + " IP addresses to the blacklist; typeof: " + args[1] + "; Reason: " + args.slice(2).join(" "));
                                    } else {
                                        event.reply("Error adding to blacklist: " + reply.message.join(" "));
                                    }
                                    return;
                                }).catch(function(err){
                                    event.reply("Failed to add that to the blacklist due to an unknown error. Please try again later.");
                                    console.log(err);
                                    return;
                                });
                            });
                        });
                        break;
                    case "*help":
                        Client.notice(event.nick, "\002*add <ip> <type> <reason>\002\t\t Adds an IP to the blacklist with the given record type and reason.");
                        Client.notice(event.nick, "\002*madd <url> <type> <reason>\002\t\t Adds a list of IPs (1 per line) from a remote text file with given type and reason.");
                        break;
                    default:
                        if(config.debug == true)
                        {
                            console.log(wData);
                            console.log(event);
                        }
                        break;
                }
            }
        }); 
    });
}
Client.matchMessage(/^\*.*?$/i, handleCMD);