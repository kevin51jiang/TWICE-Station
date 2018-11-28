const Discord = require('discord.js');
const bot = new Discord.Client();

const data = require("./data.json");

const database = require("./database");
const player = require("./player");
const info = require("./info");
const coins = require("./coins");
const games = require("./games");
const candybongs = require("./candybongs");
const items = require("./items");
const rpg = require("./rpg");

// const fun = require("./fun");

var args = process.argv.slice(2)[0];
bot.login(args)
.catch(error => { if(error) console.log("gitgud haha"); });

var ping = "<@247955535620472844>•";

const prefix = ";";

bot.on('ready', () =>
{
    console.log(`Bot started!`) 
    
    bot.user.setStatus('Online')
    bot.user.setActivity('with TWICE MEMES members');

    bot.channels.get("496531070167285770").send(ping);

    player.init(bot.channels.get("496542169549504538"));
    database.init();
});

bot.on('message', message =>
{
    if
    (  
        message.author.bot &&
        message.content == ping
    )
        message.delete();

    // fun.ligmaInteraction(message);

    if(message.author.bot) return;
    if(message.channel.type == "dm")
    {
        if(message.content.startsWith(";sql "))
            sql(message);
        return;
    }

    pings(message);

    coins.rng(message);

    var command = message.content;
    var channel = message.channel;
    
    command = command.toLowerCase().replace(/\s\s+/g, " ");

    if(!command.startsWith(prefix)) return;
    command = command.replace(prefix, "");

    if(command == "ping")
        pong(message);

    //#region music

    if(command.startsWith(""))
    {
        for(var album in data.albums)
        {
            if(command.substr(1).replace(/\s/g, '') == album.toLowerCase())
                player.playAlbum(channel, data.albums[album]);
        }
    }

    if(command == "connect")
        player.connect(message.channel);

    if
    (
        command == "disconnect" || 
        command == "dc" ||
        command == "stop"
    )
        player.disconnect(message.channel);

    if(command == "skip")
        player.skip(message.channel);

    //#endregion

    //#region info

    if(command.startsWith("i ") || command.startsWith("info "))
        info.command(message, command.split(/\s(.+)/));

    if(command == "albums")
        info.albums(message);
        
    if(command == "lists")
        info.lists(message);

    if(command == "help")
        info.help(message, bot);
            
    if(command == "botinfo")
        info.botinfo(message, bot);
        
    if(command == "serverinfo")
        info.serverinfo(message);
        
    if(command == "userinfo" || command.startsWith("userinfo "))
        info.userinfo(message);

    //#endregion

    //#region coins

    if
    (
        command == "coins" || 
        command == "c" ||
        command == "bal" ||
        command == "daily" ||
        command == "d" ||
        command.startsWith("c ") ||
        command.startsWith("coins ")
    )
        coins.command(message, command.split(" "));

    //#endregion

    //#region games

    if(command == "trivia" || command == "t")
        games.trivia(message);
    if
    (
        command.startsWith("trivia add ") ||
        command.startsWith("t add ")
    )
        games.triviaAdd(message);
    if(command == "era")
        games.era(message);
    if
    (
        command == "eras" || 
        command == "eralist"
    )
        games.eras(message);
    if(command.startsWith("era add"))
        games.eraAdd(message);
    
    if(command == "verify all")
        games.eraVerifyAll(message);
    if(command.startsWith("verify ") && command != "verify all")
        games.eraVerify(message, true);
    if(command.startsWith("reject "))
        games.eraVerify(message, false);
    if(command == "pending")
        games.pending(message);

    //#endregion 

    //#region candybongs

    if
    (
        command == "candybong" ||
        command == "cb" ||
        command.startsWith("candybong ") ||
        command.startsWith("cb ")
    )
        candybongs.candybong(message);

    if
    (
        command == "candybongs" ||
        command == "cbs"
    )
        candybongs.candybongs(message);
    
    if
    (
        command == "candybongtop" ||
        command == "cbtop" ||
        command == "cbt"
    )
        candybongs.leaderboard(message);

    //#endregion

    //#region items

    if
    (
        command == "search" ||
        command == "s"
    )
        items.search(message);
    if
    (
        command == "oncebag" ||
        command == "bag" ||
        command == "ob"
    )
        items.bag(message, false);
    if
    (
        command == "oncebag m" ||
        command == "bag m" ||
        command == "ob m"
    )
    {
        items.bag(message, true);
    }

    if(command.startsWith("sell "))
        items.sell(message);

    if(command.startsWith("trade "))
        items.trade(message);

    //#endregion
        
    // For debugging
    if(command.startsWith("reset "))
        database.reset(message.content.slice(7))
        .then(() => message.channel.send("Table recreated."));

    //#endregion

    //#region RPG   

    if(command.startsWith("g "))    
        rpg.command(message);

    //#endregion

    //#region Dev commands

    if
    (
        command == "test" ||
        command.startsWith("test ")
    )
        test(message);
    if(command.startsWith("pr "))
        clean(message);
    if(command.startsWith("grant "))
        grantAccess(message);
    if(command.startsWith("smack "))
        smack(message);

    //#endregion
});

