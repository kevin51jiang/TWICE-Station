const Discord = require('discord.js');
const data = require("./data.json");
const ytdl = require('ytdl-core');

const radioChannel = "496542169549504538";

var 
    bot, 
    song,
    toQueue,
    stop,
    connectingMessage;

var tracks = [],
    queue = [];

function play()
{ 
    song = queue.shift();
    if(!song) return;

    connection().playStream(ytdl(song.url, 
        { audioonly: true, quality: "highestaudio" }));
    connection().player.setBitrate(96);
    connection().dispatcher.setBitrate(96);
    connection().dispatcher.on("start", () =>
    {
        if(!connectingMessage) return;
        connectingMessage.edit(makeEmbed("🔊  Started Playing"))
            .then(() => connectingMessage = null);

    });
    connection().dispatcher.on("end", () =>
    { 
        if(stop) return;
        connection().player.streamingData.pausedTime = 0;

        if(queue.length == 0)
            queue.push(tracks[getRandomIndex()]);

        play();
    });
    
    connection().dispatcher.on("error", () =>
    {
        console.error;
    });
}

exports.init = (client) =>
{
    bot = client;

    for(i in data.albums)
    {
        var albumObject = data.albums[i];
        var album = 
        {
            title: albumObject.title,
            cover: albumObject.cover,
            color: albumObject.color
        };

        albumObject.tracks.forEach(element =>
        {
            if(tracks.find(t => t.title == element.title)) return;

            var song =
            {
                title: element.title,
                url: element.link,
                album: album
            };

            tracks.push(song);
        });
    }
}

exports.start = (message) =>
{
    if(!radioChannel) return;
    if(!tracks) return;
    if(tracks.length <= 0) return;

    if(connection()) 
        return message.channel
            .send(makeEmbed("❌ Already connected to a voice channel."));
    
    toQueue = false;
    stop = false;
    
    message.channel.send(makeEmbed("💬  Connecting to voice channel..."))
    .then(m =>
    {
        bot.channels.get(radioChannel)
        .join().then(() =>
        {
            connectingMessage = m;
            
            queue.push(tracks[getRandomIndex()]);
            play();
    
        }).catch(console.error);
        
    });
}

exports.skip = (message) =>
{ 
    if(!connection()) return;
    if(!connection().dispatcher) return;
    
    connection().dispatcher.end();
    if(!connection()) return;

    if(!message) return;
    message.channel.send(makeEmbed("⏭  Skipped"));
}

exports.playSong = (message) =>
{
    if(!connection())
        return message.channel.send("`;start` first.");
    
    var parameters = message.content;
    parameters = parameters.substring(parameters.indexOf(" ")).trim();
    if(!parameters) return;
    if(parameters == message.content) return;

    var find = tracks.find(e => e.title.toLowerCase()
        .includes(parameters.toLowerCase()));

    if(!find) return message.channel.send(makeEmbed("❌ Can't find song."));

    queue.push(find);

    if(!toQueue)
    {
        toQueue = true;
        this.skip();
        message.channel.send(makeEmbed(`🎶 Now Playing "${find.title}"`));
    }
    else message.channel.send(makeEmbed(`✅  ${find.title} added to the queue.`));
}

// exports.playAlbum = (message, album) =>
// {
//     var tracks = album.tracks.map(track => track.link);
//     console.log(tracks.shift());
// }

exports.queue = (message) =>
{
    if(!queue) return;
    if(!song) return;

    var playQueue = [];
    playQueue.push(song);
    for(item of queue)
        playQueue.push(item);
        
    if(playQueue.length <= 1)
        return message.channel.send(makeEmbed("❌ The queue is empty."));

    var description = "";
    for(var i = 0; i < playQueue.length; i++)
        description += `${i + 1}. ${playQueue[i].title}\n`;

    var embed = makeEmbed("▶  Play Queue")
        .setDescription(description);
    message.channel.send(embed);
}

exports.nowPlaying = (message) =>
{
    if(!song) return message.channel.send(makeEmbed("❌ Nothing is playing."));

    // var time = connection().dispatcher.time;
    // var seconds = Math.floor(time/1000);
    // var minutes = Math.floor(seconds/60);
    // if(seconds < 10) seconds = `0${seconds}`;
    // time = `${minutes}:${seconds}`;

    var embed = makeEmbed("🎶 Now Playing")
        .setThumbnail(song.album.cover)
        .addField(song.title, song.album.title);

    message.channel.send(embed);
}

exports.stop = (message) =>
{
    if(!connection()) return;
    
    stop = true;
    connection().disconnect();
    
    if(message)
        message.channel.send(makeEmbed("🔇 Stopped Playing"));
}

exports.reset = (message) =>
{
    if(!connection()) return;
    
    module.exports.stop();
    setTimeout(() =>
    {
        module.exports.start();
        message.channel.send(makeEmbed("🔁  Restarted"));  
    }, 1000);
}

function connection()
{
    return bot.voiceConnections.get("481250119304478741");
}

var currentIndex;

function getRandomIndex()
{
    var index = Math.floor(Math.random() * (tracks.length));
    if(index == currentIndex) return getRandomIndex();
    currentIndex = index;
    return index;
}

function makeEmbed(text)
{
    var embed = new Discord.RichEmbed()
        .setColor(data.color)
        .setTitle(text);
    
    return embed;
}