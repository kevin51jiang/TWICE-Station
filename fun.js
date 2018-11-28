//#region responses
var rng =
[
    "i love you :hearts:",
    "i hope you're being productive",
    "get back on that Kud grind!",
    "try not to get banned, okay?",
    "watch out, mods are watching",
    "you're my bias"
]

var greeting =
[
    "hi",
    "hello",
    "OwO",
    "annyeonghaseyo",
    "annyeong",
    "sup",
    "hey there",
    "henlo"
]

var mentioned =
[
    "oof hi",
    "what do you want",
    "how may I be of service?",
    "‍sup",
    "wot",
    "yes?",
    "ping reee"
]

var thanks =
[
    "you're welcome uwu"
]

var trivia =
{
    correct :
    [
        "noice good job",
        "even I knew that",
        "you guessed, didn't you?",
        "that's actually the answer?",
        "you're pretty smart",
        "extend that winstreak"
    ],

    wrong :
    [
        "hahayes",
        "that makes no sense!",
        "that must be a mistake",
        "you'll get it next time :wink:",
        "you really didn't know?",
        "trivia isn't fun anyway"
    ]
}
//#endregion

exports.interaction = (message) =>
{    
    var chat = message.content.toLowerCase();
    var response;
    var reply;

    if((Math.random() * 100) + 1 <= 5)
        reply = rng[RNG(rng)]; 
        
    if((Math.random() * 100) + 1 <= 1)
        response = "hi guys OwO";

    // if(chat.includes("daily"))
    //     response = "i wish my daily feature is already functional :pensive:";

    if
    (
        chat == "ty" ||
        chat.includes(" ty ") ||
        chat.includes("thx") ||
        chat.includes("thank you") ||
        chat.includes("thanks") ||
        chat.includes("thank u") ||
        chat.includes("thnx")
    )
        response = thanks[RNG(thanks)];

    if
    (
        chat == "hello" ||
        chat == "hi" ||
        chat == "henlo" ||  
        chat.includes("hello ") ||
        chat.includes("hi ") ||
        chat.includes("henlo ")
    )
        response = greeting[RNG(greeting)];

    if(chat.includes("reee"))
        response = "​***REEEEEEEEEEEEEEEEEEEEEEEEEEEEE***";

    if(chat.includes("<@!496529668850057227>"))
        response = mentioned[RNG(mentioned)];

    if(chat == ";marry")
        reply = "OOF :hearts::hearts::hearts:";

    if(response)
        message.channel.send(response);

    if(reply)
        message.reply(reply);

    // if(chat == ">>t")
    //     message.reply("psst, the correct answer is " +
    //     (Math.floor(Math.random() * 4) + 1) + " :wink:");
    // if(chat == ">>forage")
    //     message.reply("y r u collecting trash lol");
    // if(chat == ">>fish")
    //     message.reply("get a fishing pole hahayes");
    // if(chat == ">>hunt")
    //     message.reply("u need a rifle bro kek");
}

exports.ligmaInteraction = (message) =>
{
    var response;

    if(message.author.id == "216437513709944832")
    {
        var embeds = message.embeds;
        if(embeds.length > 0)
        {
            var embed = embeds[0];
            var title = embed.title;
            if(title)
            {
                if(title.includes("Ooh, sorry"))
                    response = trivia.wrong[RNG(trivia.correct)]
                if(title.includes("Correct,"))
                    response = trivia.correct[RNG(trivia.wrong)];
            }

            var author = embed.author;
            if(author)
            {
                if(author.name.includes("Currency Data"))
                    reponse = "wow rich poggers";
            }
        }
    }

    if(response)
       message.channel.send(response);
}

function RNG(array)
{
    return Math.floor(Math.random() * array.length);
}