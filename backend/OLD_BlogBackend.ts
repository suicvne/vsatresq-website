import express = require("express");
import { SQLStatus, MySQLInstance } from "./SQLRequests";
import { MysqlError } from "mysql";
/*import { callbackify } from "util";*/
import TokenStore from "./TokenStore";

export enum UserPower {
    Admin = 1,
    User = 2,
}

export class User implements IUser {
    public id: number;
    public username: string;
    public signup_date: Date;
    public email: string;
    public power: UserPower;
    public password: string | undefined = undefined;

    constructor(_id: number, _username: string, _password: string | undefined, _signup_date: Date, _email: string, _power: UserPower) {
        this.id = _id; this.username = _username; this.password = _password!; this.signup_date = _signup_date; this.email = _email; this.power = _power;
    }
}

export interface IUser {
    id: number;
    username: string;
    password: string | undefined;
    signup_date: Date;
    email: string;
    power: UserPower;
}

export interface IBlogPost {
    title: string;
    message: string;
    author: IUser | string;
    date: Date;

    /**
     * Post ID
     */
    id: number;
}


export abstract class ServerAuth {

    // TODO: fix this accessor
    public static tokenStore: TokenStore = new TokenStore();
    
    private static sql: MySQLInstance = new MySQLInstance({
        host: 'localhost',
        user: 'mike',
        // TODO: OBFUSCATE PASSWORD PLEASE
        password: 'Papabear123',
        database: 'blogusers',
    });
    
