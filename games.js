const Discord = require('discord.js');
const fs = require("fs");
const request = require("request");
const imgur = require("imgur");

const coins = require("./coins");
const database = require("./database");

const data = require("./data.json");
// const trivias = require("./trivias.json");
// const eraPics = require("./erapics.json");
// const pending = require("./pending.json");
const members = require("./items.json").members;

var commands = 
{
    trivia: "trivia",
    t: "t",
    era: "era",
    wheel: "wheel"
};

var rewards =
{
    trivia: 25,
    era: 50,
    wheel: 100
};

//TODO: Cooldown is per command.
const cooldown = 3000;
var cooldowns =
{
    wheel: {}
};

function onCooldown(message, command)
{
    var cd = {};
    switch(command)
    {
        case commands.wheel:
            cd = cooldowns.wheel;
            break;
    }

    if(cd[message.author.id])
    {
        var embed = new Discord.RichEmbed()
            .setColor(data.color)
            .setTitle("❄ On cooldown, please wait a few seconds.");
        message.channel.send(message.author, embed);
        return true;
    }
    
    cd[message.author.id] = true;
    setTimeout(() =>
    {
        delete cd[message.author.id];
    }, cooldown);
    return false;
}

//TODO: only accept trivia and era answers
function waitAnswer(message)
{
    return new Promise
    ((success) =>
    {
        var userAnswered = false;
        var collector = new Discord.MessageCollector
        (
            message.channel,
            m => m.author.id === message.author.id,
            { time: 30000 }
        );  
    
        collector.on("collect",
        reply =>
        {
            userAnswered = true;
            collector.stop();
            
            // if(Object.values(commands)
            //     .includes(`${prefix}${reply.content}`))
            //     return;
    
            success(reply);
        });
    
        collector.on("end",
        () =>
        {  
            if(!userAnswered)
                message.reply("time's up!");
        });
    });
}

var testers = 
[
    "247955535620472844",
    "274336998771130368",
    "417726391698718720"
];

//#region Trivia
exports.trivia = (message) =>
{
    if(!testers.includes(message.author.id))
        return message.reply("we still need more trivias so " +
            "please submit some. 😔\n");

        // var questions = trivias;
        // var triviaNumber = getRandomIndex(questions);

    function getTrivia(answered)
    {
        request("http://api.kpoplul.com:82/twice/get-trivia",
        (error, response, trivia) =>
        {
            if(error) 
            {
                message.channel.send("Can't get an image. Please try again.");
                return console.log(error);
            }
            if(response.statusCode != 200)
            {
                message.channel.send("Can't get an image. Please try again.");
                return console.log("a problem occured");
            } 

            trivia = JSON.parse(trivia);

            console.log(trivia);

            if(!answered)
                return askTrivia(trivia);
            
            if(answered.includes(trivia.id))
                return getTrivia(answered);
            
            askTrivia(trivia);
        });
    }

    database.getTrivias(message.author.id)
    .then(answered =>
    {
        answered = answered.split(",");
        answered.pop();

        getTrivia(answered);

        // questions = questions.filter
        //     (value => !answered.includes(value.number));
        // triviaNumber = getRandomIndex(questions);
            
        // if(questions.length <= 0)
        //     return message.reply
        //         ("sorry, but you have already answered all the trivias.");

        // askTrivia();
    },
    () =>
    {
        getTrivia();
        // askTrivia();
    });

    function askTrivia(trivia)
    {
        // var trivia = questions[triviaNumber];
        var choices = trivia.choices;
        var choicesText = "```css\n";
        for(i in choices)
        {
            if(!choices) continue;
            choicesText += "[" + (parseInt(i) + 1) + "]" 
                + " " + choices[i] + "\n";
        }
        choicesText += "```";
    
        var embed = new Discord.RichEmbed()
            .setColor(data.color)
            .setTitle(`📝 Trivia #${trivia.id}`)
            .addField(trivia.question, choicesText);
    
        message.channel.send(message.author, embed);
    
        var answer = choices.indexOf(trivia.answer) + 1;
        waitAnswer(message)
        .then((reply) =>
        {
            var answered = reply.content == answer.toString();
            var response = new Discord.RichEmbed()
                .setColor(data.color);

            if(answered)
                response.addField("✅ Correct!",
                    `You get **${rewards.trivia} TWICECOINS**.`);
            else response.setTitle("❌ Wrong!");

            // var response = message.author + "\n";
            // response += answered?
            //     ":white_check_mark: Correct! You get __**" + 
            //         rewards.trivia + "**__ **TWICE**COINS." :
            //     ":x: Wrong!";

            if(answered)
            {
                database.addTrivia(message.author.id, trivia.id)
                coins.earnEmbed(message, rewards.trivia, response);
                return;
            }

            message.channel.send(message.author, response);
        });
    }
}

