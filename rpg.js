/* 

TODO: 
- Skills

*/

const Discord = require("discord.js");
const database = require("./database");
const data = require("./data.json");

const stats = 
{
    cpw : "cpw",
    jmg : "jmg",
    def : "def",
    res : "res"
};

const attackMode =
{
    attack: "attack",
    cast: "cast"
};

const items =
{
    potion:
    {
        names:
        [
            "potion",
            "pot",
            "op"
        ],
        cost: 400,
        bonus: 10
    },
    booster:
    {
        names: 
        [
            "booster",
            "bst",
            "ob"
        ],
        cost: 800,
        bonus: 20
    }   
};

const cooldown = 60000;
const attackCost = 250;
const statCost = 100;
const statCostIncrease = 50;

const cooldowns =
{
    attack: {},
    cast: {}
};

exports.command = (message) =>
{
    if(message.channel.id == "481255884941557778")
        return message.reply("this feature is still **under testing!**" + 
            "\nIf you wanna be a tester, just DM or mention <@247955535620472844>.");

    var parameters = message.content
        .substr(message.content.indexOf(" ") + 1);
    parameters = parameters.split(" ");

    if(parameters == null)
        return;

    var command = parameters[0];
    parameters.splice(0, 1);

    switch(command)
    {
        case "join":
        case "j":
            join(message);
            break;

        case "stats":
        case "s":
            checkStats(message);
            break;

        case "get":
        case "g":
            getStat(message, parameters);
            break;

        case "attack":
        case "a":
            attack(message);
            break;

        case "cast":
        case "c":
            cast(message);
            break;

        case "buy":
        case "b":
            buy(message, parameters);
            break;

        case "help":
        case "h":
            help(message, false);
            break;
            
        case "test":
        case "t":   
            test(message);
            break;
    }
}

function test(message)
{
    // message.channel.send("Choose one")
    // .then(msg =>
    // {
    //     msg.react("👌");
    //     msg.react("👎");

    //     const filter = (reaction, user) =>
    //     {
    //         return ['👌', '👎'].includes(reaction.emoji.name) 
    //             && user.id == message.author.id;
    //     };
    //     msg.awaitReactions(filter, { max: 1 })
    //     .then(collected =>
    //     {
    //         var reaction = collected.first().emoji.name;
    //         if(reaction == "👌")
    //             message.reply("ok");
    //         else
    //             message.reply("naw");
    //     });
    // });

    // if(onCooldown(message))
    //     return;

    // message.channel.send("Started cooldown.");
    // help(message);
}

function join(message)
{
    //Testing (joining alt acc)
    if(message.content == ";g j alt")
    {
        return database.addRPGUser("499435825503797248")
        .then(() =>
        {
            message.channel.send("Test account has been joined.");
        });
    }

    var user = message.author.id;
    database.getRPGStats(user)
    .then(() =>
    {
        message.reply("you already joined.");
    },
    () =>
    {
        database.addRPGUser(message.author.id)
        .then(() =>
        {
            help(message, true);
        });
    })
}

function help(message, isNew)
{
    var embed = new Discord.RichEmbed()
        .setColor(data.color)
        .addField("Stats",
            "🍬 **Candy Power** (Code: **`CPW`**) - __physical__ attack damage\n" +
            "🍓 **Jelly Magic** (Code: **`JMG`**) - __magical__ attack damage\n" + 
            "🛡 **Defense** (Code: **`DEF`**) - defense against __physical__ damage\n" +
            "✊ **Resistance** (Code: **`RES`**) - defense against __magical__ damage")
        .addField("Items",
            "**Once Potion** (Code: **`pot`**) - restores 10 HP (Costs **400 coins**)\n" +
            "**Once Booster** (Code: **`bst`**) - increases max HP by 20 (Costs **800 coins**)\n")
        .addField("Commands",
            "`;g stats` = check your stats\n" +
            "`;g stats @user` = check a user's stats\n" + 
            "`;g get (stat code) (amount)` = buy stats with **TWICE**COINS\n" + 
            "`;g attack @user` = perform a __physical__ attack to a user\n" + 
            "`;g cast @user` = perform a __magical__ attack to a user\n" + 
            "`;g buy (item code)` = buy and use an item\n" + 
            "`;g buy (item code) @user` = buy a user an item")
        .addField("‍",
            "• Attacking or casting costs __**" + attackCost + "**__ **TWICE**COINS.\n" +
            "• A stat point costs __**100**__ **TWICE**COINS.\n" +
            "• The cost of buying a stat increases by **50 for every point**.\n" +
            "• To know more on how to buy stats, type `-rpgstats`.\n" +
            "• When you **kill** a user, you earn **half** of their **TWICE**COINS.\n" + 
            "• When you **die**, all your **stats reset** (not including your **TWICE**COINS).\n");

    if(isNew)
        embed.setTitle("⚔ WELCOME TO TWICE MEMES RPG ⚔");

    message.channel.send(message.author, embed);
}

