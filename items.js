/* Before finalizing
- remove command exceptions
- remove cooldown exceptions
- increase cooldown to 60 seconds
- balance rng's and costs
*/

const Discord = require("discord.js");

const data = require("./data.json");
const json = require("./items.json");
const database = require("./database");

const coins = require("./coins");

const items = json.items;
const members = json.members;
const collections = json.collections;

var cooldowns = {};
const cooldown = 10000;
const capacity = 100;

var trades = [];

function onCooldown(message)
{
    var user = message.author.id;
    if(cooldowns[user]) 
    {
        if(cooldowns[user] != 0)
        {
            var wait = (cooldown - (Date.now() - cooldowns[user])) / 1000;
            if(wait > 0.9)
                wait = Math.round(wait);

            var waitText = `Please wait **${wait}`;
            if(wait == 1)
                waitText += " second**."
            else waitText += " seconds**."

            var embed = new Discord.RichEmbed()
                .setColor(data.color)
                .addField("❄ On cooldown!", waitText);
                // .setTitle(title)
            message.channel.send(message.author, embed);
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

exports.search = (message) =>
{
    if
    (
        message.author.id != "247955535620472844" &&
        message.author.id != "200132493335199746" &&
        message.author.id != "274336998771130368"
    )
    {
        if(onCooldown(message))
            return;
    }

    var rng = Math.random() * 100;
    var tier;

    if(rng < items.legendary.limit)
        tier = items.legendary;
    else if(rng < items.rare.limit)
        tier = items.rare;
    else if(rng < items.amazing.limit)
        tier = items.amazing;
    else if(rng < items.good.limit)
        tier = items.good;
    else
        tier = items.nice;

    var list = tier.list;   
    var index = Math.floor(Math.random() * list.length);
    var item = list[index];
    var code = item.code;

    var embed = new Discord.RichEmbed()
        .setColor(data.color)
        .setTitle("🔎 You found...");

    if
    (
        tier == items.nice ||
        tier == items.amazing
    )
    {
        var member = members[Math.floor
            (Math.random() * members.length)];

        if(item.item == "Photocard")
            embed.setThumbnail(member.photocard);
        if(item.item == "Poster")
            embed.setThumbnail(member.poster);

        item = member.name + " " + item.item + 
            "! " + item.image;
        code = member.code + "-" + code;
    }

    if(item.item == "Album")
    {
        var index = [Math.floor(Math.random() * Object.keys(data.albums).length)];
        var album = Object.values(data.albums)[index];
        embed.setThumbnail(album.cover);
        
        item = album.title + " " + item.item + "! " + item.image;
        code = album.code + "-" + code;
    }

    if(item.item == "Plushie")
    {
        var member = members[Math.floor
            (Math.random() * members.length)]
        item = member.name + " " + 
            member.animal + " " + item.item +
            "! " + member.emote;
        code = member.code + "-" + code;
    }

    if(tier == items.rare)
    {
        embed.setThumbnail(item.image);
        item = item.item + "! ⭐";
    }

    if(tier == items.legendary)
    {
        embed.setThumbnail(item.image);
        item = "✨ " + item.item; 
        item = item + "! <a:JEONGGERING:491407042049736704>";
    }

    embed.addField("**" + item + "**", "It's " + tier.text + "!");

    var user = message.author.id;

    if(!message.member.roles.find(role => role.id == "511484288953352192") &&
        message.author.id != "200132493335199746" && 
        message.author.id != "247955535620472844" &&
        message.author.id != "202288155599175680" &&
        message.author.id != "499435825503797248" &&
        message.author.id != "274336998771130368")
        return message.reply("this command is only accessible to those that have the `testers` role because the bot is still under development.");
     
    embed.setFooter("Item code: " + code);

    database.getItems(user)
    .then(bag =>
    {
        bag = JSON.parse(bag);

        var count = 0;
        for(key in bag)
            count += bag[key];

        if(count >= capacity)
            return message.reply("your OnceBag is full!");

        if(bag[code])
            bag[code] = parseInt(bag[code]) + 1;
        else bag[code] = 1;

        database.updateItems(user, JSON.stringify(bag));

        message.channel.send(message.author, embed)
        .then(() => 
        {
            checkCollection(message, bag);
        });
    },
    () =>
    {
        var bag = {};
        bag[code] = 1;
        database.addItems(user, JSON.stringify(bag));
        message.channel.send(message.author, embed);
    });
}

exports.bag = (message, isOnMobile) =>
{
    if(!message.member.roles.find(role => role.id == "511484288953352192") &&
        message.author.id != "200132493335199746" && 
        message.author.id != "247955535620472844" &&
        message.author.id != "202288155599175680" &&
        message.author.id != "274336998771130368")
        return message.channel.send("**SOON**:tm:");

    var user = message.author.id;

    database.getItems(user)
    .then(bag =>
    {
        bag = parseItems(JSON.parse(bag));
        
        if(bag.length == 0)
            return message.reply("your OnceBag is empty.");

        if(!bag) return message.reply("an error occured. 😦");

        var chunks = [];

        for(var i = 0, j = bag.length; i < j; i += 20)
            chunks.push(bag.slice(i, i + 20));
        
        var count = 0,
            total = 0;

        message.reply("check your DM's. 👌");

        for(var i = 0; i < chunks.length; i++)
        {
            var table = "";
            for(item of chunks[i])
            {
                var cost = (item.amount * item.cost);
                total += cost;
                count += item.amount;

                if(!isOnMobile)
                {
                    table += formatString(item.item, 30) +
                        formatString(item.amount.toString(), 5) +
                        formatString(item.value, 12) + cost + "\n";
                }
                else
                {
                    table += `${item.item} (${item.value.toLowerCase()})\n` + 
                        `x${item.amount} = ${item.cost}\n\n`;
                }
            }

            var text = "";
            var separator = new Array(53).join("—");

            if(i == 0)
            {
                text = "🎒 **OnceBag Contents**\n";

                if(!isOnMobile)
                    table = formatString("       Item", 27) + 
                        formatString("Amount", 8) +
                        formatString("Value", 12) +
                        "Cost\n" + separator + "\n" + table;
            }   

            text += "```ml\n";

            if(i == chunks.length - 1)
            {
                if(!isOnMobile)
                {
                    table += separator + "\n" + 
                        formatString(new Array(22).join(" ") + "Total", 30) + 
                        formatString(count.toString(), 17) + total.toLocaleString();
                }
                else
                {
                    table += "———————————————————————" +
                        `\nTotal (${count} items) = ${total}`;
                }
            }

            text += table + "\n```";

            message.author.send(text);
        }
    },
    () =>
    {
        message.reply("your OnceBag is empty.");
    });

    function formatString(string, length)
    {
        var spaces = length - string.length;
        string += new Array(spaces + 1).join(" ");
        return string;
    }
}

//TODO: fix "you sold for 0 coins"
exports.sell = (message) =>
{
    var parameter = message.content
        .slice(6).toLowerCase();
    var amount = parameter.split("=");
    if(amount.length > 1)
    {
        parameter = amount[0].trim();
        amount = amount[1].trim();
    }

    var toSellAll = false;
    var toSellByValue = false;

    if
    (
        parameter == "all" ||
        parameter == "a"
    )   
        toSellAll = true;

    for(key in items)
    {
        if(parameter == key)
            toSellByValue = true;
    }

    var user = message.author.id;
    database.getItems(user)
    .then(bag =>
    {
        bag = parseItems(JSON.parse(bag));

        if(toSellAll || toSellByValue)
        {
            var bagObject = {};
            var earn = 0;
            for(content of bag)
            {
                var price = content.amount * content.cost;
                if(toSellByValue)
                {
                    if(content.value.toLowerCase() == parameter)
                        earn += price;
                    else bagObject[content.code] = content.amount;
                }
                else earn += price;
            }

            if(toSellByValue)
                return save(bagObject, earn);
            return save({}, earn);
        }

        var item = getItemFromName(parameter);
        if(!item) return message.reply("can't find that item.");
        if(!bag.some(i => i.code == item.code))
            return message.reply("you don't have that item.");

        var bagObject = {};
        var earn = 0;
        for(content of bag)
        {
            if(item.code == content.code)
            {
                if(!amount || isNaN(amount))
                    amount = 1;
                    
                if(amount > content.amount)
                    amount = content.amount;
                
                var count = content.amount - amount;

                if(count != 0)
                    bagObject[content.code] = count;

                earn = parseInt(item.cost) * amount;
            }
            else bagObject[content.code] = content.amount;
        }

        save(bagObject, earn);

        function save(bag, earn)
        {
            database.updateItems(user, JSON.stringify(bag))
            .then(() =>
            {
                var embed = new Discord.RichEmbed() 
                    .setColor(data.color);
                    
                var amountText = "";

                if(amount && amount > 1)
                    amountText = amount + " ";

                var earnText = "For __**" + earn + "**__ **TWICE**COINS";

                if(toSellAll)
                {
                    embed.addField("💰 You sold all items", 
                        earnText);
                        
                    return send();
                }   

                if(toSellByValue)
                {
                    parameter = parameter.charAt(0).toUpperCase() + 
                        parameter.slice(1);
                    embed.addField("💰 You sold all **" + parameter + "** items", 
                        earnText);
                    return send();
                }
                
                embed.addField("💰 You sold " + amountText + 
                    "**" + item.name + "**", 
                    earnText);

                send();

                function send()
                {
                    coins.earnEmbed(message, earn, embed);
                    checkCollection(message, bag);
                }
            });
        }
    },
    () =>
    {
        message.reply("your OnceBag is empty.");
    });
}

//TODO
exports.trade = (message) =>
{
    var parameters = message.content.slice(6);
    var mention = message.mentions.members.first();
    var user = message.member;

    if(!mention) return;
    if(mention.id == user.id) return message.reply("nice meme.");

    var itemName = parameters.replace(mention.toString(), "")
        .trim().toLowerCase();
    var item = getItemFromName(itemName);

    if(!item) return message.reply("can't find that item.");

    database.getItems(message.author.id)
    .then(bag =>
    {
        bag = JSON.parse(bag);

        if(!parseItems(bag).some(i => i.code == item.code))
            return message.reply("you don't have that item.");
    
        if(trades.some(t => t.from.id == user.id))
            return message.reply("you have a trade in progress.");

        if(trades.some(t => t.to.id == mention.id))
            return message.reply("someone is trading to that person. " + 
                "\nPlease wait before they finish.");

        var trade = trades.find(t => t.to.id == user.id);
        if(trade)
        {
            delete bag[item.code];

            if(bag[trade.item.code])
                bag[trade.item.code] = parseInt(bag[trade.item.code]) + 1;
            else bag[trade.item.code] = 1;

            console.log(bag);

            database.getItems(mention.id)
            .then(fromBag =>
            {
                fromBag = JSON.parse(fromBag);
                
                delete fromBag[trade.item.code];

                if(fromBag[item.code])
                    fromBag[item.code] = parseInt(fromBag[item.code]) + 1;
                else fromBag[item.code] = 1;

                console.log(fromBag);
                    
                message.channel.send("Still in dev so nothing is saved yet.\n" +
                trade.from.toString() + " gives **" + trade.item.name + "** to " + trade.to.toString() + ".\n" +
                trade.to.toString() + " gives **" + item.name + "** to " + trade.from.toString() + ".");

                trades = trades.filter(t => t.to.id != user.id);
                console.log(trades);
            });
            return;
        }
            
        trades.push
        ({
            from: user,
            item: item,
            to: mention
        });
        message.channel.send("Waiting for the response of " + mention.toString() + "...");

        console.log(trades);
    },
    () =>
    {
        return message.reply("your OnceBag is empty.");
    });
}

exports.collections = (message) =>
{
    var collectionsInfo = 
    [
        {
            title: "Sweet Collection",
            bonus: "50",
            description: "All 9 candies and jellies, 1 of each member.",
        },
        {
            title: "Plushie Collection",
            bonus: "400",
            description: "All 9 plushies, 1 of each member.",
        },
        {
            title: "Album Collection",
            bonus: "500",
            description: "All the 10 Korea release albums.",
        },
        {
            title: "Member Collection",
            bonus: "500",
            description: "The plushie, photocard, poster and the rare item of a member. (9 collections, 1 for each member)",
        },
        {
            title: "TWICE Collection",
            bonus: "1,500",
            description: "All the 9 member photocards and posters.",
        },
        {
            title: "Cheer Up Collection",
            bonus: "3,000",
            description: "Page Two Album and Cheer Up Jacket.",
        },
        {
            title: "Yes or Yes Collection",
            bonus: "3,000",
            description: "Yes or Yes Album and Yes or Yes Dice.",
        },
        {
            title: "Member Special Collection",
            bonus: "4,000",
            description: "The photocard, rare item and legendary item of a member. (Only for Nayeon, Jeongyeon, Momo, Jihyo and Chaeyoung).",
        },
        {
            title: "JYP Collection",
            bonus: "10,000",
            description: "What Is Love? Album, Signal Album, JYP Plastic Pants and JYP's MIDI Keyboard."
        },
    ];

    var description = "";
    collectionsInfo.forEach(element =>
    {
        description += `**${element.title}** - **${element.bonus}**\n` +
            `-${element.description}\n\n`;
    });

    var embed = new Discord.RichEmbed()
        .setColor(data.color)
        .setTitle("🛍 Collections 🛍")
        .setDescription(description);
    message.channel.send(embed);
}

function checkCollection(message, bag)
{
    if(!bag) return;

    var user = message.author.id;

    database.getCollections(user)
    .then(completedCollections =>
    {
        if(!completedCollections)
            completedCollections = [];
        else completedCollections = JSON.parse(completedCollections);

        var reward = 0;
        var collected = [];
        var completed = false;
            
        bag = Object.keys(bag);

        for(key in collections)
        {
            completed = collections[key].items.every(item => 
                bag.indexOf(item) >= 0 );
                
            if(completedCollections.includes(key))
            {
                if(collections[key].items.every(item =>
                    bag.indexOf(item) < 0))
                    completedCollections = completedCollections.filter(item =>
                        item != key);
                continue;
            }

            if(completed)
            {
                collected.push(key);
                completedCollections.push(key);
                reward += collections[key].bonus;
            }
        }

        database.updateCollections(user, JSON.stringify(completedCollections))
        .then(() =>
        {
            if(reward <= 0)
                return;

            var embed = new Discord.RichEmbed()
                .setColor(data.color)
                .setTitle("🎊 CONGRATULATIONS! 🎊");
                // .setThumbnail(collection.picture)

            var title = "You have completed the **" + collected[0] + 
                " Collection**!";
            var description = "You earn a bonus of __**" + reward.toLocaleString() + 
                "**__ **TWICE**COINS! 💰";

            var count = collected.length;
            if(count > 1)
            {
                description = "";

                title = "You have completed **" + count + " collections**!";
                for(collection of collected)
                    description += "• " + collection + "\n";

                description += "\nYou earn a bonus of __**" + reward.toLocaleString() + 
                    "**__ **TWICE**COINS! 💰";
            }

            title += " <a:JEONGGERING:491407042049736704> ";
            embed.addField(title, description);

            coins.earnEmbed(message, reward, embed);
        });
    },
    () =>
    {
        return;
    });
}

function parseItems(bag)
{
    var contents = [];
    for(key in bag)
    {
        var item = getItemFromCode(key);
        if(!item) return;
        contents.push
        ({ 
            code: item.code,
            item: item.name, 
            amount: bag[key],
            value: item.value,
            cost: item.cost
        });
    }

    contents.sort((a, b) =>
    (a.cost > b.cost)? 1 : 
    (b.cost > a.cost)? -1 : 0);

    return contents;
}

function getItemFromCode(code)
{
    code = code.split("-");

    var item;
    var name = "";

    if(code.length > 1)
    {
        item = getFromItems(code[1]);

        if(!item) return;

        for(member of members)
        {
            if(member.code == code[0])
            {
                if(item.name != items.good.list[0].item)
                {
                    if(item.name == items.good.list[1].item)
                        name += member.name + " " + 
                            member.animal + " " +
                            item.name;
                    else name += member.name + " " + item.name;
                }
                break;
            }
        }

        for(album of Object.values(data.albums))
        {
            if(album.code == code[0])
            {
                name = album.title + " " + item.name;
                break;
            }
        }
    }
    else
    {
        item = getFromItems(code[0]);
        if(item) name += item.name;
    }

    if(item && name != "")
    {
        item = 
        {
            code: code.join("-"),
            name: name,
            value: item.value,
            cost: item.cost
        };

        return item;
    }
    else return null; 

    function getFromItems(code)
    {
        for(item of Object.values(items))
        {
            for(i of item.list)
            {
                if(i.code == code)
                {
                    var value = item.name;
                    value = value.charAt(0).toUpperCase() +
                        value.slice(1);
                    if(item.name == items.legendary.name)
                        value = item.name.toUpperCase();
    
                    var object = 
                    {
                        name: i.item,
                        value: value,
                        cost: item.cost
                    };
                    return object;
                }
            }
        }
    }
}

function getItemFromName(name)
{
    var itemObject = getItemFromCode(name);
    if(getItemFromCode(name))
        return itemObject;

    name = name.split(" ");
    var code;

    for(item of Object.values(items))
    {
        for(i of item.list)
        {
            if(i.item.toLowerCase() == name.join(" "))
                code = i.code;
        }
    }

    for(member of members)
    {
        if(member.name.toLowerCase() == name[0])
        {
            code = member.code + "-";

            if(name[1])
            {
                var lists = [ items.nice.list, items.good.list, items.amazing.list ];
                for(list of lists)
                {
                    for(e of list)
                    {
                        var compare = name[1];
                        if(e.item == items.good.list[1].item)
                            compare = name[2];
                     
                        if(e.item.toLowerCase() == compare)
                            code += e.code; 
                    }
                }
            }
        }
    }

    var lastWord = name[name.length - 1];
    
    if(lastWord == items.good.list[0].item.toLowerCase())    
    {
        var album = name.join(" ")
            .replace("?", "")
            .replace(":", "")
            .replace(lastWord, "").trim();

        for(a of Object.values(data.albums))
        {
            if(a.title.toLowerCase()
                .replace("?", "")
                .replace(":", "") == album)
                code = a.code + "-" + items.good.list[0].code;
        }
    }

    if(code)
        return getItemFromCode(code);
    else return null;
}