exports.triviaAdd = (message) =>
{
    var parameters = message.content.split(" ").splice(2);
    if(!parameters) return;

    var trivia = "";
    for(parameter of parameters)
        trivia += parameter + " ";

    var author = message.member;
    var embed = new Discord.RichEmbed()
        .setColor(data.color)
        .setAuthor(author.displayName, author.user.displayAvatarURL)
        .setDescription(trivia);

    message.guild.members.get("247955535620472844").send(embed);
    message.guild.members.get("319491955438518274").send(embed);

    embed = new Discord.RichEmbed()
        .setColor(data.color)
        .setTitle(":white_check_mark: Trivia submitted for verification.");
    message.channel.send(author.user, embed);
    message.delete();
}

//#endregion

//#region Era
exports.era = (message) =>
{
    if(!testers.includes(message.author.id))
        return message.reply("under dev");

    message.channel.startTyping();

    request("http://api.kpoplul.com:82/twice/get-eraimage", 
    (error, response, json) =>
    {
        message.channel.stopTyping();

        if(error) 
        {
            message.channel.send("Can't get an image. Please try again.");
            return console.log(error);
        }
        if(response.statusCode != 200)
        {
            message.channel.send("Can't get an image. Please try again.");
            return console.log("a problem occured");
        } 

        json = JSON.parse(json);
        console.log(json);

        var image = json.ProxyUrl;
        var embed = new Discord.RichEmbed()
            .setColor(data.color)
            .setTitle("What era is this from?")
            .setImage(image);
            // .setFooter("If the image doesn't show, do ;era again.");

        message.channel.send(message.author, embed);

        waitAnswer(message)
        .then(reply =>
        {
            var answer = simplify(json.era);
            var answered = simplify(reply.content) == answer;
            var response = new Discord.RichEmbed()
                .setColor(data.color);

            if(answered)
                response.addField("✅ Correct!",
                    `You get **${rewards.era} TWICECOINS**.`);
            else
            {
                response
                    .setTitle("❌ Wrong!")
                    .setFooter("If your answer is wrong " + 
                        "but you think it's correct, please inform " +
                        "@esfox or @chloe ASAP. Thanks!");
            }

            // var response = message.author + "\n";
            // response += answered?
            //     ":white_check_mark: Correct. You get __**" + 
            //     rewards.era + "**__ **TWICE**COINS." :
            //     ":x: Wrong!";

            // if(!answered)
            // {
            //     response += "\n`If your answer is wrong " + 
            //         "but you think it's correct, please inform " + 
            //         "@esfox#2053 or @chloe#0666 ASAP. Thanks!`" 
            //     message.channel.send(response);
            //     return;
            // }
            
            if(answered)        
                coins.earnEmbed(message, rewards.era, response);
            else message.channel.send(message.author, response);
        });

        function simplify(text)
        {
            return text
                .toLowerCase()
                .replace(/\s/g, "")
                .replace(/\?|\!|\.|\-/g, "");
        }
    });

    // var items = eraPics;
    // var index = getRandomIndex(items);
    // var item = items[index];
}   

const eras =
[
    "Like Ooh Ahh",
    "Cheer Up",
    "TT",
    "Knock Knock",
    "Signal",
    "Likey",
    "Heart Shaker",
    "What Is Love",
    "Dance the Night Away",
    "BDZ",
    "Yes or Yes"
]

exports.eras = (message) =>
{
    var erasText = "";
    for(e of eras)
        erasText += "• " + e + "\n";
        
    var embed = new Discord.RichEmbed()
        .setColor(data.color)
        .setDescription(erasText);

    message.channel.send(embed);
}

//#endregion

//#region Wheel of Twice
exports.wheel = (message, bot) =>
{
    if(onCooldown(message, commands.wheel)) return;

    var chat = message.content;
    var parameters = chat.substr(chat.indexOf(" ") + 1);
    var member = members.find(m =>
        m.name.toLowerCase() == parameters.toLowerCase() ||
        m.code == parameters.toLowerCase());
    if(!member) return message.reply("you did not type a member.");
    
    var rngMember = members[getRandomIndex(members)];
    // var rngMember = members[0];

    var wheelEmote = bot.emojis.find(e => e.name == "WheelSpin");

    var choseString = `You chose **${member.name}**.\n`;
    var embed = new Discord.RichEmbed()
        .setColor(data.color)
        .setTitle("Wheel of TWICE")
        .setDescription(`${choseString}\nSpinning... ` + 
            wheelEmote.toString())
        // .setImage(rngMember.wheelgif);   

    message.channel.send(message.author, embed)
    .then(m =>
    {
        setTimeout(() =>
        {
            var description = `${choseString}` + 
                `The wheel stopped at **${rngMember.name}**!\n\n`;
        
            var isWin = member.code == rngMember.code;
            description += isWin? 
                `YOU WIN __**${rewards.wheel}**__ **TWICE**COINS! 🎉` : 
                "You lose. ❌";
            embed.setDescription(description);
            m.edit(message.author, embed)
            .then(() =>
            {
                if(isWin) coins.earn(message, rewards.wheel);
            });
        }, 4000);
    });
}
//#endregion

