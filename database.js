const sql = require ("sqlite");

const tables = 
{
    coins: "coins",
    daily: "daily",
    lottery: "lottery",
    trivia: "trivia",
    follows: 'follows',
    items: "items",
    candybongs: "candybongs",
    rpg: "rpg"
};

exports.init = () =>
{
    return new Promise
    (success =>
    {
        sql.open("./database.sqlite").then(() =>
        {
            createTables()
            .then(() => success());
        });
    });
}

function createTables()
{
    return new Promise
    (success =>
    {
        sql.run
        (
            `CREATE TABLE IF NOT EXISTS ${tables.coins}` + 
            "(" + 
                "id TEXT, " + 
                "username TEXT, " + 
                "coins INTEGER" +
            ")"
        );
        sql.run
        (
            `CREATE TABLE IF NOT EXISTS ${tables.daily}` + 
            "(" + 
                "id TEXT, " + 
                "time TEXT" +
            ")"
        );
        sql.run
        (
            `CREATE TABLE IF NOT EXISTS ${tables.lottery}` + 
            "(" + 
                "id TEXT, " + 
                "time TEXT" +
            ")"
        );
        sql.run
        (
            `CREATE TABLE IF NOT EXISTS ${tables.trivia}` + 
            "(" + 
                "id TEXT, " + 
                "answered TEXT" +
            ")"
        );
        sql.run
        (
            `CREATE TABLE IF NOT EXISTS ${tables.follows}` +
            '(' +
                'id TEXT, ' +
                'follows TEXT' +
            ')'
        );
        sql.run
        (
            `CREATE TABLE IF NOT EXISTS ${tables.items}` +
            "(" +
                "id TEXT, " +
                "inventory TEXT, " +
                "collections TEXT" +
            ")"
        );
        sql.run
        (
            `CREATE TABLE IF NOT EXISTS ${tables.candybongs}` +
            "(" +
                "id TEXT, " + 
                "count INTEGER" +
            ")"
        );
        sql.run
        (
            `CREATE TABLE IF NOT EXISTS ${tables.rpg}` +
            "(" +
                "id TEXT, " + 
                "hp INTEGER, " +
                "max_hp INTEGER, " + 
                "cpw INTEGER, " + 
                "jmg INTEGER, " + 
                "def INTEGER, " + 
                "res INTEGER" + 
            ")"
        )
        .then(() => success());
    });
}

exports.reset = (tableName) =>
{
    return new Promise
    (success =>
    {
        sql.run("DROP TABLE " + tableName)
            .then(() =>
            {
                createTables()
                .then(() => 
                {
                    module.exports.init()
                    .then(() => success());
                });
            });
    });
}

exports.remove = (user) =>
{
    sql.run(`DELETE FROM ${tables.coins} WHERE id = ${user}`);
    sql.run(`DELETE FROM ${tables.daily} WHERE id = ${user}`);
    sql.run(`DELETE FROM ${tables.trivia} WHERE id = ${user}`);
    sql.run(`DELETE FROM ${tables.items} WHERE id = ${user}`);
    sql.run(`DELETE FROM ${tables.candybongs} WHERE id = ${user}`);
    sql.run(`DELETE FROM ${tables.rpg} WHERE id = ${user}`);

    console.log(`User with ID ${user} has been deleted from the database.`);
}

//#region Follows

exports.getFollowers = (channel) =>
{
    return new Promise
    ((success, fail) =>
    {
        sql.all(`SELECT id FROM ${tables.follows}
            WHERE follows LIKE '%${channel}%'`)
            .then(results => success(results))
            .catch(error => fail());
    });
}

exports.getFollows = (id) =>
{
    return new Promise
    ((success, fail) =>
    {
        sql.get(`SELECT follows FROM ${tables.follows}
            WHERE id = ${id}`)
            .then(row => success(row.follows))
            .catch(_ => fail());
    });
}

exports.addFollows = (id, follows) =>
{
    return new Promise
    (success =>
    {
        sql.run(`INSERT INTO ${tables.follows}
            (id, follows)
            VALUES (${id},'${follows}') `)
            .then(_ => success())
            .catch(error => console.log(error));
    });
}

