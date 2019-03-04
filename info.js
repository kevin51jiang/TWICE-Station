const Discord = require('discord.js');
const database = require("./database");
const request = require("request");
const cheerio = require("cheerio");
const fs = require("fs");

const data = require("./data.json");
// const memes = require("./memes.json");

// const 

exports.command = (message, params) =>
{
    var command = params[1].toLowerCase();

    for(key in data.albums)
    {
        if(key.toLowerCase()
            .match(command
                .replace(" and ", "&")
                .replace(" n ", "&")
                .replace(/\s/g, '')))
        {
            var album = data.albums[key];

            var tracks = "";
            for(i in album.tracks)
                tracks += "\n" + (parseInt(i) + 1) + ". " + 
                    album.tracks[i].title;

            var embed = new Discord.RichEmbed()
                .setColor(album.color)
                .setThumbnail(album.cover)
                .setTitle(album.title)
                .setDescription(tracks)
                .setFooter("Total length: " + album.duration);    
            
            message.channel.send(embed);
        }
    }
}

exports.albums = (message, bot) =>
{
    var albums = Object.values(data.albums);
    var korean = albums.filter(a => !a.isJapanese),
        japanese = albums.filter(a => a.isJapanese);

    var pages = [ korean, japanese ];
    var page = 0;

    sendPage();

    function sendPage()
    {
        var list = pages[page];

        var embed = new Discord.RichEmbed()
            .setTitle("TWICE Current Albums 💿")
            .setColor(data.color)
            .setThumbnail("https://i.imgur.com/hhfIJUF.gif")
            .setFooter(`Page ${page + 1} / 2`);

        var country = "Korean";
        var switchPage = "➡";
        if(page == 1)
        {
            country = "Japanese";
            switchPage = "⬅";
        }
        
        addAlbums(list);
        
        function addAlbums(list)
        {
            let i = 1;
            let string = "";
            list.forEach(a => { string += `${i}. ${a.title}\n`; i++; });
            embed.addField(`${country} Releases`, string, true);
        }

        message.channel.send(embed)
        .then(m =>
        {
            m.react("⬅").then(() => m.react("➡"));

            const filter = (reaction, user) => 
            {
                return reaction.emoji.name == switchPage &&
                    user.id != bot.user.id;
            };

            m.awaitReactions(filter,
                {
                    max: 1,
                    time: 60000,
                    error: [ 'time' ]
                })
            .then(reactions =>
            {
                if(match("⬅"))
                    changePage(0);
                
                if(match("➡"))
                    changePage(1);

                function changePage(index)
                {
                    if(page == index) return;
                    page = index;
                    embed.setFooter(`Page ${index + 1} / 2`);
                    m.delete();
                    sendPage();
                }

                function match(emote)
                {
                    return emote == reactions.first().emoji.name;
                }
            })
            .catch(() =>
            {
                embed.footer = null;
                m.edit(embed);
                m.clearReactions();
            });
        });
    }
}

// exports.lists = (message) =>
// {
//     if(message.author.id != "200132493335199746" ||
//         message.author.id != "247955535620472844")
//         return;

//     var embed = new Discord.RichEmbed()
//         .setColor(data.color)
//         .setThumbnail("https://i.imgur.com/Vp9dbMJ.png")
//         .setTitle("What I can play for you? 🎶")
//         .setDescription
//         (
//             '```' +
//             ';korean releases\n' +
//             ';japanese releases\n' +
//             ';melody projects\n' +
//             ';covers\n' +
//             ';genres\n' +            
//             '```'
//         );
        
//     message.channel.send(embed);
// }

exports.follow = (message) =>
{
    const user = message.author.id;
    let channels = message.mentions.channels.array();
    if(!channels || channels.length === 0) 
        return message.reply('please mention the channel to follow.');
    channels = channels.map(c => c.id);
    
    const followChannels = data.followChannels;
    if(!channels.every(c => followChannels.includes(c)))
    {
        if(channels.some(c => followChannels.includes(c)))
            return message.reply("some of those channels " + 
                "can't be followed.");
        return message.reply(`${channels.length > 1? 'those channels' : 
            'that channel'} can't be followed.`);
    } 

    database.getFollows(user)
    .then(follows =>
    {
        if(!follows || follows.length === 0) follows = [];
        follows = JSON.parse(follows);
        if(channels.every(c => follows.includes(c)))
            return message.reply('you\'ve already followed ' + 
                `${channels.length > 1? 'those channels': 'that channel'}.`);
        channels = channels.filter(c => !follows.includes(c));

        follows.push(...channels);
        database.updateFollows(user, JSON.stringify(follows))
            .then(_ => respond());
    }, _ =>
    {
        let follows = [];
        follows.push(...channels);
        database.addFollows(user, JSON.stringify(follows))
            .then(_ => respond());
    });

    const respond = _ =>
        message.channel.send(new Discord.RichEmbed()
            .setColor(data.color)
            .setTitle('🔔 Followed...')
            .setDescription(channels.map(c => `<#${c}>`).join(', ') + 
                '\n\nMedia posted there will be DM\'ed to you.'));
}