function getRandomIndex(array)
{
    return Math.floor(Math.random() * array.length);
}

function generateCode(exceptions)
{
    var number = "";
    for(var i = 0; i < 3; i++)
    {
        var digit = ~~(Math.random() * 10);
        number += digit; 
    }

    if(exceptions.includes(number)) 
        number = generateCode(exceptions);

    return number;
}

// exports.eraAdd = (message) =>
// {
//     var era = message.content.match
//         (/(?<=\[)(.*?)(?=\])|(?<=\()(.*?)(?=\))/g);

//     if(!era) return;
//     if(era == "") return;
//     if(era.length > 1) return;

//     era = era[0].toLowerCase();

//     var erasText = "";
//     var eraValid = false;
//     for(e of eras)
//     {
//         erasText += "• " + e + "\n";
//         if(era == e.toLowerCase())
//             eraValid = true;
//     }

//     if(!eraValid)
//     {
//         var response = new Discord.RichEmbed()
//             .setColor(data.color)
//             .setTitle("Sorry, only the following era names are allowed:")
//             .setDescription(erasText);

//         return message.channel.send(message.author, response);
//     }

//     var image,
//         isNotFromDiscord = false;

//     if(message.attachments.size > 0)
//     {
//         var attachment = (message.attachments).array()[0];
//         if(!attachment) return;
//         if(!attachment.width) return;
//         image = attachment.url;
//     }
//     else
//     {
//         var links = message.content
//             .match(/(\bhttps?:\/\/\S+)|(\bhttp?:\/\/\S+)/g);
//         if(!links)
//             return;

//         image = links[0];

//         if(!image) return;

//         if(!image.includes(".discordapp."))
//             isNotFromDiscord = true;
        
//         if(image.includes("gfycat.com"))
//         {
//             // image = image.replace("gfycat.com", "thumbs.gfycat.com");
//             // image += "-size_restricted.gif";
//             return message.reply("sorry, can't submit gfycats " + 
//                 "for now because of some issues.");
//         }

//         if(!image.match(/.jpg|.jpeg|.png|.gif$/))
//             return message.reply("that link is not an image.");
//     }

//     var usedCodes = [];
//     for(e of pending.era)
//         usedCodes.push(e.code);
//     var code = generateCode(usedCodes);

//     if(isNotFromDiscord)
//         submit();
//     else
//     {
//         message.reply("please wait...")
//         .then(m =>
//         {
//             imgur.uploadUrl(image)
//             .then(json =>
//             {
//                 image = json.data.link;
//                 m.delete();
//                 submit();
//             })
//             .catch(error =>
//             {
//                 m.delete();
//                 message.delete();
//                 message.channel.send(error.message.message);
//             });
//         });
//     }

//     function submit()
//     {
//         var entry = 
//         {
//             image : image, 
//             era : era,
//             code : code,
//             submitter : message.author.id
//         };

//         pending.era.push(entry);

//         var json = JSON.stringify(pending, null, "\t");
//         fs.writeFile("pending.json", json, "utf8", 
//         error =>
//         {
//             if(error) throw error;

//             var embed = new Discord.RichEmbed()
//                 .setColor(data.color)   
//                 .setTitle(":white_check_mark: Submitted for verification.")
//                 .setDescription("You will be notified when your " +
//                     "submission has been verified.");

//             message.delete();
//             message.channel.send(message.author, embed);

//             embed = new Discord.RichEmbed()
//                 .setColor(data.color)
//                 .setTitle("New Entry Submitted")
//                 .setDescription("**" + entry.era + "**")
//                 .addField("Verification Code:", "**`" + entry.code + "`**")
//                 .setImage(entry.image)
//                 .setFooter("Submitted by: " + message.member.displayName);
        
//             message.guild.channels.get("503988943931441172").send(embed);
//         });
//     }
// }

// const verifiers =
// [
//     "247955535620472844", //esfox
//     "200132493335199746", //chloe
//     "198205443045064705", //ken
//     "274336998771130368", //tif
//     "250301876275380224", //Fleander
//     "492893896745943081", //alii
//     "228129551245508608", //Crow
//     "136597149595992064", //slava
//     "254968895314722817", //Yarrick 
//     "127394355391496192"  //Mr Mimbo
// ];

// const verificationChannel = "503988943931441172";