exports.updateFollows = (id, follows) =>
{
    return new Promise
    (success =>
    {
        sql.run(`UPDATE ${tables.follows}
            SET follows = '${follows}'
            WHERE id = ${id}`)
            .then(_ => success())
            .catch(error => console.log(error));
    });
}

//#endregion

//#region coins
 
exports.addCoins = (id, username) =>
{
    return new Promise
    (success =>
    {
        sql.run("INSERT INTO coins " + 
            "(id, username, coins) "
            + "VALUES (?, ?, ?)", 
            [id, username, 0])
            .then(() => success());
    });
}

exports.updateCoins = (amount, user) =>
{
    return new Promise
    (success =>
    {
        sql.run("UPDATE coins SET coins = " + amount + 
        " WHERE id = " + user)
            .then(() => success())
            .catch(console.error);
    });
}

exports.getCoins = (user) =>
{
    return new Promise
    ((success, fail) =>
    {
        sql.get("SELECT coins FROM coins WHERE id = " + user)
            .then(row => success(row.coins))
            .catch(() => fail());
    });
}

exports.getAllCoins = () =>
{
    return new Promise
    (success =>
    {
        sql.all("SELECT * FROM coins")
        .then(table => success(table));
    }).catch(console.error)
}

//#endregion

//#region daily & lottery

exports.getDaily = (id) =>
{
    return new Promise
    ((success, fail) =>
    {
        sql.get("SELECT time FROM daily WHERE id = " + id)
            .then(row => success(row.time))
            .catch(() => fail());
    });
}

exports.addDaily = (id, time) =>
{
    return new Promise
    (success =>
    {
        sql.run("INSERT INTO daily " + 
        "(id, time) "
        + "VALUES (?, ?)", 
        [id, time]).then    
        (() => success());
    });
}

exports.setDaily = (id, time) =>
{
    return new Promise
    (success =>
    {
        sql.run("UPDATE daily SET time = '"     
            + time + "' WHERE id = " + id)
            .then(() => success());
    });
}

exports.getLottery = (id) =>
{
    return new Promise
    ((success, fail) =>
    {
        sql.get("SELECT lottery FROM lottery WHERE id = " + id)
            .then(row => success(row.lottery))
            .catch(() => fail());
    });
}

exports.addLottery = (id, time) =>
{
    return new Promise
    (success =>
    {
        sql.run("INSERT INTO lottery " + 
        "(id, time) "
        + "VALUES (?, ?)", 
        [id, time]).then    
        (() => success());
    });
}

exports.setLottery = (id, time) =>
{
    return new Promise
    (success =>
    {
        sql.run("UPDATE lottery SET time = '"     
            + time + "' WHERE id = " + id)
            .then(() => success());
    });
}

//#endregion

//#region items

exports.getItems = (id) =>
{
    return new Promise
    ((success, fail) =>
    {
        sql.get("SELECT inventory FROM items WHERE id = " + id)
        .then(row => success(row.inventory))
        .catch(() => fail());
    });
}

exports.addItems = (id, inventory) =>
{
    return new Promise
    (success =>
    {
        sql.run("INSERT INTO items " + 
            "(id, inventory) " + 
            "VALUES (?, ?)",
            [id, inventory])
            .then(() => success())
            .catch(console.error);
    });

}
exports.updateItems = (id, inventory) =>
{
    return new Promise
    (success =>
    {
        sql.run("UPDATE items SET inventory = '" + 
            inventory + "' WHERE id = " + id)
            .then(() => success())
            .catch(console.error);
    });
}

exports.getCollections = (id) =>
{
    return new Promise
    ((success, fail) =>
    {
        sql.get("SELECT collections FROM items " + 
            "WHERE id = " + id)
            .then(row => success(row.collections))
            .catch(error =>
            {
                console.error(error);
                fail();
            });
    });
}