exports.unfollow = async (message) =>
{
    let follows = await database.getFollows(message.author.id)
        .catch(_ => noFollows(message));

    if(!follows) return;
    if(follows.length === 0) return noFollows(message);

    let channels = message.mentions.channels.array();
    if(!channels || channels.length === 0) 
        return message.reply('please mention the channel to unfollow.');
    channels = channels.map(c => c.id);

    follows = JSON.parse(follows);
    channels = channels.filter(c => follows.includes(c));
    if(channels.length === 0)
        return message.reply(`you haven't followed ${channels.length > 1?
            'those channels' : 'that channel'}.`);
    
    follows = follows.filter(f => !channels.includes(f));
    database.updateFollows(message.author.id, JSON.stringify(follows))
        .then(_ => respond());

    const respond = _ =>
        message.channel.send(new Discord.RichEmbed()
            .setColor(data.color)
            .setTitle('🔕 Unfollowed...')
            .setDescription(channels.map(c => `<#${c}>`).join(', ')));
}

exports.follows = async (message) =>
{
    let follows = await database.getFollows(message.author.id)
        .catch(_ => noFollows(message));
    
    if(!follows) return;
    if(follows.length === 0) return noFollows(message);

    follows = JSON.parse(follows).map(f => `<#${f}>`).join(',');

    const embed = new Discord.RichEmbed()
        .setColor(data.color)
        .setTitle('🔔 You are following...')
        .setDescription(follows);
    
    message.channel.send(embed);
}

exports.lyrics = (message) =>
{
    var text = message.content;
    text = text.substring(text.indexOf(" ") + 1);
    var parameters = text.split(" ");
    if(!parameters) return;
    
    var languages = [ 'rom', 'han', 'eng', 'jap'];
    var language = 0;

    if(languages.includes(parameters[0]))
    {
        if(parameters[0] == "jap") 
            parameters[0] = "han";
        language = languages.indexOf(parameters[0]);
        parameters.splice(0, 1);
    }
    
    var song = parameters.join(" ")
    var album = Object.values(data.albums)
        .find(v => v.tracks.find(t => hasTitle(t, song)));
    if(!album) return errorReply();

    var track = album.tracks.find(t => hasTitle(t, song));

    function hasTitle(track, song)
    {
        return track.title.toLowerCase()
            .replace(/\(|\)|\./g, "")
            .replace("-", " ")
            .match(song.toLowerCase());
    }

    var link = track.lyrics;
    if(!link) return errorReply();

    message.channel.startTyping();
    request(link, (error, response, html) =>
    {
        message.channel.stopTyping();
        if(error) return error(); 
        if(response.statusCode != 200) return error();

        const $ = cheerio.load(html);
        $("table").each((index, element) =>
        {
            var border = $(element).attr("border");
            if(border == 0)
            {
                var hasLanguage = false;
                var td = cheerio.load(element);
                element = td("td").each((i, e) =>
                {
                    if(i == language)
                    {
                        hasLanguage = true;
                        var lyrics = $(e).text();
                        sendLyrics(lyrics);

                        // var lyrics = [];
                        // var stanza = cheerio.load(e);
                        // stanza("p").each((j, p) =>
                        // {
                        //     lyrics.push($(p).text());
                        // });

                        // sendLyrics(lyrics.join("\n\n"));
                    }
                });
                
                if(!hasLanguage) 
                    return errorReply("the song doesn't " + 
                        "have that language.");
            }
        });
    });

    function sendLyrics(lyrics)
    {
        var embed = new Discord.RichEmbed()
            .setColor(data.color);

        if(lyrics.length <= 2000)
        {
            embed.setTitle(track.title)
                 .setDescription(lyrics);
            return message.channel.send(embed);
        }

        lyrics = lyrics.split("\n");
        var lines = lyrics.length;
        var lyricBlocks = [];
        for(let i = 0; i < lines; i += lines / 2)
            lyricBlocks.push(lyrics.slice(i, i + (lines / 2)));

        for(let i = 0; i < lyricBlocks.length; i++)
        {
            var embed = new Discord.RichEmbed()
                .setColor(data.color);

            if(i == 0) embed.setTitle(track.title)
            embed.setDescription(lyricBlocks[i].join("\n"));
            message.channel.send(embed);
        }
    }

    function errorReply(response)
    {
        if(!response)
            message.reply("cannot find lyrics for that song.");
        else message.reply(response);
    }
}

var onCooldown = false;

