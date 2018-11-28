const Discord = require('discord.js');
const data = require("./data.json");

var message;

exports.command = (msg, params) =>
{
    message = msg;
    parameters = params;

    var command = params[1].toLowerCase();

    for(key in data.albums)
    {
        if(command.replace(/\s/g, '') == key.toLowerCase())
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
            
    message.channel.send(embed);
    return;
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
