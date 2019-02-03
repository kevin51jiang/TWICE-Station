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
const cooldown = 25000;
const capacity = 100;

var trades = [];
const tradeTime = 30000;

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
    setTimeout(_ =>    
    {
        delete cooldowns[user];
    }, cooldown);

    return false;
}

exports.get = (message, parameter) =>
{
    var item = items.legendary.list;
    item = item.find(i => i.code == parameter);
    if(!item) return;
    
    var embed = new Discord.RichEmbed()
        .setColor(data.color)
        .setTitle("🔎 You found...")
        .setThumbnail(item.image)
        .addField(`**${item.item}**`, "‍");

    message.channel.send(embed);
}

exports.search = (message) =>
{
    // if
    // (
    //     message.author.id != "247955535620472844" &&
    //     message.author.id != "200132493335199746" &&
    //     message.author.id != "274336998771130368"
    // )
    // {
    // }

    if(onCooldown(message))
        return;

    // if(!message.member.roles.find(role => role.id == "511484288953352192") &&
    //     message.author.id != "200132493335199746" && 
    //     message.author.id != "247955535620472844" &&
    //     message.author.id != "202288155599175680" &&
    //     message.author.id != "499435825503797248" &&
    //     message.author.id != "274336998771130368")
    //     return message.reply("this command is only accessible to those that have the `testers` role because the bot is still under development.");

    var rng = Math.random() * 100;
    var tier;
    var foundTrash = false;

    if(rng < items.legendary.limit)
        tier = items.legendary;
    else if(rng < items.rare.limit)
        tier = items.rare;
    else if(rng < items.amazing.limit)
        tier = items.amazing;
    else if(rng < items.good.limit)
        tier = items.good;
    else if(rng < items.nice.limit)
        tier = items.nice;
    else
    {
        foundTrash = true;
        return save();
    } 

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
        var index = Math.floor(Math.random() * Object.keys(data.albums).length);
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
        item = item + "! 😮";
    }

    embed.addField("**" + item + "**", "It's " + tier.text + "!");
    embed.setFooter("Item code: " + code);

    save();

    function save()
    {
        var user = message.author.id;
        database.getItems(user)
        .then(bag =>
        {
            bag = JSON.parse(bag);

            let count = Object.values(bag)
                .reduce((total, item) => total += item);

            if(count >= capacity)
                return message.reply("your OnceBag is full!");
    
            if(foundTrash) return trash();
            
            if(bag[code])
                bag[code] = parseInt(bag[code]) + 1;
            else bag[code] = 1;
    
            database.updateItems(user, JSON.stringify(bag));
    
            message.channel.send(message.author, embed)
            .then(_ => 
            {
                checkCollection(message, bag);
            });
        },
        _ =>
        {
            if(foundTrash) return trash();

            var bag = {};
            bag[code] = 1;
            database.addItems(user, JSON.stringify(bag));
            message.channel.send(message.author, embed);
        });
    }

    function trash()
    {
        var embed = new Discord.RichEmbed()
            .setColor(data.color)
            .setTitle(json.trash[~~(Math.random() * json.trash.length)]);
        message.channel.send(message.author, embed);
    }
}