function checkStats(message)
{  
    var member = message.mentions.members.first();
    var hasMention = true;

    if(!member)
    {
        member = message.member;
        hasMention = false;
    }

    database.getRPGStats(member.id)
    .then(stats =>
    {
        var text = 
            "```ml\n" +
            "HP:  " + stats.hp + "/" + stats.max_hp + "\n\n" +
            "CPW: " + stats.cpw + "\n" +
            "JMG: " + stats.jmg + "\n" +
            "DEF: " + stats.def + "\n" +
            "RES: " + stats.res + "\n" +
            "```";

        var embed = new Discord.RichEmbed()
            .setColor(data.color)
            .setDescription(text)
            .setFooter("To get stats, type -rpgstats");

        if(hasMention)
        {
            embed.setAuthor(member.displayName + " stats", member.user.displayAvatarURL);
            return message.channel.send(embed);
        }

        message.channel.send(message.author, embed);
    },
    () =>
    {
        if(hasMention)
            return message.reply("that user has not yet joined the game.");
        else return message.reply("you don't have stats yet!");
    });
}

function getStat(message, parameters)
{
    var stat = parameters[0],
        amount = parseInt(parameters[1]),
        user = message.author.id;

    //Testing (adding stats to alt)
    if(message.content.match("alt"))    
        user = "499435825503797248";

    if(!stat) return;
    if(!amount) return;
    if(isNaN(amount)) return;

    if(!Object.keys(stats).includes(stat.toLowerCase()))
        return message.reply("that's not a stat...");

    if(amount <= 0)
        return message.reply(":thinking:");

    if(amount > 100)
        return message.reply("up to **100** only please.");

    database.getCoins(user)
    .then(coins =>
    {
        database.getRPGStat(user, stat)
        .then(value =>
        {
            if(!value)
                return;

            var current = value - 10;

            var initial = statCost * amount,
                increase = 0,
                total = 0;

            for(var i = current; i < current + amount; i++)
            {
                var cost = statCost + (statCostIncrease * i);
                increase += statCostIncrease * i;
                total += cost;
            }

            var statEmote = "🍬";
            switch(stat)
            {
                case stats.cpw:
                    statEmote = "🍬";
                    break;

                case stats.jmg:
                    statEmote = "🍓";
                    break;

                case stats.def:
                    statEmote = "🛡";
                    break;

                case stats.res:
                    statEmote = "✊";
                    break;
            }
            stat = stat.toUpperCase();

            var embed = new Discord.RichEmbed()
                .setColor(data.color)
                .setTitle("⚖ Acquire Stats")
                .setDescription("• A stat point costs **100**.\n" +
                    "• Every point, the stat cost increases by **50**.")
                .addField(statEmote + " Current **" + stat + "**", 
                    "```cpp\n" + value + "\n```", true)
                .addField("💰 Current **TWICE**COINS",
                    "```cpp\n" + coins.toLocaleString() + "\n```", true)

                var description = "```prolog\n" +
                    `Initial Cost:  ${initial.toLocaleString()}\n` +
                    `Cost Increase: ${increase.toLocaleString()}\n` +
                    "``````ml\n" +
                    `Total Cost:    ${total.toLocaleString()}` +
                    "```";

            if(coins < total)
            {
                description += "\n**Not enough TWICECOINS!**";
                embed.addField("‍🏷 Cost", description);
                message.channel.send(message.author, embed)
                // .then(msg =>
                // {
                //     message.delete(20000);
                //     msg.delete(20000);
                // });
            }
            else 
            {
                coins -= total;
                value += amount;
                description += "\n**Confirm?** React 👌 or 👎.";
                embed.addField("‍🏷 Cost", description);
                stat = stat.toLowerCase();

                var summary;
                message.channel.send(message.author, embed).then(msg => summary = msg)
                .then(msg =>
                {
                    msg.react("👌")
                    .then(() => msg.react("👎"));

                    const filter = (reaction, user) =>
                    {
                        return ['👌', '👎'].includes(reaction.emoji.name) 
                            && user.id == message.author.id;
                    };
                    msg.awaitReactions(filter,
                    {
                        max: 1,
                        time: 60000,
                        errors: ['time']
                    })
                    .then(collected =>
                    {
                        var reaction = collected.first().emoji.name;
                        if(reaction == "👌")
                        {
                            database.updateRPGStat(user, stat, value);
                            database.updateCoins(coins, user);
                            
                            var embed = new Discord.RichEmbed()
                                .setColor(data.color) 
                                .setAuthor("You now have...", data.checkImage)
                                .addField(statEmote + " " + stat.toUpperCase(), 
                                    "```cpp\n" + value + "```", true)
                                .addField("💰 **TWICE**COINS", 
                                    "```cpp\n" + coins + "```", true);
                                    
                            message.reply(embed);
                        }
                        else
                        {
                            message.reply("you cancelled. :ok_hand:")
                            // .then(m =>
                            // {
                            //     m.delete(3000);
                            //     message.delete(3000);
                            // });
                        }

                        summary.delete();
                    })
                    .catch(() =>
                    {
                        summary.delete();
                        message.reply("you didn't react.");
                    });
                });
            }
        },
        () =>
        {
            message.reply("that user has not yet joined the game.");
        });
    },
    () =>
    {
        message.reply("you don't have **TWICE**COINS yet!")
    });
}

