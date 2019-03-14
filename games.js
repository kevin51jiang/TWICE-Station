const Discord = require('discord.js');
const fs = require("fs");
const request = require("request");
// const imgur = require("imgur");
const cheerio = require('cheerio');
const ffmpeg = require('fluent-ffmpeg');
const { getAudioDurationInSeconds } = require('get-audio-duration')

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
    wheel: "wheel",
    gts: "gts",
    gtl: "gtl",
    gtm: 'gtm'
};

var rewards =
{
    trivia: 25,
    era: 50,
    wheel: 350,
    gts: 150,
    gtl: 300,
    gtm: 250
};

const lotteryRewards = 
[
    {
        chance: 0.3,
        reward: 125000
    },
    {
        chance: 0.5,
        reward: 100000
    },
    {
        chance: 5,
        reward: 2500
    },
    {
        chance: 20,
        reward: 500
    }
];

//TODO: Cooldown is per command.
const cooldown = 60000;
var cooldowns =
{
    wheel: {},
    gts: {},
    gtl: {},
    gtm: {}
};

var testers = 
[
    "247955535620472844",
    "274336998771130368",
    "417726391698718720"
];

var apiOwner = "417726391698718720";
var apiDelay = 300;

function onCooldown(message, command, duration = cooldown)
{
    // if(message.author.id === '247955535620472844')
    //     return false;

    var cd = {};
    switch(command)
    {
        case commands.wheel:
            cd = cooldowns.wheel;
            break;

        case commands.gts:
            cd = cooldowns.gts;
            break;

        case commands.gtl:
            cd = cooldowns.gtl;
            break;

        case commands.gtm:
            cd = cooldowns.gtm;
            break;
    }

    if(cd[message.author.id])
    {
        var timeLeft = Date.now() - cd[message.author.id];
        var timeLeft = (duration - timeLeft) / 1000;
        if(timeLeft > 1) timeLeft = ~~timeLeft;
        var embed = new Discord.RichEmbed()
            .setColor(data.color)
            .setTitle(`❄ On cooldown, please wait ${timeLeft} seconds.`);
        message.channel.send(message.author, embed);
        return true;
    }
    
    cd[message.author.id] = Date.now();
    setTimeout(() =>
    {
        delete cd[message.author.id];
    }, duration);
    return false;
}

function waitAnswer(message, timeUpReply)
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
            // console.log(data.eras.includes('Yes or Yes'));
            // console.log(simplify(reply.content));

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
            {
                if(timeUpReply)
                    return message.channel.send(message.author, timeUpReply);
                message.reply("time's up!");
            }
        });
    });
}