exports.bag = (message, isOnMobile) =>
{
    // if(!message.member.roles.find(role => role.id == "511484288953352192") &&
    //     message.author.id != "200132493335199746" && 
    //     message.author.id != "247955535620472844" &&
    //     message.author.id != "202288155599175680" &&
    //     message.author.id != "274336998771130368" &&
    //     message.author.id != "499435825503797248")
    //     return message.channel.send("**SOON**:tm:");

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

        message.reply("check your DM. 👌");

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
    _ =>
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

exports.collections = (message) =>
{
    var user = message.author.id;
    database.getCollections(user)
    .then(collections =>
    {
        if(!collections) return errorReply();

        try
        {
            collections = JSON.parse(collections);
            if(collections.length <= 0) return errorReply();

            var embed = new Discord.RichEmbed() 
                .setColor(data.color)
                .addField("✅ Completed Collections",
                    `• ${collections.join("\n• ")}`);
            
            message.channel.send(message.author, embed);
        }
        catch(error) { console.log(error) };
    },
    _ =>
    {
        errorReply();
    });
            
    function errorReply()
    {
        message.reply("you haven't completed any collections yet.");
    }
}

exports.collectionList = (message) =>
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
            bonus: "2500",
            description: "All the 18 albums and EPs. (`;albums` to see all albums)",
        },
        {
            title: "Member Collection",
            bonus: "500",
            description: "The plushie, photocard, poster and the rare " + 
                "item of a member. (9 collections, 1 for each member)",
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
            description: "The photocard, rare item " + 
                "and legendary item of a member.",
        },
        {
            title: "JYP Collection",
            bonus: "10,000",
            description: "What Is Love? Album, Signal Album, " + 
                "JYP Plastic Pants and JYP's MIDI Keyboard."
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

const SellMode = 
{ 
    item: "item", 
    all: "all", 
    value: "value" ,
    duplicates: "duplicates",
    collection: "collection" 
};

exports.sell = (message) =>
{
    var parameter = message.content;
    parameter = parameter
        .substring(parameter.indexOf(" "))
        .toLowerCase()
        .trim();

    var mode = SellMode.item;

    if(parameter == "all")   
        mode = SellMode.all;

    if(Object.keys(items).includes(parameter))
        mode = SellMode.value;
        
    if(parameter.match("^(duplicates|dup)$"))
        mode = SellMode.duplicates;
    
    if(parameter.match("^(collection |col |c ).*"))
        mode = SellMode.collection;

    var user = message.author.id;
    database.getItems(user)
    .then(bag =>
    {
        bag = parseItems(JSON.parse(bag));
        var tempBag = {};
        var earn = 0;

        switch(mode)
        {
            case SellMode.item:
                sellItem();
                break;

            case SellMode.all:
                sellAll();
                break;

            case SellMode.value:
                sellByValue();
                break;

            case SellMode.duplicates:
                sellDuplicates();
                break;

            case SellMode.collection:
                sellByCollection();
                break;
        }

        function sellItem()
        {
            var item = parameter;
            if(parameter.indexOf("=") > -1)
                item = parameter.substring(0, parameter.indexOf("=")).trim();

            var amount = parameter.substring(parameter.indexOf("=") + 1).trim();
            if(amount == parameter) amount = 1;
            if(!amount) amount = 1;

            item = getItemFromName(item);
            if(!item) return message.reply("can't find that item.");

            item = bag.find(i => i.code == item.code);
            if(!item) return message.reply("you don't have that item.");
         
            var count = item.amount;
            if(amount > count) amount = count;

            for(i of bag)
            {
                if(i.code == item.code)
                {
                    count = i.amount - amount;
                    if(count != 0) tempBag[i.code] = count;
                }
                else tempBag[i.code] = i.amount;
            }
            
            earn = parseInt(item.cost) * amount;
            save(item, amount);
        }

        function sellAll()
        {
            bag.forEach(i => earn += i.cost * i.amount);
            if(earn == 0)
                return message.reply("you don't have any items.");
            save();
        }

        function sellByValue()
        {
            bag.forEach(i => 
            {
                if(i.value.toLowerCase() == parameter)
                    earn += i.cost * i.amount;
                else tempBag[i.code] = i.amount;
            });

            if(earn == 0) 
                return message.reply(`you don't have any ${parameter} items.`);
            save();
        }

        function sellDuplicates()
        {
            bag.forEach(i =>
            {
                if(i.amount > 1)
                    earn += i.cost * (i.amount - 1);
                tempBag[i.code] = 1;
            });

            if(earn == 0) 
                return message.reply("you don't have duplicate items.");
            save();
        }

        function sellByCollection()
        {
            var collection = parameter
                .substring(parameter.indexOf(" ") + 1)
                .trim();
                
            if(!Object.keys(collections)
                .some(c => c.toLowerCase() == collection))
                return message.reply("that's not a collection.");

            database.getCollections(user)
            .then(completedCollections =>
            {
                if(!completedCollections) return errorReply();
                try
                {
                    completedCollections = JSON.parse(completedCollections);
                    if(completedCollections.length <= 0) 
                        return errorReply();
                    if(!completedCollections
                        .some(c => c.toLowerCase() == collection))
                        return message.reply("you haven't " + 
                            "completed that collection.");
    
                    var key = Object.keys(collections)
                        .find(c => c.toLowerCase() == collection);
                    collection = collections[key];

                    bag.forEach(i =>
                    {
                        if(collection.items.includes(i.code))
                            earn += i.cost * i.amount;
                        else tempBag[i.code] = i.amount;
                    });

                    save(key);
                }
                catch(error) { errorReply() };
            },
            _ =>
            {
                errorReply();
            });
            
            function errorReply()
            {
                message.reply("you haven't completed any collections yet.");
            }
        }

        function save(item, amount)
        {
            database.updateItems(user, JSON.stringify(tempBag))
            .then(_ =>
            {
                var embed = new Discord.RichEmbed() 
                    .setColor(data.color);
                    
                var soldText = "💰 You sold";
                var earnText = `For __**${earn}**__ **TWICE**COINS`;

                switch(mode)
                {
                    case SellMode.item:
                        if(amount == 1) amount = "";
                        else amount = `${amount} `;
                        embed.addField(`${soldText} ${amount}**${item.item}**`,
                            earnText);
                        break;

                    case SellMode.all:
                        embed.addField(`${soldText} all items`, earnText);
                        break;

                    case SellMode.value:
                        parameter = parameter.charAt(0).toUpperCase() + 
                            parameter.slice(1);
                        embed.addField(`${soldText} all **${parameter}** items`, 
                            earnText);
                        break;
                    case SellMode.duplicates:
                        embed.addField(`${soldText} all duplicate items`, 
                            earnText);
                        break;

                    case SellMode.collection:
                        embed.addField(`${soldText} all the items ` + 
                            `from ${item} collection`, earnText);
                        break;
                }

                send();

                function send()
                {
                    coins.earnEmbed(message, earn, embed);
                    checkCollection(message, tempBag);
                }
            });
        }
    },
    _ =>
    {
        message.reply("your OnceBag is empty.");
    });
}

exports.list = (message) =>
{
    var response = "__**List of All Items**__\n\n";

    for(key in items)
    {
        var value = key.substring(0, 1).toUpperCase() +
            key.substring(1);
        var description = "";
        items[key].list.forEach(i =>
        {
            description += "• " + i.item;
            if
            (
                key == items.nice.name ||
                key == items.amazing.name
            )
                description += " (x9, 1 for each member)";
            if(i.item == "Plushie")
                description += " (x9, 1 for each member)";
            if(i.item == "Album")
                description += " (x11, 1 for each korean release album)";

            description += "\n";
        });

        response += `**${value}**\n\`\`\`ml\n${description}\n\`\`\`\n`;
    }

    message.reply("I sent you the list of items in DM. 👍");
    message.author.send(response);
}

exports.codes = (message) =>
{
    var embed = new Discord.RichEmbed()
        .setColor(data.color)
        .setTitle("🔡 Codes");

    for(var value of Object.values(items))
    {
        var valueName = value.name.charAt(0).toUpperCase()
            + value.name.substr(1);
        var itemList = value.list.map(i => `${i.code} - ${i.item}`);
        embed.addField(valueName + " Items", 
            "```ml\n" + itemList.join("\n") + "```", true);
    }

    var memberCodes = "```ml\n" + 
        members.map(m => `${m.code} - ${m.name}`)
        .join("\n") + "```";
    var albumCodes = "```ml\n" + 
        Object.values(data.albums).map(a => 
            `${a.code} - ${a.title}`)
            .join("\n") + "```";

    embed
        .addField("Members", memberCodes, true)
        .addField("Albums", albumCodes, true)
        .addField("‍", 
            `• For **Nice** and **Amazing** items and **Plushies**, ` + 
            `the code format is: 
            \`(member code)-(item code)\`
            E.g. 
            - \`ch-c\` (Chaeyoung Candy)
            - \`sn-pc\` (Sana Photocard)
            - \`ny-p\` (Nayeon Bunny Plushie)

            • For **Albums**, the code format is: 
            \`(album code)-a\`
            E.g.
            - \`tsb-a\` (The Story Begins Album)
            - \`wil-a\` (What Is Love? Album)`);    

    embed.setFooter("The codes can be used for selling items and " +
        "for the Wheel of TWICE game.");

    message.reply("I sent you the list of codes in DM. 👍");
    message.author.send(embed);
}

exports.chances = (message) =>
{
    var tiers = Object.values(items).map(t => t.limit);
    tiers.sort((a, b) => a - b);
    
    var chances = [];
    var last = 0;
    tiers.forEach(t =>
    {
        chances.push(t - last);
        last = t;
    });
    chances.push(100 - tiers.pop());
    chances.sort((a, b) => b - a);
    tiers = [ "Trash" ].concat(Object.keys(items)
        .map(t => t[0].toUpperCase() + t.substring(1)));
    for(var i = 0; i < chances.length; i++)
        chances[i] = tiers[i] + 
            new Array(10 - tiers[i].length).join(" ") +
            ` = ${chances[i]}%`;

    var line = new Array(5).join("‍ ‍") + "\n";
    var description = "```ml\n" +
        chances.join("\n") + line + 
        "```";

    var embed = new Discord.RichEmbed()
        .setColor(data.color)
        .addField("📊 Item Value Chances", description);

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
                bag.indexOf(item) >= 0);
                
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
        .then(_ =>
        {
            if(reward <= 0)
                return;

            var embed = new Discord.RichEmbed()
                .setColor(data.color)
                .setTitle("🎊 CONGRATULATIONS! 🎊");
                // .setThumbnail(collection.picture)

            var title = "You have completed the **" + collected[0] + 
                " Collection**!";
            var description = "You earn a bonus of __**" + 
                reward.toLocaleString() + 
                "**__ **TWICE**COINS! 💰";

            var count = collected.length;
            if(count > 1)
            {
                description = "";

                title = "You have completed **" + count + " collections**!";
                for(collection of collected)
                    description += "• " + collection + "\n";

                description += "\nYou earn a bonus of __**" + 
                    reward.toLocaleString() + 
                    "**__ **TWICE**COINS! 💰";
            }

            title += " 😮 ";
            embed.addField(title, description);

            coins.earnEmbed(message, reward, embed);
        });
    },
    _ =>
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
                var lists = 
                [ 
                    items.nice.list, 
                    items.good.list, 
                    items.amazing.list 
                ];
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

