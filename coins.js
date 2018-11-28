const Discord = require("discord.js");
const database = require("./database");

const data = require("./data.json");

//TODO: No more ;c

exports.command = (message, params) =>
{
    var parameters = params.slice(2);

    var command = params[1];

    if(!command)
    {
        switch(params[0])
        {
            case ";coins":
            case ";c":
            case ";bal":
                this.balance(message);
                break;

            case ";daily":
            case ";d":
                daily(message);
                break;
        }
    }

    switch(command)
    {
        case "balance":
        case "bal":
        case "check":
            this.balance(message);
            break;

        case "add":
        case "a":
            add(message, parameters[1]);
            break;

        case "pay":
        case "p":
        case "give":
        case "g":
            pay(message, parameters[1]);
            break;
    }
}

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

    var user = message.author;
    var coinsRNG = rng1;

    if(coinsRNG == 0)
        return;

    database.getCoins(user.id).then
    ((coins) =>
    {
        database.updateCoins(coins + coinsRNG, user.id).then
        (() => earnMessage(coinsRNG));
    },
    () =>
    {
        addNewUser(user, coinsRNG).then
        (() => earnMessage(coinsRNG));
    });

    function earnMessage(amount)
    {
        var embed = new Discord.RichEmbed()
            .setColor(data.color)
            .setTitle("💰 You found **" + amount + "** TWICECOINS!")
            .setFooter("THIS IS STILL UNDER TESTING. COINS MIGHT RESET ANYTIME.");
    
        message.channel.send(message.author, embed);
    }
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
            return message.channel.send(message.author + "\n" +
                "**THIS IS STILL UNDER TESTING. COINS MIGHT RESET ANYTIME.**",
                embed);

        embed.setAuthor(user.displayName, user.user.displayAvatarURL)
             .setTitle("💰 Current TWICECOINS: " + coins.toLocaleString(), data.coinImage);
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

function daily(message)
{
    var response = /* "**Still under developement.\n\n**" ;*/
        message.author;
    var currentTime = Date.now();
    var user = message.author.id;

    database.getDaily(user)
    .then(last =>
    {
        var difference = currentTime - parseInt(last);
        var hours = (difference / (1000 * 60 * 60));
        var minutes = (difference / (1000 * 60));
        var seconds = (difference / 1000);

        //TODO: fix
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

            var text = "\n⌛ Please wait __**" + (24 - Math.ceil(hours)) + " hours**__, " + 
                "__**" + (60 - (Math.ceil(minutes) % 60)) + " minutes**__, and " +
                "__**" + (60 - Math.ceil(seconds)) + " seconds**__.";
            message.channel.send(response, makeEmbed(text));
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

        response += ", you received **" + daily + " TWICE**COINS.";
        addCoins(message, message.author, daily, response, false);
    }
    
    function makeEmbed(text)
    {
        var embed = new Discord.RichEmbed()
            .setColor(data.color)
            .setTitle(text);
        return embed;
    }
}

function pay(message, amount)
{
    if(isNaN(amount))
        return;

    var payor = message.member;
    database.getCoins(payor.id).then
    ((balance) =>
    {   
        amount = parseInt(amount);

        if(amount > balance)
            return message.reply("you don't have enough coins!");

        var payee = message.mentions.members.first();
        if(!payee)
            return message.reply("to whom do you want to pay? :thinking:");

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
    }).catch(() => message.reply("You don't have coins yet!"));

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

function add(message, amount) 
{
    var testers = 
    [
        "247955535620472844",
        "200132493335199746",
        "274336998771130368",

        // "198205443045064705",
        // "236125387480891392",
        // "247023528702902272"
    ];

    if(!testers.includes(message.author.id))  
        return message.reply("you **don't** have permission " + 
            "to use this command.");

    if(isNaN(amount))
        return message.reply("that's not a number. :thinking:");
        
    var user = message.mentions.users.first();
    if(!user)
        return;

    var response = "**" + user.username + "** has received " 
            + "__**" + amount + "**__ **TWICE**COINS.";

    addCoins(message, user, amount, response, false);
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