exports.updateCollections = (id, collections) =>
{
    return new Promise
    (success =>
    {
        sql.run("UPDATE items SET collections = '" + 
            collections + "' WHERE id = " + id)
            .then(() => success())
            .catch(console.error);
    });
}

//#endregion

//#region candybongs

exports.getCandyBongs = (id) =>
{
    return new Promise
    ((success, fail) =>
    {
        sql.get("SELECT count FROM candybongs WHERE id = " + id)
            .then(row =>
            {
                success(row.count);
            })
            .catch(() => fail());
    });
}

exports.getAllCandyBongs = () =>
{
    return new Promise
    (success =>
    {
        sql.all("SELECT * FROM candybongs")
        .then(table => success(table));
    }).catch(console.error)
}

exports.updateCandyBongs = (id, count) =>
{
    return new Promise
    (success =>
    {
        sql.run("UPDATE candybongs SET count = " + count +
            " WHERE id = " + id)
            .then(() => success())
            .catch(console.error);
    });
}

exports.addCandyBongUser = (id) =>
{
    return new Promise
    (success =>
    {
        sql.run("INSERT INTO candybongs " + 
            "(id, count) " + 
            "VALUES (?, ?)",
            [id, 1])
            .then(() => success())
            .catch(console.error);
    });
}

//#endregion

//#region trivia

exports.addTrivia = (id, trivia) =>
{
    return new Promise
    (success =>
    {
        sql.get("SELECT answered FROM trivia WHERE id = " + id)
        .then(row =>
        {
            trivia = row.answered + trivia + ",";
        
            sql.run("UPDATE trivia SET answered = '" +
                trivia + "' WHERE id = " + id)
                .then(() => success());
        })
        .catch(() =>
        {   
            sql.run("INSERT INTO trivia " +
                "(id, answered) " +
                "VALUES (?, ?)",
                [id, (trivia + ",")])
                .then(() => success());
        });
    });
}

exports.getTrivias = (id) =>
{
    return new Promise
    ((success, fail) =>
    {   
        sql.get("SELECT answered FROM trivia WHERE id = " + id)
        .then(row => success(row.answered))
        .catch(() => fail());
    });
}

//#endregion

//#region RPG

exports.addRPGUser = (id) =>
{
    return new Promise
    (success =>
    {
        sql.run("INSERT INTO rpg " +
            "(id, hp, max_hp, cpw, jmg, def, res) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            [id, 100, 100, 10, 10, 10, 10])
            .then(() => success());
    });
}

exports.getRPGStats = (id) =>
{
    return new Promise
    ((success, fail) =>
    {
        sql.get("SELECT * FROM rpg WHERE id = " + id)
        .then(row =>
        {
            if(row) success(row);
            else fail();
        })
        .catch(() => fail());
    });
}

exports.getRPGStat = (id, stat) =>
{
    return new Promise
    ((success, fail) =>
    {
        sql.get("SELECT " + stat + " AS value FROM rpg "
            + "WHERE id = " + id)
        .then(row =>
        {
            success(row.value);
        })
        .catch(() =>
        {
            fail();
        });
    })
}

exports.updateRPGStat = (id, stat, value) =>
{
    return new Promise
    (success =>
    {
        sql.run("UPDATE rpg SET " + 
        stat + " = " + value + " WHERE id = " + id)
        .then(() => success())
        .catch(console.error);
    });
}

exports.resetRPGStats = (id) =>
{
    return new Promise
    (success =>
    {
        sql.run("UPDATE rpg SET " +
            "hp = 100, " + 
            "max_hp = 100, " + 
            "cpw = 10, " +
            "jmg = 10, " +
            "def = 10, " +
            "res = 10 " +
            "WHERE id = " + id)
        .then(() => success());  
    });
}

//#endregion

//Testing
exports.query = (query) =>
{
    query = query.toLowerCase();
    return new Promise
    ((success, fail) =>
    {
        if(query.includes("select"))
        {
            sql.all(query)
            .then(result => success(JSON.stringify(result, null, "  ")))
            .catch(() => fail());
            return;
        }

        sql.run(query)
        .then(() => success())
        .catch(() => fail());
    });
}