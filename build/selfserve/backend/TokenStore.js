"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const Debug_1 = require("./Debug");
class TokenStore {
    constructor() {
        this.saveDirectory = `${process.cwd()}/data/user_tokens`;
        Debug_1.DebugConsole.Writeq('Token Store Constructor is being called!!!!');
        this.saveDirectory = `${process.cwd()}/data/user_tokens`;
        Debug_1.DebugConsole.Writeq(`TokenStore Write Directory: ${this.saveDirectory}`);
        this.store = new Array();
        this.doppelStore = new Array();
        this.checkSaveDirectory();
    }
    getNonce() {
        return TokenStore.nonce;
    }
    checkNonce() {
        if (TokenStore.nonce === undefined) {
            let stats = undefined;
            try {
                stats = fs.statSync(`${this.saveDirectory}/_NONCE`);
                Debug_1.DebugConsole.Writeq('(TokenStore.ts) Nonce exists...');
                let fileBuffer = fs.readFileSync(`${this.saveDirectory}/_NONCE`);
                if (fileBuffer === undefined || fileBuffer.length === 0) {
                    Debug_1.DebugConsole.Write(Debug_1.DebugSeverity.ERROR, `(TokenStore.ts) Error while reading back nonce. Returned buffer was undefined or length was 0 when read.`);
                    throw new Error(`(TokenStore.ts) Error while reading back nonce. Returned buffer was undefined or length was 0 when read.`);
                }
                else {
                    Debug_1.DebugConsole.Write(Debug_1.DebugSeverity.VERBOSE, 'Successfully read back nonce. Length: ' + fileBuffer.length + '/' + fileBuffer.byteLength);
                    TokenStore.nonce = fileBuffer.toString();
                }
            }
            catch (error) {
                Debug_1.DebugConsole.Writeq("(TokenStore.ts) Generating nonce....");
                let randomVal = '';
                const characters = "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz123456789.?!@~^&";
                for (let i = 0; i < 31; i++) {
                    randomVal += characters[this.getRandomInt(characters.length)];
                }
                fs.writeFileSync(`${this.saveDirectory}/_NONCE`, randomVal);
                TokenStore.nonce = randomVal;
            }
        }
    }
    checkSaveDirectory() {
        fs.stat(this.saveDirectory, (err, status) => {
            if (err) {
                Debug_1.DebugConsole.Writeq("(TokenStore.ts) Token store does not exist. Creating.");
                fs.mkdir(this.saveDirectory, (err) => { if (err)
                    Debug_1.DebugConsole.Writeq(err);
                else
                    Debug_1.DebugConsole.Writeq(`${this.saveDirectory} created.`); });
            }
            else
                Debug_1.DebugConsole.Writeq('(TokenStore.ts) Token Store directory exists.');
        });
        // fs.exists(this.saveDirectory, (exists: boolean) => {
        //     if(!exists)
        //     {
        //         fs.mkdir(this.saveDirectory, (err: any) => {if(err) DebugConsole.Writeq(err); else DebugConsole.Writeq(`${this.saveDirectory} created.`); });
        //     }
        //     else    DebugConsole.Writeq('Token Store directory exists');
        // })
    }
    // TODO: check if this functions elsewhere
    periodicWrite() {
        if (this.doppelStore !== this.store) {
            this.writeStore(`${this.saveDirectory}/store.json`);
            this.doppelStore = this.store;
        }
    }
    verifyToken(username, token) {
        const returnValue = this.store.find((element) => {
            return (element.username === username) && (element.token === token);
        });
        return (returnValue !== undefined);
    }
    // TODO: ensure uniqueness
    generateToken(username) {
        const returnValue = this.store.find((element) => {
            return (element.username === username);
        });
        if (returnValue !== undefined)
            return returnValue;
        const token = { token: "", username: "null" };
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789.?!@~^&";
        let result = "VSAT-";
        const maxTokenSize = 20;
        for (let i = 0; i < maxTokenSize; i++) {
            result += characters[this.getRandomInt(characters.length)];
        }
        token.token = result;
        token.username = username;
        this.store.push(token);
        this.writeStore(`${process.cwd()}/data/user_tokens/store.json`);
        return token;
    }
    getRandomInt(maxValue) {
        return Math.floor(Math.random() * Math.floor(maxValue));
    }
    loadStore(path) {
        if (fs.existsSync(path)) {
            const storeContents = fs.readFileSync(path, { encoding: "utf-8" });
            const theStore = JSON.parse(storeContents);
            this.store = theStore;
            this.doppelStore = theStore;
            Debug_1.DebugConsole.Writeq('Token Store read!');
        }
        // else, no store! oh well.   
    }
    writeStore(path) {
        const dummyJSObject = [];
        this.store.forEach((element) => {
            dummyJSObject.push({ username: element.username, token: element.token });
        });
        const storeAsJson = JSON.stringify(dummyJSObject);
        fs.writeFileSync(path, storeAsJson, { encoding: "utf-8" });
        Debug_1.DebugConsole.Writeq('Token Store written to disk.');
    }
}
exports.default = TokenStore;
TokenStore.nonce = undefined;
//# sourceMappingURL=TokenStore.js.map