function onCooldown(message, isAttack)
{
    var user = message.author.id;
    var cooldownsObject = isAttack?
        cooldowns.attack : cooldowns.cast;

    if(cooldownsObject[user]) 
    {
        if(cooldownsObject[user] != 0)
        {
            var wait = (cooldown - (Date.now() - cooldownsObject[user])) / 1000;
            if(wait > 0.9)
                wait = Math.round(wait);

            var title = "❄ On cooldown! Please wait **" + wait;
            if(wait == 1)
                title += " second**."
            else title += " seconds**."

            var embed = new Discord.RichEmbed()
                .setColor(data.color)
                .setTitle(title)
            message.channel.send(message.author, embed);
            return true;
        }
    } 
     
    cooldownsObject[user] = Date.now();
    setTimeout(() =>    
    {
        cooldownsObject[user] = 0;
    }, cooldown);

    return false;
}

function attack(message)
{
    attack(message, attackMode.attack);
}

function cast(message)
{
    attack(message, attackMode.cast);
}

function attack(message, mode)
{
    var attacker = message.member;

    var target = message.mentions.members.first();
    if(!target)
        return message.reply("so... who are you attacking?");

    if(target.id == message.author.id)
        return message.reply("hahayes.");

    database.getRPGStats(attacker.id)
    .then(attackerStats => 
    {
        var attackerStat = attackerStats.cpw;
        if(mode == attackMode.cast)
            attackerStat = attackerStats.jmg;

        database.getRPGStats(target.id)
        .then(targetStats =>
        {
            var defenderStat = targetStats.def;
            
            var attackerStatText = "CPW",
                defenderStatText = "DEF";

            if(mode == attackMode.cast)
            {
                defenderStat = targetStats.res;

                attackerStatText = "JMG";
                defenderStatText = "RES";
            }

            var attackerHP = attackerStats.hp,
                targetHP = targetStats.hp,
                attackerName = attacker.displayName,
                targetName = target.displayName;

            database.getCoins(attacker.id)
            .then(coins =>
            {
                var attackerNewCoins = coins - attackCost;
                var response;
            
                if(coins < attackCost)
                    return message.reply("you don't have enough **TWICE**COINS to attack!");

                if(onCooldown(message, mode != attackMode.cast)) return;

                var attackEmote = "⚔ ";
                var defendEmote = "🛡 ";
                if(mode == attackMode.cast)
                {
                    attackEmote = "✨ ";
                    defendEmote = "✊ ";
                    attackType = "magical";
                }
                    
                response = new Discord.RichEmbed()
                    .setColor(data.color)
                 
                database.updateCoins(attackerNewCoins, attacker.id);

                if(attackerStat > defenderStat)
                {
                    var damage = attackerStat - defenderStat;
                    targetHP = targetHP - damage;
    
                    if(targetHP < 0)
                        targetHP = 0;
    
                    database.updateRPGStat(target.id, "hp", targetHP)
                    .then(() =>
                    {
                        response.addField(attackEmote + "**" + targetName + "** received __" +
                            damage + " damage__!", "HP left: **" + targetHP + "**");
                            
                        if(targetHP <= 0)
                            kill(message, attacker, target, attackerNewCoins, response);
                        else message.channel.send(message.author + 
                                "\nYour **TWICE**COINS left: __**" + 
                                attackerNewCoins + "**__", 
                                response);
                    });
                }
                else if(attackerStat < defenderStat)
                {
                    var damage = defenderStat - attackerStat;   
                    attackerHP = attackerHP - damage;
    
                    if(attackerHP < 0)
                        attackerHP = 0;
    
                    database.updateRPGStat(attacker.id, "hp", attackerHP)
                    .then(() =>
                    {
                        response.addField(defendEmote + "**" + targetName +
                            "** has more **" + defenderStatText + "**.", 
                            "**" + attackerName + "**" + " received __**" + 
                            damage + " damage**__!\n" +
                            "HP left: **" + attackerHP + "**");

                        if(attackerHP <= 0)
                        {
                            database.getCoins(target.id)
                            .then(targetCoins => kill(message, target, attacker, targetCoins, response),
                            () => kill(message, target, attacker, 0, response));
                        }
                        else message.channel.send(message.author + 
                                "\nYour **TWICE**COINS left: __**" + 
                                attackerNewCoins + "**__", 
                                response)
                    });
                }
                else
                {
                    response.addField("⚖ Your **" + attackerStatText + "** and the **" +
                        defenderStatText + "** of " + targetName + " are equal.",
                        "You did not inflict any damage.")

                    message.channel.send(message.author + 
                        "\nYour **TWICE**COINS left: __**" + 
                        attackerNewCoins + "**__", 
                        response)
                }
            },
            () =>
            {
                message.reply("you don't have **TWICE**COINS yet!");
            });
        },
        () =>
        {
            message.reply("that user has not yet joined the game.");
        });
    },
    () =>
    {
        message.reply("you don't have stats yet!");
    });

    function kill(message, killer, killed, killerCoins, response)
    {
        database.getCoins(killed.id)
        .then(killedCoins =>
        {
            killUpdate(killedCoins);
        }, 
        () =>
        {
            killUpdate(0);
        });

        function killUpdate(killedCoins)
        {
            var coinsEarned = Math.floor(killedCoins / 2);
            var totalCoins = killerCoins + coinsEarned;
    
            database.updateCoins(totalCoins, killer.id)
            .then(() =>
            {
                response.addField("**" + killer.displayName + "** HAS KILLED **" +
                    killed.displayName + "**!", 
                    "They earn __**" + coinsEarned + "**__ **TWICE**COINS!");
    
                database.resetRPGStats(killed.id)
                .then(() =>
                {
                    message.channel.send(response);
                });
            });

        }
    }
}

