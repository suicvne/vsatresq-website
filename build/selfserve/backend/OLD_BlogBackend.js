"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerAuth = exports.User = exports.UserPower = void 0;
const SQLRequests_1 = require("./SQLRequests");
/*import { callbackify } from "util";*/
const TokenStore_1 = __importDefault(require("./TokenStore"));
var UserPower;
(function (UserPower) {
    UserPower[UserPower["Admin"] = 1] = "Admin";
    UserPower[UserPower["User"] = 2] = "User";
})(UserPower = exports.UserPower || (exports.UserPower = {}));
class User {
    constructor(_id, _username, _password, _signup_date, _email, _power) {
        this.password = undefined;
        this.id = _id;
        this.username = _username;
        this.password = _password;
        this.signup_date = _signup_date;
        this.email = _email;
        this.power = _power;
    }
}
exports.User = User;
class ServerAuth {
    static getUserInformation(res, callback, username, id) {
        let verb = 'username';
        if (id !== undefined) {
            verb = 'id';
        }
        ServerAuth.sql.query(`SELECT * FROM users WHERE ${verb} = ${(verb === 'username') ? `'${username}'` : id};`, (status, err, result) => {
            if (err) {
                console.log(err);
                return;
            }
            const toReturn = new User(result[0].id, result[0].username, undefined, result[0].signup_date, result[0].email, result[0].power);
            /*
            {
                id: result[0].id,
                username: result[0].username,
                signup_date: Date.parse(result[0].signup_date),
                email: result[0].email,
                power: result[0].power,
            };*/
            callback(toReturn);
        });
    }
    static getUserById(id, callback) {
        ServerAuth.sql.query(`SELECT * FROM users WHERE id = ${id};`, (status, err, result) => {
            if (err) {
                console.log(err);
                return;
            }
            const toReturn = new User(result[0].id, result[0].username, undefined, result[0].signup_date, result[0].email, result[0].power);
            callback(toReturn);
        });
    }
    static getUserByName(username, callback) {
        ServerAuth.sql.query(`SELECT * FROM users WHERE username = '${username}';`, (status, err, result) => {
            if (err) {
                console.log(err);
                return;
            }
            const toReturn = {
                id: result[0].id,
                username: result[0].username,
                password: undefined,
                signup_date: new Date(result[0].signup_date),
                email: result[0].email,
                power: result[0].power,
            };
            callback(toReturn);
        });
    }
    static doLogin(res, username, password, callback) {
        ServerAuth.sql.query("SELECT username, password FROM users WHERE username = '" + username + "'", (status, err, result) => {
            if (err) {
                callback(SQLRequests_1.SQLStatus.Error, err);
            }
            if (result) {
                if (result[0].username === username && result[0].password === password) {
                    const newToken = ServerAuth.tokenStore.generateToken(username);
                    res.set('Authorization', newToken.token);
                    res.status(200).send(`Logged in as ${username} successfully.`);
                    callback(SQLRequests_1.SQLStatus.OK);
                }
            }
            else {
                res.status(400).send('User not found/credential mismatch.');
                callback(SQLRequests_1.SQLStatus.Error, err);
            }
        });
    }
    static registerUser(res, username, password, email) {
        if (username.trim() && password.trim() && email.trim()) {
            const sqlQuery = `INSERT INTO \`users\` (\`id\`,\`username\`,\`password\`,\`email\`,\`signup_date\`,\`power\`) VALUES (NULL, "${username}", "${password}", "${email}", NOW(), 3);`;
            ServerAuth.sql.query(sqlQuery, (status, err, result) => {
                if (err) {
                    res.status(400).send(err);
                }
                else {
                    res.status(200).send('Registered successfully!');
                    console.log(`registered new user: ${username} (${email})`);
                }
            });
        }
    }
    static verifyUserPower(username, token, callback) {
        if (username.trim() && token.trim()) {
            if (ServerAuth.tokenStore.verifyToken(username, token)) {
                const sqlQuery = "SELECT username,power FROM `users` WHERE username = '" + username + "'";
                ServerAuth.sql.query(sqlQuery, (status, err, result) => {
                    if (err == null) {
                        if (result[0].username === username) {
                            callback(username, result[0].power);
                        }
                    }
                    else {
                        callback(username, -1);
                    }
                });
            }
        }
    }
    static getRandomInt(maxValue) {
        return Math.floor(Math.random() * Math.floor(maxValue));
    }
    /*
    private static generateToken(username: string) {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789.?!@";
        let result = "";
        const maxTokenSize = 20;

        for (let i = 0; i < maxTokenSize; i++) {
            result += characters[ServerAuth.getRandomInt(characters.length)];
        }

        const fs = require('fs');
        if (!fs.existsSync("./user_tokens/" + username)) //skip generating new token if one already exists
        {
            const stream = fs.createWriteStream("./user_tokens/" + username);
            console.log("writing to disk");
            stream.once('open', (fd: any) => {
                stream.write(result);
                stream.end();
            });
        }
        else {
            const data: string = fs.readFileSync(`./user_tokens/${username}`, { encoding: "utf-8" });
            console.log(`read token for ${username}`);
            return data;
        }

        return result;
    }
    */
    /**
     * Verifies a token based on username and token.
     *
     * @param _username Username
     * @param _token token on file
     *
     * Returns true is the token is correct and returns false if not.
     */
    /*
    public static verifyToken(_username: string, _token: string): boolean {
        const fs = require('fs');
        if (fs.existsSync(`./user_tokens/${_username}`)) {
            const diskToken: string = fs.readFileSync(`./user_tokens/${_username}`, { encoding: 'utf-8' });
            if (diskToken.trim()) {
                if (_token === diskToken) { return true; }
            }
        }

        return false;
    }
    */
    static makePost(res, userPosting, _token, post) {
        const queryString = `INSERT INTO \`blogdata\` (\`id\`,\`title\`,\`postfile\`,\`date\`,\`author\`,\`email\`) VALUES (NULL, "${post.title}", "${post.message}", NOW(), "${post.author}", "${post.author.email}");`;
        this.sql.query(queryString, (status, err, result) => {
            if (err) {
                res.status(400).send(`Error: ${err}`);
            }
            else {
                post.id = result.insertId;
                post.date = new Date(Date.now());
                res.status(200).send(JSON.stringify(post));
                console.log('new post! ' + post.title);
            }
        });
    }
    static editPost(res, userEditing, _token, updatedPost) {
        const queryString = `UPDATE \`blogdata\` SET \`postfile\` = '${updatedPost.message}', \`title\` = '${updatedPost.title}' WHERE \`id\` = ${updatedPost.id}`;
        this.sql.query(queryString, (status, err, result) => {
            if (err) {
                res.status(400).send(result);
            }
            else {
                res.status(200).send(JSON.stringify(updatedPost));
            }
        });
    }
    static deletePost(res, userDeleting, _token, postID) {
        const queryString = `DELETE FROM \`blogdata\` WHERE id = ${postID};`;
        this.sql.query(queryString, (status, err, result) => {
            if (err) {
                res.status(400).send(result);
            }
            else {
                res.status(200).send(':ok_hand:');
            }
        });
    }
    static getLatestPosts(limit = 20, res) {
        const queryString = `SELECT * FROM \`blogdata\` LIMIT ${limit};`;
        this.sql.query(queryString, (status, err, result) => {
            if (err) {
                res.status(400).send(err);
            }
            else {
                const postsToReturn = { posts: Array() };
                for (let i = 0; i < limit; i++) {
                    if (result[i] !== undefined) {
                        postsToReturn.posts.push({
                            title: result[i].title,
                            message: result[i].postfile,
                            author: result[i].author,
                            id: result[i].id,
                            date: new Date(result[i].date)
                        });
                    }
                }
                if (postsToReturn != null) {
                    res.status(200).send(JSON.stringify(postsToReturn));
                }
                else
                    res.status(400).send(err);
            }
        });
    }
    static getPostByID(postID, res) {
        try {
            const queryString = `SELECT * FROM \`blogdata\` WHERE id =${postID};`;
            this.sql.query(queryString, (status, err, result) => {
                if (err) {
                    res.status(400).send(result);
                }
                else {
                    this.getUserByName(result[0].author, (resUser) => {
                        const post = {
                            title: result[0].title,
                            message: result[0].postfile,
                            author: resUser,
                            date: new Date(result[0].date),
                            id: result[0].id,
                        };
                        res.status(200).send(JSON.stringify(post));
                    });
                }
            });
        }
        catch (exc) {
            console.log('getPostByID', exc);
        }
    }
    static getPostsByUsername(res, user, limit) {
        const queryString = `SELECT * FROM \`blogdata\` WHERE author = '${user.username}'; `;
        this.sql.query(queryString, (status, err, result) => {
            if (err) {
                res.status(400).send(err);
            }
            else {
                const postsToReturn = { posts: Array() };
                for (let i = 0; i < limit; i++) {
                    if (result[i] !== undefined) {
                        postsToReturn.posts.push({
                            title: result[i].title,
                            message: result[i].postfile,
                            author: user,
                            id: result[i].id,
                            date: new Date(result[i].date)
                        });
                    }
                }
                if (postsToReturn != null) {
                    res.status(200).send(JSON.stringify(postsToReturn));
                }
                else
                    res.status(400).send(err);
            }
        });
    }
}
exports.ServerAuth = ServerAuth;
// TODO: fix this accessor
ServerAuth.tokenStore = new TokenStore_1.default();
ServerAuth.sql = new SQLRequests_1.MySQLInstance({
    host: 'localhost',
    user: 'mike',
    // TODO: OBFUSCATE PASSWORD PLEASE
    password: 'Papabear123',
    database: 'blogusers',
});
//# sourceMappingURL=OLD_BlogBackend.js.map