// exports.eraVerify = (message, accepted) =>
// {
//     if(message.channel.id != verificationChannel)
//         return;

//     if(!verifiers.includes(message.author.id))
//         return message.reply("you don't have permission to verify.");

//     var parameters = message.content.split(" ").splice(1);
//     var code = parameters[0];
//     if(isNaN(code))
//         return;
    
//     var entry = pending.era.filter(data => data.code == code)[0];
//     if(!entry)
//         return message.channel.send(message.author + "\n" +
//             "There's no submission with code `" + code + "`.");

//     var submitter = message.guild.members.get(entry.submitter);

//     var description = "‍**" + entry.era + "**"
//     if(!accepted)
//     {
//         if(parameters.length < 2)
//             return message.reply("please include a reason for the rejection.");
        
//         description = "Reason: **";
//         var words = parameters.splice(1);
//         for(word of words)
//             description += word + " ";
//         description += "**";
//     }

//     //TODO: Replace Check and X images

//     var title = "Submission has been ";
//     title += accepted? "verified" : "rejected";
//     var icon = accepted?
//         data.checkImage :
//         data.wrongImage;

//     var embed = new Discord.RichEmbed()
//         .setColor(data.color)
//         .setAuthor(title, icon)
//         .setDescription(description)
//         .setThumbnail(entry.image)
//         .setFooter("Submitted by: " + submitter.displayName);

//     for(i in pending.era)
//     {
//         if(pending.era[i].code == code)
//             pending.era.splice(i, 1);
//     }

//     var json = JSON.stringify(pending, null, "\t");
//     fs.writeFile("pending.json", json, "utf8", 
//     error =>
//     {
//         if(error) throw error;
//         entry =
//         {
//             image : entry.image,
//             era : entry.era
//         };
    
//         eraPics.push(entry);
//         json = JSON.stringify(data, null, "\t");

//         if(!accepted)
//         {
//             var rejectEmbed = new Discord.RichEmbed()
//                 .setColor(data.color)
//                 .setAuthor("Sorry. Your submission was not accepted. 😔")
//                 .setThumbnail(entry.image)
//                 .setDescription(description)
//                 .setFooter("From: " + message.member.displayName);   
            
//             message.channel.send(embed);
//             submitter.user.send(rejectEmbed);
//             return;
//         }

//         fs.writeFile("eraPics.json", json, "utf8", 
//         error =>
//         {
//             if(error) throw error;
//             message.channel.send(embed);

//             embed.setAuthor("Your submission has been accepted!",
//                 "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/160/twitter/53/white-heavy-check-mark_2705.png")
//                 .setFooter("Verified by: " + message.member.displayName);
//             submitter.user.send(embed);
//         });
//     });
// }

// exports.eraVerifyAll = (message) =>
// {
//     if(message.channel.id != verificationChannel)
//         return;

//     if(!verifiers.includes(message.author.id))
//         return message.reply("you don't have permission to verify.");
        
//     var count = pending.era.length;
//     if(count == 0)
//         return message.channel.send("There are no pending submissions.");
        
//     for(era of pending.era)
//     {
//         var embed = new Discord.RichEmbed()
//             .setColor(data.color)
//             .setAuthor("Your submission has been accepted!",
//                 "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/160/twitter/53/white-heavy-check-mark_2705.png")
//             .setDescription("**" + era.era + "**")
//             .setThumbnail(era.image)
//             .setFooter("Verified by: " + message.member.displayName);

//         message.guild.members.get(era.submitter).send(embed);

//         era = 
//         {
//             image : era.image,
//             era : era.era
//         };
        
//         eraPics.push(era);
//     }

//     var json = JSON.stringify(data, null, "\t");
//     fs.writeFile("eraPics.json", json, "utf8", 
//     error =>
//     {
//         if(error) throw error;
//         pending.era = [];
//         json = JSON.stringify(pending, null, "\t");
//         fs.writeFile("pending.json", json, "utf8",
//         error =>
//         {
//             if(error) throw error;
//             message.channel.send(":white_check_mark: " + 
//                 "**" + count + " submissions** verified.");
//         });
//     });
// }

// exports.pending = (message) =>
// {
//     var entries = pending.era;

//     if(entries.length <= 0)
//         return message.channel.send("There are no pending submissions.");

//     message.channel.send("Sending pending submissions...");

//     var count = 0;

//     for(entry of entries)
//     {
//         var embed = new Discord.RichEmbed()
//             .setColor(data.color)
//             .setTitle(entry.era)
//             .setDescription("Verification code:\n" + 
//                 "`" + entry.code + "`")
//             .setThumbnail(entry.image);

//         message.channel.send(embed)
//         .then(m =>
//         {
//             count++;
//             if(count == entries.length)
//                 m.channel.send("**" + count + "** total pending submissions.");
//         });
//     }
// }