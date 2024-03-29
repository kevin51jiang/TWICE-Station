
const Discord = require("discord.js");
const database = require("./database");

const data = require("./data.json");

exports.rng = (message) =>
{
    var rng1 = Math.floor(Math.random() * 99) + 1;
    var rng2 = Math.floor(Math.random() * 99) + 1;

    //TODO: Remove
    if(message.content != "‍earn")
    {
        if(rng1 != rng2)
            return;
    }

    var coinsRNG = rng1;

    if(coinsRNG == 0)
        return;

    var embed = new Discord.RichEmbed()
        .setColor(data.color)
        .setTitle("💰 You found **" + coinsRNG + "** TWICECOINS!");
    this.earnEmbed(message, coinsRNG, embed);
}

exports.earn = (message, amount, response) =>
{
    addCoins(message, message.author, amount, response, false);
}

exports.earnEmbed = (message, amount, response) =>
{
    addCoins(message, message.author, amount, response, true);
}

exports.balance = (message) =>
{   
    var user = message.mentions.members.first();

    if(!user)
        user = message.member;

    database.getCoins(user.id).then
    (coins =>
    {
        var embed = new Discord.RichEmbed()
        .setColor(data.color)
        // .setThumbnail(data.coinImage)
        .setAuthor("Current TWICECOINS: " + coins.toLocaleString(), data.coinImage)
        // .addField(coins.toLocaleString(), "‍")
        .setFooter("With these coins you can buy roles for yourself!");

        if(user.id == message.author.id)
            return message.channel.send(message.author + "\n", 
                // + "**THIS IS STILL UNDER TESTING. COINS MIGHT RESET ANYTIME.**",
                embed);

        embed.setAuthor(user.displayName, user.user.displayAvatarURL)
             .setTitle("💰 Current TWICECOINS: " + coins.toLocaleString(), 
                data.coinImage);
        message.channel.send(embed);
    },
    () =>
    {
        if(user.id == message.author.id)
            message.reply("you don't have coins yet!");
        else
            message.reply("that user doesn't have coins yet!");
    });
}

/* 
    200-400 = 50%
    401-600 = 20%
    601-700 = 5%
*/

exports.daily = (message) =>
{
    var currentTime = Date.now();
    var user = message.author.id;

    database.getDaily(user)
    .then(last =>
    {
        var difference = currentTime - parseInt(last);
        var hours = (difference / (1000 * 60 * 60));
        var minutes = (difference / (1000 * 60));
        var seconds = (difference / 1000);

        if(hours > 1) 
            minutes = minutes % 60;

        if(hours >= 24)
        {   
            database.setDaily(user, currentTime.toString())
            .then(() =>
            {
                giveDaily();
            }); 
        }
        else
        {
            seconds %= 60;

            var text = `\n⌛ Please wait ${(24 - Math.ceil(hours))} hours, ` + 
                `${(60 - (Math.ceil(minutes)))} minutes and ` +
                `${(60 - Math.ceil(seconds))} seconds.`;

            var embed = new Discord.RichEmbed()
                .setColor(data.color)
                .setTitle(text);
            message.channel.send(message.author, embed);
        }
    },
    () =>
    {
        database.addDaily(user, currentTime.toString())
        .then(() => 
        {
            giveDaily();
        }); 
    });

    function giveDaily()
    {
        var daily;
        var random = Math.floor((Math.random() * 100) + 1);

        function dailyRNG(min, max)
        {   
            return Math.floor(Math.random() * (max - min)) + min;
        }

        if(random <= 5) daily = dailyRNG(601, 700);
        else if(random <= 20) daily = dailyRNG(401, 600);
        else daily = dailyRNG(200, 400);

        var embed = new Discord.RichEmbed()
            .setColor(data.color)
            .setTitle(`💰 You received ${daily} TWICECOINS`);
        addCoins(message, message.author, daily, embed, true);
    }
}

