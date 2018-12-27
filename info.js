const Discord = require('discord.js');
const database = require("./database");
const request = require("request");
const cheerio = require("cheerio");
const fs = require("fs");

const data = require("./data.json");
const memes = require("./memes.json");

exports.command = (message, params) =>
{
    var command = params[1].toLowerCase();

    for(key in data.albums)
    {
        if(command
            .replace(" and ", "&")
            .replace(" n ", "&")
            .replace(/\s/g, '') == key.toLowerCase())
        {
            var album = data.albums[key];

            var tracks = "";
            for(i in album.tracks)
                tracks += "\n" + (parseInt(i) + 1) + ". " + album.tracks[i].title;

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

exports.albums = (message) =>
{
    var albums = "";

    var i = 1;
    for(album in data.albums)
    {
        albums += "\n" + i + ". " + 
            data.albums[album].title;
        i++;
    }

    var embed = new Discord.RichEmbed()
        .setTitle("TWICE Current Albums 💿")
        .setColor("#fc5d9d")
        .setThumbnail("https://i.imgur.com/hhfIJUF.gif")
        .setDescription(albums)
        // .setDescription(' ```' + 
        // ';page two\n' + 
        // ';signal\n' +
        // ';twicetagram\n' +
        // ';merry and happy\n' + 
        // ';candy pop\n' +
        // ';what is love\n' +
        // ';summer nights\n' +
        // ';bdz' + 
        // '```')
        // .setFooter("These are the current albums/ " +
        //     "mini albums TWICE has released");
    
    message.channel.send(embed);
}

exports.lists = (message) =>
{
    var embed = new Discord.RichEmbed()
        .setColor(data.color)
        .setThumbnail("https://i.imgur.com/Vp9dbMJ.png")
        .setTitle("What I can play for you? 🎶")
        .setDescription
        (
            '```' +
            ';korean releases\n' +
            ';japanese releases\n' +
            ';melody projects\n' +
            ';covers\n' +
            ';genres\n' +            
            '```'
        );
        
    message.channel.send(embed);
}

exports.lyrics = (message) =>
{
    var text = message.content;
    text = text.substring(text.indexOf(" ") + 1);
    var parameters = text.split(" ");
    if(!parameters) return;
    
    var languages = [ 'rom', 'han', 'eng' ];
    var language = 0;

    if(languages.includes(parameters[0]))
    {
        language = languages.indexOf(parameters[0]);
        parameters.splice(0, 1);
    }
    
    var song = parameters.join(" ");
    var album = Object.values(data.albums)
        .find(v => v.tracks.find(t => hasTitle(t, song)));
    if(!album) return error();

    var track = album.tracks.find(t => hasTitle(t, song));

    function hasTitle(track, song)
    {
        return track.title.toLowerCase()
            .includes(song.toLowerCase());
    }

    var link = track.lyrics;
    if(!link) return error();

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
                var td = cheerio.load(element);
                element = td("td").each((i, e) =>
                {
                    if(i == language)
                    {
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

    function error()
    {
        return message.reply("cannot find lyrics for that song.");
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

    fetch();
    
    function fetch()
    {
        var messageID = memes[~~(Math.random() * memes.length)];
        message.guild.channels.get("484658678721413120")
        .fetchMessage(messageID)
        .then(m => 
        {
            if(!m) return fetch();
            if(m.attachments.size == 0)
            {
                if(m.embeds.length == 0) return fetch();
                return readMessage(false);
            }
            readMessage(true);

            function readMessage(hasAttachment)
            {
                var content = hasAttachment?
                    m.attachments.first() : m.embeds[0];
                
                var poster = m.member;
                if(!poster) poster = m.author.username;
                else poster = poster.displayName;
                var response = `\`Meme posted by: ${poster}\`\n\n`;
                
                var text = m.content.replace(content.url, "");
                if(text)
                {
                    if(m.mentions.users.size != 0)
                    {
                        var mention = m.mentions.users.first().username;
                        text = text.replace(/<@.*>/g, `**${mention}**`);
                    }
                    response = `${response}${text}\n`;
                }
                response += content.url;

                message.channel.send(response);
            }
        })
        .catch(error =>
        {
           console.log(error);
           message.reply("woops. Something went wrong. Try again.");
        });
    }
}

exports.addMeme = (message) =>
{
    memes.push(message.id);
    try
    {
        fs.writeFile("memes.json", JSON.stringify(memes, null, "\t"), 
            "utf8", error => { if(error) throw error; });
    }
    catch(error) { console.log(error); }
}

exports.help = (message, bot) =>
{
    var thumbnail = bot.user.displayAvatarURL;
    var embed = new Discord.RichEmbed()
        .setColor("#A32CFF")
        .setThumbnail(thumbnail)
        .setTitle("Help")
        .setDescription("Check this [website](https://twicestation.weebly.com/) for the commands.");
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
        .setDescription("I play TWICE music. Albums, Covers, " + 
            "Japanese releases etc..\n\nIf you need any help, " + 
            "doing `;help` will show the list of what I can do " + 
            "for you!")
        .addField("If you're having any problems message my creator:",
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
