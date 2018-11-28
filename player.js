const Discord = require('discord.js');
const data = require("./data.json");
const ytdl = require('ytdl-core');

var 
    channel, 
    voiceChannel,
    dispatcher,
    index = 0,
    stopped;
    
//TODO: Fix player

exports.init = (testChannel) =>
{
    voiceChannel = testChannel;
}

exports.playAlbum = (ch, album) =>
{
    var link = album.link;

    if(!link)
        return;

    channel = ch;

    var tracks = album.tracks.map(track => track.link);
    if(!tracks)
        return;

    stopped = false;

    var connection = voiceChannel.connection;
    if(connection)
    {
        channel.send("Now playing **TWICE - " + album.title + "**...🎵");
        play(connection, tracks);
    }
    else
    {
        voiceChannel.join().then(connection =>
        {
            channel.send("Now playing **TWICE - " + album.title + "**...🎵");
            play(connection, tracks);
        }).catch(console.error);
    }
}

exports.skip = (channel) =>
{
    var connection = voiceChannel.connection;
    if(!connection)
        return;

    dispatcher.end();
    var embed = new Discord.RichEmbed()
        .setColor("#A32CFF")
        .setTitle("⏭ Skipped song!");
    channel.send(embed);
}

exports.connect = (channel) =>
{
    voiceChannel.join().then(() =>
    {
        channel.send("What are you in the mood for? `;lists`");
    }).catch(console.error);
}

exports.disconnect = (channel) =>
{
    var connection = voiceChannel.connection;
    if(connection)
    {
        stopped = true;
        if(dispatcher) dispatcher.end();
        connection.disconnect();
        channel.send("I don't like you either.");
    }
    else
        channel.send("I'm not in a voice channel.");
}

function play(connection, links)
{
    var link = links[index];

    const streamOptions = { seek: 0, volume: 1 };
    const stream = ytdl(link, { filter : 'audioonly' });
    dispatcher = connection.playStream(stream, streamOptions);
    dispatcher.on("end", () =>
    {
        index++;
        if(index >= links.length)
        {
            index = 0;
            stopped = true;
            connection.disconnect();
            return;
        }

        if(stopped) index = 0;
        else play(connection, links);
    });
}