exports.trivia = (message) =>
{
    if(!testers.includes(message.author.id))
        return message.reply("we still need more trivias so " +
            "please submit some. 😔\n");

    // var questions = trivias;
    // var triviaNumber = getRandomIndex(questions);

    function getTrivia(answered)
    {
        message.channel.startTyping();
        request("http://api.kpoplul.com:82/twice/get-trivia",
        (error, response, trivia) =>
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

            trivia = JSON.parse(trivia);

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
                    `You win **${rewards.trivia} TWICECOINS**.`);
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

exports.era = (message) =>
{
    // if(!testers.includes(message.author.id))
    //     return message.reply("under dev");

    return message
        .reply('sorry the API for getting pics is currently broken. :(');

    message.channel.startTyping();

    request("http://api.kpoplul.com:82/twice/get-eraimage", 
    (error, response, json) =>
    {   
        setTimeout(() =>
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
    
            var image = json.ProxyUrl;
            var embed = new Discord.RichEmbed()
                .setColor(data.color)
                .setTitle("What era is this from?")
                .setImage(image)
                .setFooter("React ❗ if the image is questionable.");
                // .setFooter("If the image doesn't show, do ;era again.");
    
            message.channel.send(message.author, embed)
                .then(m =>
                {
                    const filter = (reaction) => 
                    {
                        return ['🌐', '❗'].includes(reaction.emoji.name);
                    };
                    m.awaitReactions(filter,
                    {
                        max: 1,
                        time: 300000
                    }).then(reactions =>
                    {
                        if(find('🌐'))
                        {
                            embed.setFooter(json.imageWEB);
                            m.edit(embed);
                        }
                        if(find('❗'))
                        {
                            var reporter = find('❗').users.first().tag;

                            var report = new Discord.RichEmbed()
                                .setColor(data.color)
                                .setTitle("📢 Image has been reported.")
                                .setThumbnail(encodeURI(json.image))
                                .addField("Proxy URL", json.ProxyUrl)
                                .addField("Image Web", json.imageWEB)
                                .addField("Image", encodeURI(json.image))
                                .addField("Member Name", json.memberName)
                                .addField("Era", json.era)
                                .addField("API Version", json.apiVersion)
                                .setFooter(`Reported by: ${reporter}`);
                                
                            message.guild.members.get('247955535620472844')
                                .send(report);
                        }

                        function find(emote)
                        {
                            return reactions.find(r => r.emoji.name == emote);
                        }
                    });
                });

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
                        .setTitle("❌ Wrong!");
                        // .setFooter("If your answer is wrong " + 
                        //     "but you think it's correct, please inform " +
                        //     "@esfox or @chloe ASAP. Thanks!");
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
        }, apiDelay);
    });

    // var items = eraPics;
    // var index = getRandomIndex(items);
    // var item = items[index];
}   

exports.eras = (message) =>
{
    var erasText = "";
    for(e of data.eras)
        erasText += "• " + e + "\n";
        
    var embed = new Discord.RichEmbed()
        .setColor(data.color)
        .setDescription(erasText);

    message.channel.send(embed);
}

exports.wheel = (message, bot) =>
{
    var chat = message.content;
    var parameters = chat.substr(chat.indexOf(" ") + 1);
    var member = members.find(m =>
        m.name.toLowerCase() == parameters.toLowerCase() ||
        m.code == parameters.toLowerCase());
    if(!member) return message.reply("you did not type a member.");
    if(onCooldown(message, commands.wheel)) return;

    var rngMember = randomElement(members);
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

exports.lyricsGuess = (message) =>
{
    if(onCooldown(message, commands.gtl, 30000))
        return;

    let song;
    getSong();

    function getSong()
    {
        let list = Object.values(data.albums);  
        song = randomElement(randomElement(list).tracks);
        if(song.title.match('Ver.')) getSong();
        if(!song) getSong();
    }

    const title = song.title,
        link = song.lyrics;

    message.channel.startTyping();

    request(link, (error, response, html) =>
    {
        message.channel.stopTyping();
        if(error) return console.error(error);
        if(response.statusCode != 200)
            return message.channel.send('Something went wrong.');

        let $ = cheerio.load(html);
        let lyrics = $('table').last();
        lyrics = $(lyrics).each((_, e) =>
        {
            $ = cheerio.load(e);
            $('td').each((i, e) =>
            {
                if(i === 0)
                {
                    let stanza = cheerio.load(e);
                    let count = stanza('p').length;
                    getStanza();

                    function getStanza()
                    {
                        let index = Math.floor(Math.random() * count);
                        stanza('p').each((n, p) =>
                        {
                            if(n === index)
                            {
                                const text = $(p).text();
                                if(!text || text === '')
                                    return getStanza();
                                if(text.toLowerCase()
                                    .match(title.toLowerCase()))
                                    return getStanza();
                                
                                sendLyrics(text);
                            }
                        }); 
                    }
                }
            });
        });
    });

    async function sendLyrics(lyrics)
    {
        lyrics = lyrics.split('\n').slice(0, 4).join('\n');
        lyrics = await textToImage(lyrics);

        let embed = new Discord.RichEmbed()
            .setColor(data.color)
            .setTitle('❔ Guess the Song! 🎵')
            .setImage(lyrics);

        message.channel.stopTyping();
        message.channel.send(message.author, embed);

        embed = new Discord.RichEmbed()
            .setColor(data.color)
            .setTitle("⏰ Time's up!")
            .setDescription(`It's **${title}**.`);

        waitAnswer(message, embed).then(reply =>
        {
             embed = new Discord.RichEmbed()
                .setColor(data.color);
                
            if(simplify(reply.content) === simplify(title))
            {
                embed.setTitle('✅ Correct!\n'
                    + `You win **${rewards.gtl} TWICECOINS**.`);
                return coins.earnEmbed(message, rewards.gtl, embed);
            }

            return message.channel.send(message.author, 
                embed.setTitle('❌ Wrong!')
                    .setDescription(`It's **${title}**.`));   
        }); 
    }
}

exports.audioGuess = async (message) =>
{
    if(onCooldown(message, commands.gts))
        return;

    let song;
    getSong();

    function getSong()
    {
        let list = Object.values(data.albums);
        song = randomElement(randomElement(list).tracks);
        if(song.title.match('Ver.')) getSong();
        if(!song) getSong();
        if(!song.link || song.link === '') getSong();
    }

    const title = song.title,
        link = song.link;

    let startTime = ~~(await getAudioDurationInSeconds(link));
    startTime = Math.floor(Math.random() * startTime - 5);
    if(startTime <= 0)
        startTime += 5;

    ffmpeg(link)
        .setStartTime(startTime)
        .setDuration(0.75)
        .noVideo()
        .output('Song.mp3')
        .on('end', error =>
        {
            if(error)
                return console.error(error);
            send();
        })
        .on('error', error =>
        {
            console.log(error);
        })
        .run();

    function send()
    {
        message.channel.send(`${message.author}\n❔ Guess the Song! 🎵`,
        {
            files:
            [{
                attachment: './Song.mp3',
                name: 'Song.mp3'
            }]
        })
        .then(_ =>
        {
            try
            {
                fs.unlink('Song.mp3', error => 
                {
                    if(error) console.error(error);
                });
            }
            catch(error)
            {
                console.log(error);
            }
        });

        const embed = new Discord.RichEmbed()
            .setColor(data.color)
            .setTitle("⏰ Time's up!")
            .setDescription(`It's **${title}**.`);

        waitAnswer(message, embed).then(reply =>
        {
            const embed = new Discord.RichEmbed()
                .setColor(data.color);
                
            if(simplify(reply.content) === simplify(title))
            {
                embed.setTitle('✅ Correct!\n' 
                    + `You win **${rewards.gts} TWICECOINS**.`);
                return coins.earnEmbed(message, rewards.gts, embed);
            }

            return message.channel.send(message.author,
            embed.setTitle('❌ Wrong!')
                    .setDescription(`It's **${title}**.`)); 
        });
    }
}

exports.memberGuess = async (message) =>
{
    if(onCooldown(message, commands.gtm))
        return;

    message.channel.startTyping();

    const member = randomElement(members.map(m => 
        ({ 
            name: m.name,
            hangul: m.hangul
        })));

    const getHTML = (link) =>
        new Promise(resolve =>
        {
            request(link, (error, response, html) =>
            {
                if(error || response.statusCode != 200) 
                {
                    console.log(error, 'An error occurred.');
                    return resolve(); 
                }
                
                resolve(html);
            });
        });
    
    let html = await getHTML('https://kprofiles.com/twice-members-profile');
    if(!html) return;

    let $ = cheerio.load(html);
    let info = $(`.entry-content > p:contains("${member.hangul}")`).text();
    let facts = $(`.entry-content > p:contains("${member.name} Facts")`
        + ' a:contains("Show more")').prop('href');

    html = await getHTML(facts);
    if(!html) return;

    $ = cheerio.load(html);
    facts = $(`.entry-content > p:contains("${member.name} facts")`)
        .text();

    info += `\n${facts}`;
    info = info.split('\n')
        .filter(i => 
        {
            i = i.toLowerCase();
            const isValid = 
                i !== '' &&
                i !== member.name.toLowerCase() &&
                !i.match('twice members profile') &&
                !i.match(`${member.name.toLowerCase()} facts`) &&
                !i.match('nationality') &&
                !i.match('stage name') &&
                !i.match('birth name') &&
                !i.match('blood type') &&
                !i.match('zodiac') &&
                !i.match('weight') &&
                !i.match('representative color') &&
                !i.match('show more');
            return isValid;
        })
        .map(i => i.replace(/^– /g, ''));

    info = randomElement(info)
        .replace(new RegExp(member.name, 'g'), 'this member')
        .replace(/Jungyeon/g, 'this member')
        .replace(/Chaeyeong/g, 'this member');

    info = info.charAt(0).toUpperCase() + info.substr(1).trim();
    info = await textToImage(info);
    
    let embed = new Discord.RichEmbed()
        .setColor(data.color)
        .setTitle('👩 Guess the Member!')
        .setImage(info);

    message.channel.stopTyping();
    message.channel.send(message.author, embed);

    embed = new Discord.RichEmbed()
        .setColor(data.color)
        .setTitle("⏰ Time's up!")
        .setFooter('Information from kprofiles.com');

    waitAnswer(message, embed).then(reply =>
    {
        if(simplify(reply.content) === simplify(member.name))
        {
            embed.setTitle('✅ Correct!\n' 
                + `You win **${rewards.gtm} TWICECOINS**.`)
            return coins.earnEmbed(message, rewards.gtm, embed);
        }

        return message.channel.send(message.author,
            embed.setTitle('❌ Wrong!')); 
    });
}

//TODO
exports.lottery = (message) =>
{
    var currentTime = Date.now();
    var user = message.author.id;

    database.getLottery(user)
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
            database.setLottery(user, currentTime.toString())
            .then(() =>
            {
                doLottery();
            }); 
        }
        else
        {
            hours = 24 - Math.ceil(hours);
            seconds %= 60;

            var text = `\n⌛ Please wait ${hours} hours, ` + 
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
        database.addLottery(user, currentTime.toString())
        .then(() => 
        {
            doLottery();
        }); 
    });

    function doLottery()
    {
        database.getCoins(user)
        .then(coins =>
        {
            database.updateCoins(coins - 25, user)
            .then(() =>
            {
             
            });
        },
        () =>
        {
            message.reply("you don't have coins yet.");
        });
    }

    /* 
    - deduct 25 coins
    - show winning
    - save date.now to db
    - apply cooldown
    */
}

const randomElement = (list) => list[Math.floor(Math.random() * list.length)];
const simplify = (text) => text
    .toLowerCase()
    .trim()
    .replace(/\s/g, '')
    .replace(/\?|\!|\.|\(|\)|\.|\?|\!|\-|\'/g, '')
    .replace('&', 'and');
    

const textToImage = (text) =>
    new Promise(resolve =>
    {
        const url = 'http://api.img4me.com/?font=arial'
            + '&fcolor=BFBFC1&size=10&bcolor=33353C&type=png&text='
            + encodeURI(text.replace('&', 'and'));

        request(url, (error, response, link) =>
        {
            if(error || response.statusCode != 200)
            {
                console.error(error);
                return message.channel.send('Something went wrong.');
            }

            resolve(link);
        });
    });

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

//Debugging
exports.setAPIDelay = (message) =>
{
    var parameter = message.content;
    parameter = parameter.substr(parameter.indexOf(" ") + 1);
    if(!parameter) return;
    if(isNaN(parameter)) return;
    apiDelay = parseInt(parameter);
    message.channel.send(`API Delay set to ${parameter}ms`);
}
        
//#region old
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
//  };
        
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
//#endregion