function pings(message)
{
    var chat = message.content.toLowerCase();

    if
    (
        message.isMentioned(bot.user) ||
        chat.includes(" chloe ") ||
        chat.includes(" bot ") ||
        chat.includes(" esfox ")
    )
    {
        var tzuyuping = bot.emojis.find(emote => emote.name == "TzuyuPing");
        message.react(tzuyuping.id);
    }
}

function pong(message)
{
    var tzuyuping = bot.emojis.find(emote => emote.name == "TzuyuPing");

    var embed = new Discord.RichEmbed()
        .setColor(data.color)
        .setDescription(tzuyuping + " **" + Math.round(bot.ping) + " ms**");
    message.channel.send(embed);
}

function clean(message)
{
    if(message.author.id != "247955535620472844")
        return;

    var limit = parseInt(message.content.split(" ")[1]);
    message.channel.fetchMessages({ limit: limit + 1 })
        .then(messages =>
        {  
            message.channel.bulkDelete(messages)
                .catch(console.error);
        })
        .catch(console.error);
}

function grantAccess(message)
{
    var id = message.content.split("-");
    if(!id) return;

    var user = message.guild.members.get(id[1]);
    var channel = message.guild.channels.get("503988943931441172");
    channel.overwritePermissions(user,
    {
        READ_MESSAGES: true,
        SEND_MESSAGES: true
    })
    .then(() =>
    {
        message.channel.send(bot.user.username + " has been granted access to verification channel");
    });
}

function sql(message)
{
    if
    (message.author.id != "247955535620472844" &&
     message.author.id != "200132493335199746")
        return message.reply("no.")

    var query = message.content.slice(5);
    database.query(query)
    .then(() =>
    {
        message.channel.send("✅")
        .then(m => m.delete(1000));
    },
    () =>
    {
        message.author.send("An error occured with the query.")
        .then(m => m.delete(1000));
    });
}

function smack(message)
{
    // var esfoxID = "247955535620472844";

    // if(message.author.id != esfoxID)
    //     return;

    // var user = message.mentions.members.first();
    // if(!user)
    //     return;

    // var name = "**" + user.displayName + "**";
    // user.ban()
    //     .then(() => message.channel
    //     .send(name + " has been smacked."));
}

function test(message)
{
    if(message.author.id != "247955535620472844")
        return;

    var embed = new Discord.RichEmbed()
        .setColor(data.color)
        .setImage("https://drive.google.com/uc?export=view&id=0B8Hl0NLXwoPyZlZzbHVXVERScEU");

    message.channel.send(embed);

    // var number = message.content.slice(6).split("+");
    // var x = parseInt(number[0]),
    //     y = parseInt(number[1]),
    //     cost = 100,
    //     increase = 50;

    // var text = "```cpp\n";
    
    // var final = 0;
    // for(var i = x; i < x + y; i++)
    // {
    //     var z = cost + (increase * i);
    //     text += `${cost} + (${increase} x ${i}) = ${z}\n`;
    //     final += z;
    // }
    
    // text += "\n```\nTotal: " + final;
    // message.channel.send(text);

    // message.channel.send
    // (
    //     "```" +
    //     ";(album name)\n" +
    //     ";connect (this isn't necessary anymore, since it auto connects when you play)\n" +
    //     ";disconnect/dc/stop\n" +
    //     ";skip\n\n" +

    //     ";i/info (album name)\n" +
    //     ";albums\n" +
    //     ";lists\n" +
    //     ";help\n" +
    //     ";botinfo\n" +
    //     ";serverinfo\n" +
    //     ";userinfo (user)\n\n" +

    //     ";coins/c/bal\n" +
    //     ";daily/d\n\n" +

    //     ";trivia/t\n" +
    //     ";era\n" +
    //     ";eras/eralist\n" +
    //     ";era add\n" +
    //     ";trivia/t add\n\n" +

    //     ";verify (all)\n" +
    //     ";reject\n" +
    //     ";pending" +
    //     "```"
    // );
}