function buy(message, parameters)
{
    var item = parameters[0];

    var hasItem = false;
    for(var key in items)
    {
        var object = items[key];
        if(object.names.includes(item))
        {
            hasItem = true;
            item = key;
            cost = object.cost;
        }
    }

    if(!hasItem)
        return message.reply("we don't have that item.");

    var usedPotion = item == items.potion.names[0];
    item = usedPotion? items.potion : items.booster;

    var cost = item.cost,
        bonus = item.bonus,
        toHeal = usedPotion,
        
        user = message.author.id;

    database.getCoins(user)
    .then(coins =>
    {
        if(cost > coins)
            return message.reply("not enough **TWICE**COINS.");
        
        coins = coins - cost;
        updateHP(message, bonus, toHeal, coins);
    },
    () =>
    {
        message.reply("you don't have **TWICE**COINS yet!");
    });
}

function updateHP(message, increase, toHeal, coins)
{
    var target = message.mentions.members.first();
    if(!target)
        target = message.member;

    var id = target.id;

    database.getRPGStat(id, "max_hp")
    .then(maxHP =>
    {
        if(!toHeal)
        {
            maxHP += increase;
            database.updateRPGStat(id, "max_hp", maxHP)
            .then(() =>
            {
                updateHP(message, increase, true, coins);
            });
            return;
        }

        database.getRPGStat(id, "hp")
        .then(hp =>
        {
            var isAuthor = message.author.id == id;

            if(hp == maxHP)
            {
                var reply = isAuthor?
                    "you already have full HP." :
                    "they already have full HP.";

                return message.reply(reply);
            }

            hp += increase;

            if(hp >= maxHP)
                hp = maxHP;

            database.updateRPGStat(id, "hp", hp)
            .then(() =>
            {
                database.updateCoins(coins, message.author.id)
                .then(() =>
                {
                    var embed = new Discord.RichEmbed()
                        .setColor(data.color)
                        .addField("♥ HP", 
                            "```cpp\n" +
                            hp + "/" + maxHP + "\n" +
                            "```", true);

                    if(isAuthor)
                    {
                        embed.setTitle("You now have...")
                            .addField("💰 **TWICE**COINS",
                                "```cpp\n" + 
                                coins.toLocaleString() + "\n" +
                                "```", true);
                    }
                    else embed.setAuthor(target.displayName + 
                            " now has...", target.user.displayAvatarURL);
    
                    if(isAuthor)
                        message.channel.send(message.author, embed);
                    else
                        message.channel.send(message.author + "\n" +
                            "Your **TWICE**COINS left: __**" + 
                            coins.toLocaleString() + "**__\n",
                            embed);
                });
            });
        });
    },
    () => 
    {
        message.reply("that user has not yet joined the game.");
    })
}