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
.catch(error =>
{
    if(error) console.log("gitgud haha"); 
});

var ping = "<@247955535620472844>•";

const prefix = ";";

bot.on('ready', () =>
{
    console.log(`Bot started!`) 
    
    bot.user.setStatus('Online')
    // bot.user.setActivity('with TWICE MEMES members');

    bot.channels.get("496531070167285770").send(ping);

    player.init(bot);
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

    // if(command.startsWith(""))
    // {
    //     if(message.author.id != "247955535620472844")
    //         return message.reply("I'm Beta. Use <@496529668850057227> instead.");
    // }
    
    // fun.interaction(message);

    var command = message.content;

    command = command.toLowerCase().replace(/\s\s+/g, " ");

    if(command == "gn")
        return message.author.send("gn");

    if(!command.startsWith(prefix)) return;
    command = command.replace(prefix, "");

    if(command == "ping")
        pong(message);

    //#region music

    // for(var album in data.albums)
    // {
    //     if(command.replace(/\s/g, "") == album.toLowerCase()
    //         .replace("&", "and")
    //         .replace("?", ""))
    //         player.playAlbum(channel, data.albums[album]);
    // }

    if(command == "start")
        player.start(message);

    if
    (
        command.startsWith("play ") ||
        command.startsWith("p ")
    )
        player.playSong(message);

    if
    (
        command == "skip" ||
        command == "next" ||
        command == "n"
    )
        player.skip(message);

    if
    (
        command == "queue" ||
        command == "q"
    )
        player.queue(message);

    if(command == "np")
        player.nowPlaying(message);

    if
    (
        command == "disconnect" || 
        command == "dc" ||
        command == "stop"
    )
        player.stop(message);

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

    if
    (
        command == "collections" ||
        command == "cols"
    )
        items.collections(message);

    if(command.startsWith("sell "))
        items.sell(message);

    if(command.startsWith("trade "))
        items.trade(message);

    if
    (
        command == "collectionlist" ||
        command == "clist"
    )
        items.collectionList(message);

    //#endregion
        
    //#region RPG   

    if(command.startsWith("g "))    
        rpg.command(message);

    //#endregion

    //#region Dev commands

    if(command.startsWith("reset "))
    {
        if(message.author.id != "247955535620472844") return;
        
        database.reset(message.content.slice(7))
            .then(() => message.channel.send("Table recreated."));
    }
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
    if(command.startsWith("crash"))
        crash();

    //#endregion
});

bot.on('error', console.error);

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
    .then(result =>
    {
        var response = "✅";
        if(result) 
        {
            response = "```json\n" + result + "\n```";
            response = response
                .replace(/\\/g, "")
                .replace(/"{/g, "'{")
                .replace(/}"/g, "}'");
        }
        message.channel.send(response, { split: true })
        .catch(console.error);
    },
    () =>
    {
        message.author.send("An error occured with the query.");
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

function crash(message)
{
    message.channel.send("crash");
}

function test(message)
{
    if(message.author.id != "247955535620472844")
        return;

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

//IMPORTANT: Querying from Pitch's database for era pics

    // var db = mysql.createConnection
    // ({
    //     host: "80.211.57.115",
    //     user: "esfox",
    //     password: "esfoxcookie#",
    //     database: "twicestation",
    //     port: 3306
    // });

    // db.query('SELECT * FROM obr_artykul WHERE eragame = "1" AND art_dzial = "1" ORDER BY RAND() LIMIT 1;',
    // (error, rows) =>
    // {
    //     if(error) return console.log(error);

    //     var urlprefix = 'https://twicestation.kpoplul.com/upload/ogloszenie/';
    //     var image = urlprefix + rows[0].art_img;
    //     var era = rows[0].art_tagi;
    //     image = encodeURI(image);

    //     var embed = new Discord.RichEmbed()
    //         .setColor(data.color)
    //         .setTitle(era)
    //         .setImage(image);
    //         // .setImage("https://drive.google.com/uc?export=view&id=0B8Hl0NLXwoPyZlZzbHVXVERScEU");
    
    //     message.channel.send(embed);
    // });