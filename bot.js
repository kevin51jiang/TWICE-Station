﻿const Discord = require('discord.js');
const bot = new Discord.Client();

const data = require('./data.json');

const database = require('./database');
const player = require('./player');
const info = require('./info');
const coins = require('./coins');
const games = require('./games');
const candybongs = require('./candybongs');
const items = require('./items');
// const rpg = require('./rpg');

// const fun = require('./fun');

const args = process.argv.slice(2)[0];
bot.login(args)
.catch(error =>
{
    if(error) console.log('gitgud haha'); 
});

let ping = '<@247955535620472844>•';
let prefix = ';';

bot.on('ready', () =>
{
    console.log(`Bot started!`);
    database.init();
    player.init(bot);
    
    if(bot.user.id === '517012034831908911')
    {
        prefix = '`';
        ping = ping + 'd';
    }
    else
        player.start();

    bot.user.setStatus('Online');
    bot.channels.get('533908427399757826').send(ping);
});

bot.on('message', message =>
{
    if
    (  
        message.author.bot &&
        message.content === ping
    )
        message.delete();

    if(message.author.bot) return;
    if(message.channel.type === 'dm')
    {
        if(message.content.startsWith(';sql '))
            sql(message);
        return;
    }

    if(message.guild.id === '524367541200617492')
        return;

    if(data.followChannels.includes(message.channel.id))
        return sendToFollowers(message);

    // pings(message); 

    coins.rng(message);
        
    // if(message.channel.id === '484658678721413120')
    //     info.addMeme(message);

    // if(command.startsWith(''))
    // {
    //     if(message.author.id != '247955535620472844')
    //         return message.reply('I'm Beta. Use <@496529668850057227> instead.');
    // }
    
    // fun.interaction(message);

    let command = message.content;
    command = command.toLowerCase().replace(/\s\s+/g, ' ');

    if(!command.startsWith(prefix)) return;
    command = command.replace(prefix, '');

    if(command === 'ping')
        pong(message);

    //#region info

    if(command.startsWith('i ') || command.startsWith('info '))
        info.command(message, command.split(/\s(.+)/));

    if(command === 'albums')
        info.albums(message, bot);
        
    // if(command === 'lists')
    //     info.lists(message);

    if(command.startsWith('lyrics '))
        info.lyrics(message);

    if(command.startsWith('follow '))
        info.follow(message);

    if(command.startsWith('unfollow '))
        info.unfollow(message);

    if(command === 'follows')
        info.follows(message);

    // if(command === 'meme')
    //     info.meme(message);

    if(command === 'help')
        info.help(message, bot);
            
    if(command === 'botinfo')
        info.botinfo(message, bot);
        
    if(command === 'serverinfo')
        info.serverinfo(message);
        
    if(command === 'userinfo' || command.startsWith('userinfo '))
        info.userinfo(message);

    //#endregion

    //#region music

    // for(var album in data.albums)
    // {
    //     if(command.replace(/\s/g, '') === album.toLowerCase()
    //         .replace('&', 'and')
    //         .replace('?', ''))
    //         player.playAlbum(channel, data.albums[album]);
    // }

    if(command === 'start')
        player.start(message);

    if
    (
        command.startsWith('play ') ||
        command.startsWith('p ')
    )
        player.playSong(message);

    if
    (
        command === 'skip' ||
        command === 'next' ||
        command === 'n'
    )
        player.skip(message);

    if
    (
        command === 'queue' ||
        command === 'q'
    )
        player.queue(message);

    if(command === 'np')
        player.nowPlaying(message);

    if
    (
        command === 'disconnect' || 
        command === 'dc' ||
        command === 'stop'
    )
        player.stop(message);

    if(command === 'reset')
        player.reset(message);

    //#endregion

    //#region coins

    if
    (
        command === 'coins' || 
        command === 'bal' ||
        command === 'c' ||
        command.startsWith('coins ') || 
        command.startsWith('bal ') ||
        command.startsWith('c ')
    )
        coins.balance(message);
        
    if
    (
        command === 'daily' ||
        command === 'd'
    )    
        coins.daily(message);

    if(command.startsWith('pay '))
        coins.pay(message);

    if(command.startsWith('addcoins '))
        coins.add(message);

    if
    (
        command === 'coinstop' ||
        command === 'ctop'
    )
        coins.leaderboard(message);

    //#endregion

    //#region games

    if(command === 'trivia' || command === 't')
        games.trivia(message);
    if
    (
        command.startsWith('trivia add ') ||
        command.startsWith('t add ')
    )
        games.triviaAdd(message);
    if(command === 'era')
        games.era(message);
    if(command === 'eras')
        games.eras(message);
    // if(command.startsWith('era add '))
    //     games.eraAdd(message);
    
    if
    (
        command.startsWith('wheel ') ||
        command.startsWith('w ')
    )
        games.wheel(message, bot);

    //TODO: Rename to (item)-guess
    if
    (
        command === 'guessthesong' ||
        command === 'gts'
    )
        games.audioGuess(message);
        // games.songGuess(message);

    if
    (
        command === 'guessthelyrics' ||
        command === 'gtl'
    )
        games.lyricsGuess(message);

    
    if
    (
        command === 'guessthemember' ||
        command === 'gtm'
    )
        games.memberGuess(message);

    if(command.startsWith('apidelay '))
        games.setAPIDelay(message);

    // if(command === 'verify all')
    //     games.eraVerifyAll(message);
    // if(command.startsWith('verify ') && command != 'verify all')
    //     games.eraVerify(message, true);
    // if(command.startsWith('reject '))
    //     games.eraVerify(message, false);
    // if(command === 'pending')
    //     games.pending(message);

    //#endregion 

    //#region candybongs

    if
    (
        command === 'candybong' ||
        command === 'cb' ||
        command.startsWith('candybong ') ||
        command.startsWith('cb ')
    )
        candybongs.candybong(message);

    if
    (
        command === 'candybongs' ||
        command === 'cbs'
    )
        candybongs.candybongs(message);
    
    if
    (
        command === 'candybongtop' ||
        command === 'cbtop'
    )
        candybongs.leaderboard(message);

    //#endregion

    //#region items

    if
    (
        command === 'search' ||
        command === 's'
    )
        items.search(message);
    if
    (
        command === 'oncebag' ||
        command === 'ob'
    )
        items.bag(message, false);
    if
    (
        command === 'oncebag m' ||
        command === 'ob m'
    )
    {
        items.bag(message, true);
    }

    if(command.startsWith('sell '))
        items.sell(message);

    if(command === 'items')
        items.list(message);

    if
    (
        command === 'itemcodes' ||
        command === 'ic'
    )
        items.codes(message);

    if(command === 'chances')
        items.chances(message);

    if
    (
        command === 'collections' ||
        command === 'cols'
    )
        items.collections(message);

    // if(command.startsWith('trade '))
    //     items.trade(message);

    if
    (
        command === 'collectionlist' ||
        command === 'clist'
    )
        items.collectionList(message);

    //#endregion
        
    //#region RPG   

    // if(command.startsWith('g '))    
    //     rpg.command(message);

    //#endregion

    //#region Dev commands

    if(command.startsWith('reset '))
    {
        if(message.author.id != '247955535620472844') return;
        
        database.reset(message.content.slice(7))
            .then(() => message.channel.send('Table recreated.'));
    }
    if
    (
        command === 'test' ||
        command.startsWith('test ')
    )
        test(message);
    if(command.startsWith('pr '))
        clean(message);
    if(command.startsWith('grant '))
        grantAccess(message);
    if(command.startsWith('smack '))
        smack(message);
    if(command.startsWith('crash'))
        crash(message);

    //#endregion
});