exports.meme = (message) =>
{
    if(onCooldown) return message.reply("please wait a few seconds.");
    onCooldown = true;
    setTimeout(() =>
    {
        onCooldown = false;
    }, 3000);

    //TODO: Get from reddit

    // fetch();
    
    // function fetch()
    // {
    //     var messageID = memes[~~(Math.random() * memes.length)];
    //     message.guild.channels.get("484658678721413120")
    //     .fetchMessage(messageID)
    //     .then(m => 
    //     {
    //         if(!m) return fetch();
    //         if(m.attachments.size == 0)
    //         {
    //             if(m.embeds.length == 0) return fetch();
    //             return readMessage(false);
    //         }
    //         readMessage(true);

    //         function readMessage(hasAttachment)
    //         {
    //             var content = hasAttachment?
    //                 m.attachments.first() : m.embeds[0];
                
    //             var poster = m.member;
    //             if(!poster) poster = m.author.username;
    //             else poster = poster.displayName;
    //             var response = `\`Meme posted by: ${poster}\`\n\n`;
                
    //             var text = m.content.replace(content.url, "");
    //             if(text)
    //             {
    //                 if(m.mentions.users.size != 0)
    //                 {
    //                     var mention = m.mentions.users.first().username;
    //                     text = text.replace(/<@.*>/g, `**${mention}**`);
    //                 }
    //                 response = `${response}${text}\n`;
    //             }
    //             response += content.url;

    //             message.channel.send(response);
    //         }
    //     })
    //     .catch(error =>
    //     {
    //        console.log(error);
    //        message.reply("woops. Something went wrong. Try again.");
    //     });
    // }
}

// exports.addMeme = (message) =>
// {
//     memes.push(message.id);
//     try
//     {
//         fs.writeFile("memes.json", JSON.stringify(memes, null, "\t"), 
//             "utf8", error => { if(error) throw error; });
//     }
//     catch(error) { console.log(error); }
// }


exports.help = (message, bot) =>
{
    var embed = new Discord.RichEmbed()
        .setColor(data.color)
        .setAuthor(bot.user.username, bot.user.displayAvatarURL)
        // .setThumbnail(bot.user.displayAvatarURL)
        .setTitle("TWICE Station Help")
        .setDescription("Visit this [link]" + 
            "(https://github.com/esfox/TWICE-Station/wiki/" + 
            "TWICE-Station-Help/) to see the list of commands.");
        // .setDescription("I can play all sorts of stuff! To check what I can play do `;lists` I'm sure you'll be able to find something you like! If you want me to disconnect because you hate me do `;disconnect`");

    message.channel.send(embed);
}

exports.userinfo = (message) =>
{
    var member = message.mentions.members.first();
    if(!member) 
        member = message.member;

    var user = member.user;

    var thumbnail = user.displayAvatarURL;
    var rolesText = "";

    var roles = member.roles.map(role => role.toString());
    for (role of roles)
    {
        if(role != "@everyone")
            rolesText += role + " ";
    }

    var embed = new Discord.RichEmbed()
        .setColor(data.color)
        .setTitle("User Info for **" + member.displayName + "**")
        .setThumbnail(thumbnail)
        .addField("ID", user.id)
        .addField("Username", user.username + "#" + user.discriminator, true);
        
    if(member.nickname)
        embed.addField("Nickname", member.nickname, true);    

    embed.addField("Registered On", user.createdAt)
         .addField("Joined On", member.joinedAt);

    if(rolesText)
        embed.addField("Roles", rolesText);

    var coins = 0,
        candybongs = 0;

    database.getCoins(user.id)
    .then(c =>
    {
        coins = c;
        database.getCandyBongs(user.id)
        .then(cb =>
        {
            candybongs = cb;
            addCredits();
        },
        () => { addCredits(); });
    },
    () => { addCredits(); });

    function addCredits()
    {
        embed.setFooter(`User has: 💰 ${coins.toLocaleString()} TWICECOINS ` + 
            `| 🍭 ${candybongs} Candy Bongs`);
        send();
    }

    function send()
    {
        message.channel.send(embed);
        return;
    }
}

exports.botinfo = (message, bot) =>
{
    var thumbnail = bot.user.displayAvatarURL;
    var embed = new Discord.RichEmbed()
        .setColor(data.color)
        .setThumbnail(thumbnail)
        .setTitle("TWICE Station", bot.user.username)
        .setDescription("I play TWICE music, have currency, mini-games, etc. " + 
            "\n\nIf you need any help, " + 
            "doing `;help` will show the list of what I can do " + 
            "for you!")
        .addField("If you're having any problems or concerns, message my creator:",
            /* "<@200132493335199746> &  */"<@247955535620472844>")
        .addField("I was created on:", bot.user.createdAt);

    message.channel.send(embed);
}

exports.serverinfo = (message) =>
{
    var thumbnail = message.guild.iconURL;
    var embed = new Discord.RichEmbed()
        .setColor(data.color)
        .setThumbnail(thumbnail)
        .addField("Server Name", message.guild.name)
        .addField("Created On", message.guild.createdAt)
        .addField("Region", message.guild.region)
        .addField("Total Members", message.guild.memberCount)
    
    message.channel.send(embed);
}

function noFollows(message)
{
    message.reply('you have\'t followed any channels yet.');
}