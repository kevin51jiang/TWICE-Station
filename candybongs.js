const Discord = require('discord.js');
const database = require('./database');

const data = require("./data.json");

var cooldowns = {};
const cooldown = 3600000;

function onCooldown(message)
{
    var user = message.author.id;
    if(cooldowns[user]) 
    {
        if(cooldowns[user] != 0)
        {
            // var wait = (cooldown - (Date.now() - cooldowns[user])) / 1000;
            // if(wait > 0.9)
            //     wait = Math.round(wait);

            var title = "🚚  Your Candy Bong is still being delivered!";
            var embed = new Discord.RichEmbed()
                .setColor(data.color)
                .setTitle(title)
            message.channel.send(message.author, embed)
            return true;
        }
    } 
     
    cooldowns[user] = Date.now();
    setTimeout(() =>    
    {
        cooldowns[user] = 0;
    }, cooldown);

    return false;
}

exports.candybong = (message) =>
{
    var recipient = message.mentions.members.first();
    if(recipient) return get(message, recipient);
    
    if(onCooldown(message)) return;

    get(message, message.author);
}

exports.candybongs = (message) =>
{
    var user = message.author.id;
    database.getCandyBongs(user)
    .then(candybongs =>
    {
        if(candybongs <= 0)
            return message.reply("you don't have any Candy Bongs!")

        var candyBongsText = candybongs > 1? 
            "Candy Bongs" : "Candy Bong";

        var embed = new Discord.RichEmbed()
            .setColor(data.color)
            .setTitle(`🍭 You have ${candybongs} ${candyBongsText}`);

        message.channel.send(embed);
    },
    () => message.reply("you don't have any Candy Bongs!"));
}

exports.leaderboard = (message) =>
{
    database.getAllCandyBongs()
    .then(result =>
    {
        result = result.sort((a,b) =>
        {
            if(a.count < b.count)
              return 1;
            if(a.count > b.count)
              return -1;
            return 0;
        })

        if(result.length > 10)
            result = result.slice(0, 10);

        var table = "**🍭 Candy Bong Leaderboard**\n" +
            "```css\n";
        
        var number = 0;
        for(user of result)
        {   
            number++;
            var name = message.guild.members.get(user.id).displayName;
            
            table += `#${number}  ${formatString(user.count, 5)}  ${name}\n`;
        }

        table += "\n```";
        message.channel.send(table);
    });
    
    function formatString(string, length)
    {
        string = string.toString();
        var spaces = length - string.length;
        string = `[${new Array(spaces).join(" ")}${string} 🍭 ]`;
        return string;
    }
}

function get(message, user)
{
    var id = user.id;
    var giver = message.author.id;
    
    if(message.mentions.members.first() && giver == id)
        return message.reply("hahayes");

    if(giver != id)
    {
        database.getCandyBongs(giver)
        .then(giverCandyBongs =>
        {
            if(giverCandyBongs <= 0)
                return message.reply("you don't have any Candy Bongs!")  
            
            database.updateCandyBongs(giver, giverCandyBongs - 1)
            .then(() => add());
        },
        () => message.reply("you don't have any Candy Bongs!"));
    }
    else add();

    function add()
    {
        database.getCandyBongs(id)
        .then(candybongs =>
        {
    
            database.updateCandyBongs(id, candybongs + 1)
            .then(() => respond());
        },
        () =>
        {
            database.addCandyBongUser(id)
            .then(() => respond());
        });
    }

    function respond()
    {
        var text = id == giver?
            "🍭 You unboxed your Candy Bong!" :
            `🍭 You gave a Candy Bong to ${user.displayName}!`;

        var embed = new Discord.RichEmbed()
            .setColor(data.color)
            .setTitle(text);

        message.channel.send(message.author, embed);
    }
}