bot.on("guildMemberRemove", member =>
{
    database.remove(member.id);
});

bot.on('error', console.error);

// function pings(message)
// {
//     var chat = message.content.toLowerCase();

//     if
//     (
//         message.isMentioned(bot.user) ||
//         chat.includes(" chloe ") ||
//         chat.includes(" bot ") ||
//         chat.includes(" esfox ")
//     )
//     {
//         var tzuyuping = bot.emojis.find(emote => emote.name === "TzuyuPing");
//         message.react(tzuyuping.id);
//     }
// }

function pong(message)
{
    const embed = new Discord.RichEmbed()
        .setColor(data.color)
        .setDescription("**" + Math.round(bot.ping) + " ms**");
    message.channel.send(embed);
}

function sendToFollowers(message)
{
    setTimeout(_ => run(), 1000);
    function run()
    {
        const attachmentsURLs = parseAttachments(message.attachments.array());
        const embedsURLs = parseEmbedMedia(message.embeds);
        let links = [ ...attachmentsURLs, ...embedsURLs ];
        if(links.length === 0) return;

        links = links.reduce((chunks, element, i) =>
        {
            const index = Math.floor(i/5);
            if(!chunks[index]) chunks[index] = [];
            chunks[index].push(element);
            return chunks;
        }, []);

        database.getFollowers(message.channel.id)
        .then(followers =>
        {
            followers = followers.map(f => f.id);
            for(const follower of followers)
            {
                if(follower === message.author.id) continue;

                const members = message.guild.members.map(m => m.id);
                if(!members.includes(follower)) continue;
                links.forEach(chunk =>
                {
                    chunk = `\`Message link:\` ${message.url}\n\n` 
                        + chunk.join('\n');
                    message.guild.members.get(follower).send(chunk)
                        .catch(_ => 
                            console.log('Some weird error is happening here'));
                });
            }
        });
    }

    function parseAttachments(attachments)
    {
        if(attachments.length === 0) return [];
        attachments = attachments.filter(a => a.height > 1 && a.width > 1);
        return attachments.map(a => a.url);
    }

    function parseEmbedMedia(attachments)
    {
        const types = [ 'image', 'gifv', 'video' ];
        if(attachments.length === 0) return [];
        attachments = attachments.filter(a => 
            types.includes(a.type) || a.video || a.image);
        return attachments.map(a => a.url);
    }
}

function clean(message)
{
    if(message.author.id != "247955535620472844")
        return;

    const limit = parseInt(message.content.split(" ")[1]);
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
    // var id = message.content.split("-");
    // if(!id) return;

    // var user = message.guild.members.get(id[1]);
    // var channel = message.guild.channels.get("503988943931441172");
    // channel.overwritePermissions(user,
    // {
    //     READ_MESSAGES: true,
    //     SEND_MESSAGES: true
    // })
    // .then(() =>
    // {
    //     message.channel.send(bot.user.username + " has been granted access to verification channel");
    // });
}

function sql(message)
{
    if
    (message.author.id != "247955535620472844" &&
     message.author.id != "200132493335199746")
        return message.reply("no.")

    const query = message.content.slice(5);
    database.query(query)
    .then(result =>
    {
        let response = "✅";
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
    if(message.author.id != '247955535620472844') return;
    message = undefined;
    message.channel.send("crash");
}

async function test(message)
{
    if(message.author.id != "247955535620472844")
        return;
}

//#region misc
// 533551595644780554
    // const category = message.guild.channels.get('533551227951251456');
    // message.channel.send(category.children.array()
    //     .map(c => `${c.id}`).join('\n'));

    // var parameter = message.content;
    // parameter = parameter.substring(parameter.indexOf(" ") + 1);
    // if(parameter === message.content) return;

    // items.get(message, parameter);

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
//#endregion