// exports.trade = (message) =>
// {
//     var parameters = message.content.slice(6);
//     var user = message.member;
//     var mention = message.mentions.members.first();

//     if(!mention) return;
//     if(mention.id == user.id) return message.reply("nice meme.");

//     var itemName = parameters.replace(mention.toString(), "")
//         .trim().toLowerCase();
//     var item = getItemFromName(itemName);

//     if(!item) return message.reply("can't find that item.");

//     database.getItems(message.author.id)
//     .then(bag =>
//     {
//         bag = JSON.parse(bag);

//         if(!parseItems(bag).some(i => i.code == item.code))
//             return message.reply("you don't have that item.");
    
//         if(trades.some(t => t.from == user.id))
//             return message.reply("you have a trade in progress.");

//         if(trades.some(t => t.to == mention.id))
//             return message.reply("someone is trading to that person. " + 
//                 "\nPlease wait before they finish.");

//         var trade = trades.find(t => t.to == user.id);
//         if(!trade)
//         {   
//             trades.push
//             ({
//                 from: user.id,
//                 item: item,
//                 to: mention.id
//             });

//             message.channel.send("Waiting for the response of " + 
//                 `**${mention.displayName}**...`);
//             setTimeout(_ =>
//             {
//                 trades = trades.filter(t => t.from != user.id);
//                 message.reply("the trade has timed out.");
//                 console.log(trades);
//             }, tradeTime);