    public static getUserInformation(res: express.Response, callback: (result: IUser) => void, username?: string, id?: number) {
        let verb = 'username';
        if (id !== undefined) {
            verb = 'id';
        }
        ServerAuth.sql.query(`SELECT * FROM users WHERE ${verb} = ${(verb === 'username') ? `'${username}'` : id};`, (status: SQLStatus, err: MysqlError, result: any) => {
            if(err) { console.log(err); return; }
            const toReturn: User = new User(
                result[0].id,
                result[0].username,
                undefined,
                result[0].signup_date,
                result[0].email,
                result[0].power)
            ;
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

    public static getUserById(id: number, callback: (result: IUser) => void) {
        ServerAuth.sql.query(`SELECT * FROM users WHERE id = ${id};`, (status: SQLStatus, err: MysqlError, result: any) => {
            if(err) { console.log(err); return; }
            const toReturn: User = new User(
                result[0].id,
                result[0].username,
                undefined,
                result[0].signup_date,
                result[0].email,
                result[0].power)
            ;
            callback(toReturn);
        });
    }

    public static getUserByName(username: string, callback: (result: IUser) => void) {
        ServerAuth.sql.query(`SELECT * FROM users WHERE username = '${username}';`, (status: SQLStatus, err: MysqlError, result: any) => {
            if(err) { console.log(err); return; }
            const toReturn: IUser = {
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

    public static doLogin(res: express.Response, username: string, password: string, callback: (status: SQLStatus, err?: MysqlError) => void) {
        ServerAuth.sql.query("SELECT username, password FROM users WHERE username = '" + username + "'", (status: SQLStatus, err: MysqlError, result: any) => {
            if (err) { callback(SQLStatus.Error, err); }
            if (result) {
                if (result[0].username === username && result[0].password === password) {
                    const newToken = ServerAuth.tokenStore.generateToken(username);

                    res.set('Authorization', newToken.token);
                    res.status(200).send(`Logged in as ${username} successfully.`);
                    callback(SQLStatus.OK);
                }
            } else {
                res.status(400).send('User not found/credential mismatch.');
                callback(SQLStatus.Error, err);
            }
        });
    }

    public static registerUser(res: express.Response, username: string, password: string, email: string) {
        if (username.trim() && password.trim() && email.trim())
        {
            const sqlQuery = `INSERT INTO \`users\` (\`id\`,\`username\`,\`password\`,\`email\`,\`signup_date\`,\`power\`) VALUES (NULL, "${username}", "${password}", "${email}", NOW(), 3);`;
            ServerAuth.sql.query(sqlQuery, (status: SQLStatus, err: MysqlError, result: any) => {
                if (err) {res.status(400).send(err); }
                else
                {
                    res.status(200).send('Registered successfully!');
                    console.log(`registered new user: ${username} (${email})`);
                }
            });
        }
    }

    public static verifyUserPower(username: string, token: string, callback: (username: string, power: number) => void) {
        if (username.trim() && token.trim()) {
            if (ServerAuth.tokenStore.verifyToken(username, token)) {
                const sqlQuery = "SELECT username,power FROM `users` WHERE username = '" + username + "'";
                ServerAuth.sql.query(sqlQuery, (status: SQLStatus, err: MysqlError, result: any) => {
                    if (err == null) {
                        if (result[0].username === username) {
                            callback(username, result[0].power);
                        }
                    }
                    else { callback(username, -1); }
                });
            }
        }
    }

    private static getRandomInt(maxValue: number) {
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

    public static makePost(res: express.Response, userPosting: IUser, _token: string, post: IBlogPost): void {
        const queryString = `INSERT INTO \`blogdata\` (\`id\`,\`title\`,\`postfile\`,\`date\`,\`author\`,\`email\`) VALUES (NULL, "${post.title}", "${post.message}", NOW(), "${post.author}", "${(<IUser>post.author).email}");`;
        this.sql.query(queryString, (status: SQLStatus, err: MysqlError, result: any) => 
        {
            if(err){  res.status(400).send(`Error: ${err}`); }
            else {
                post.id = result.insertId;
                post.date = new Date(Date.now());
                res.status(200).send(JSON.stringify(post));
                console.log('new post! ' + post.title);
            }
        });
         
    }

    public static editPost(res: express.Response, userEditing: IUser, _token: string, updatedPost: IBlogPost) {
        const queryString = `UPDATE \`blogdata\` SET \`postfile\` = '${updatedPost.message}', \`title\` = '${updatedPost.title}' WHERE \`id\` = ${updatedPost.id}`;
        this.sql.query(queryString, (status: SQLStatus, err: MysqlError, result: any) => {
            if(err){  res.status(400).send(result);}
            else
            {
                res.status(200).send(JSON.stringify(updatedPost));
            }
        });
         
    }

    public static deletePost(res: express.Response, userDeleting: IUser, _token: string, postID: number) {
        const queryString = `DELETE FROM \`blogdata\` WHERE id = ${postID};`;
        this.sql.query(queryString, (status: SQLStatus, err: MysqlError, result: any) => {
            if(err) {  res.status(400).send(result);}
            else
            {
                res.status(200).send(':ok_hand:');
            }
        });
         
    }

    public static getLatestPosts(limit: number = 20, res: express.Response) {
        const queryString = `SELECT * FROM \`blogdata\` LIMIT ${limit};`;
        this.sql.query(queryString, (status: SQLStatus, err: MysqlError, result: any) => {
            if(err) {   res.status(400).send(err); }
            else {
                const postsToReturn = { posts: Array<IBlogPost>() };
                for(let i = 0; i < limit; i++) 
                {
                    if(result[i] !== undefined) {
                        postsToReturn.posts.push({
                            title: result[i].title,
                            message: result[i].postfile,
                            author: result[i].author,
                            id: result[i].id,
                            date: new Date(result[i].date)
                        });
                    }
                }
                if(postsToReturn != null) {
                    res.status(200).send(JSON.stringify(postsToReturn));
                }
                else
                    res.status(400).send(err);
            }
        });
    }

    public static getPostByID(postID: number, res: express.Response) {
        try
        {
        const queryString = `SELECT * FROM \`blogdata\` WHERE id =${postID};`;
        this.sql.query(queryString, (status: SQLStatus, err: MysqlError, result: any) => {
            if(err) {  res!.status(400).send(result);}
            else
            {
                this.getUserByName(result[0].author, (resUser: IUser) => {
                    const post: IBlogPost = {
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
        catch(exc) {console.log('getPostByID', exc);}
    }

    public static getPostsByUsername(res: express.Response, user: IUser, limit: number) {
        const queryString = `SELECT * FROM \`blogdata\` WHERE author = '${user.username}'; `;
        this.sql.query(queryString, (status: SQLStatus, err: MysqlError, result: any) => {
            if(err) {   res.status(400).send(err); }
            else {
                const postsToReturn = { posts: Array<IBlogPost>() };
                for(let i = 0; i < limit; i++) 
                {
                    if(result[i] !== undefined) {
                        postsToReturn.posts.push({
                            title: result[i].title,
                            message: result[i].postfile,
                            author: user,
                            id: result[i].id,
                            date: new Date(result[i].date)
                        });
                    }
                }
                if(postsToReturn != null) {
                    res.status(200).send(JSON.stringify(postsToReturn));
                }
                else
                    res.status(400).send(err);
            }
        });
    }
}