exports.pay = (message) =>
{
    var payee = message.mentions.members.first();
    if(!payee) return message.reply("to whom do you want to pay?");
    
    if(payee.id == message.author.id)
        return message.reply("you can't pay yourself.");

    var amount = message.content.replace(payee.toString(), "")
        .replace(/\s\s+/g, " ")
        .split(" ")[1];

    if(isNaN(amount))
        return;

    var payor = message.member;
    database.getCoins(payor.id).then
    ((balance) =>
    {   
        amount = Math.abs(parseInt(amount));

        if(amount > balance)
            return message.reply("you don't have enough coins!");

        database.updateCoins(balance - amount, payor.id).then
        (() =>
        {
            var payorName = payor.displayName;
            var payeeName = payee.displayName;

            database.getCoins(payee.id).then
            ((coins) =>
            {
                database.updateCoins(coins + amount, payee.id).then
                (() => 
                    paidMessage(payorName, payeeName, amount)
                );
            }).catch(() =>
            {
                addNewUser(payee, amount).then
                (() =>
                    paidMessage(payorName, payeeName, amount)
                );
            });
        })
    }).catch(() => message.reply("you don't have coins yet!"));

    function paidMessage(payor, payee, amount)
    {
        var embed = new Discord.RichEmbed()
        .setAuthor("Transaction Complete", data.checkImage)
        .setColor(data.color)
        .addField(" **" + payee + "** has received " + 
            "__**" + amount + "**__ **TWICE**COINS.",
            "from **" + payor + "**");
    
        message.channel.send(embed);
    }
}

exports.add = (message) =>
{
    var testers = 
    [
        "247955535620472844",
        "200132493335199746"
    ];

    if(!testers.includes(message.author.id))  
        return message.reply("you **don't** have permission " + 
            "to use this command.");
        
    var user = message.mentions.users.first();
    if(!user) return;
    
    var amount = message.content.replace("<@!", "<@")
        .replace(user.toString(), "").replace(/\s\s+/g, " ")
        .split(" ")[1];

    if(isNaN(amount))
        return message.reply("that's not a number. :thinking:");

    var response = `**${user.username}** has received ` 
            + "__**" + amount + "**__ **TWICE**COINS.";

    addCoins(message, user, amount, response, false);
}

exports.leaderboard = (message) =>
{
    database.getAllCoins()
    .then(result =>
    {
        result = result.sort((a,b) =>
        {
            if(a.coins < b.coins)
              return 1;
            if(a.coins > b.coins)
              return -1;
            return 0;
        });
        
        if(result.length > 10)
            result = result.slice(0, 10);
        var table = "💰 **TWICE**COINS Leaderboard\n" +
            "```css\n";
        
        var number = 0;
        for(user of result)
        {   
            number++;
            var name = message.guild.members
                .get(user.id).user.tag;
            var spaces = "   ";
            if(number == 10) spaces = "  ";
            table += `#${number}${spaces}${formatString(name, 15)}   ${user.coins}\n`;
        }

        table += "\n```";
        message.channel.send(table);
    });
    
    function formatString(string, length)
    {
        if(string.length > length)
            string = string.slice(0, length);
        var spaces = length - string.length;
        string += new Array(spaces + 1).join(" ");
        return string;
    }
}

function addCoins(message, user, amount, response, mentionAndEmbed)
{
    database.getCoins(user.id).then
    (coins =>
    {
        database.updateCoins(coins + parseInt(amount), user.id).then
        (() =>
        {
            respond();
        });
    },
    () =>
    {
        addNewUser(user, amount).then
        (() => respond());
    });

    function respond()
    {
        if(!response) return;
        if(mentionAndEmbed)
            message.channel.send(user, response);
        else message.channel.send(response);
    }
}

function addNewUser(user, amount)
{
    return new Promise((success) =>
    {
        database.addCoins(user.id, user.username).then
        (() =>
        {
            database.updateCoins(amount, user.id).then
            (() => success());
        });
    });
}