//             console.log(trades);
//             return;
//         }

//         message.channel.send(`${message.author} ${mention}\n`);
        
//         delete bag[item.code];

//         if(bag[trade.item.code])
//             bag[trade.item.code] = parseInt(bag[trade.item.code]) + 1;
//         else bag[trade.item.code] = 1;

//         console.log(bag);

//         database.getItems(mention.id)
//         .then(fromBag =>
//         {
//             fromBag = JSON.parse(fromBag);
            
//             delete fromBag[trade.item.code];

//             if(fromBag[item.code])
//                 fromBag[item.code] = parseInt(fromBag[item.code]) + 1;
//             else fromBag[item.code] = 1;

//             console.log(fromBag);
//             confirmTrade(trade);
//         });
//     },
//     _ =>
//     {
//         return message.reply("your OnceBag is empty.");
//     });

//     function confirmTrade(trade)
//     {
//         trades = trades.filter(t => t.to != user.id);
//         console.log(trades);

//         var fromUser = message.guild.members.get(trade.from).displayName;
//         var toUser = message.guild.members.get(trade.to).displayName;

//         message.channel.send("Still in dev so nothing is saved yet.\n" +
//         `${fromUser} gives **${trade.item.name}** to ${toUser}\n` +
//         `${toUser} gives **${item.name}** to ${fromUser}.`);
//     }
// }