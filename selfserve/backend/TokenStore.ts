import fs = require('fs');
import { DebugConsole, DebugSeverity } from './Debug';


interface Token {
    username: string;
    token: string;
}

export default class TokenStore {

    private store: Token[];
    private doppelStore: Token[];

    private saveDirectory: string = `${process.cwd()}/../data/user_tokens`;

    private static nonce: string | undefined = undefined;

    public getNonce(): string | undefined {
        return TokenStore.nonce;
    }

    constructor() {
        DebugConsole.Writeq('Token Store Constructor is being called!!!!');

        this.saveDirectory = `${process.cwd()}/../data/user_tokens`;
        DebugConsole.Writeq(`TokenStore Write Directory: ${this.saveDirectory}`);


        this.store = new Array<Token>();
        this.doppelStore = new Array<Token>();

        this.checkSaveDirectory();
    }

    public checkNonce() {
        if(TokenStore.nonce === undefined)
        {
            let stats = undefined;
            try
            {
                stats = fs.statSync(`${this.saveDirectory}/_NONCE`);
                DebugConsole.Writeq('(TokenStore.ts) Nonce exists...');
                let fileBuffer = fs.readFileSync(`${this.saveDirectory}/_NONCE`);
                if(fileBuffer === undefined || fileBuffer.length === 0)
                {
                    DebugConsole.Write(DebugSeverity.ERROR, `(TokenStore.ts) Error while reading back nonce. Returned buffer was undefined or length was 0 when read.`);
                    throw new Error(`(TokenStore.ts) Error while reading back nonce. Returned buffer was undefined or length was 0 when read.`);
                }
                else
                {
                    DebugConsole.Write(DebugSeverity.VERBOSE, 'Successfully read back nonce. Length: ' + fileBuffer.length + '/' + fileBuffer.byteLength);
                    TokenStore.nonce = fileBuffer.toString();
                }
            }
            catch(error)
            {
                DebugConsole.Writeq("(TokenStore.ts) Generating nonce....");
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

    private checkSaveDirectory() {

        fs.stat(this.saveDirectory, (err, status) => {
            if(err)
            {
                DebugConsole.Writeq("(TokenStore.ts) Token store does not exist. Creating.");
                fs.mkdir(this.saveDirectory, (err: any) => {if(err) DebugConsole.Writeq(err); else DebugConsole.Writeq(`${this.saveDirectory} created.`); });
            }
            else DebugConsole.Writeq('(TokenStore.ts) Token Store directory exists.');
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
    private periodicWrite() {
        if(this.doppelStore !== this.store)
        {
            this.writeStore(`${this.saveDirectory}/store.json`);
            this.doppelStore = this.store;
        }
    }

    public verifyToken(username: string, token: string): boolean {
        const returnValue = this.store.find((element): boolean => {
            return (element.username === username) && (element.token === token);
        });
        return (returnValue !== undefined);
    }

    // TODO: ensure uniqueness
    public generateToken(username: string): Token {
        const returnValue = this.store.find((element): boolean => {
            return (element.username === username);
        });
        if(returnValue !== undefined)
            return returnValue!;


        const token = {token: "", username: "null"};
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789.?!@~^&";
        let result = "VSAT-";
        const maxTokenSize = 20;

        for (let i = 0; i < maxTokenSize; i++) {
            result += characters[this.getRandomInt(characters.length)];
        }

        token.token = result;
        token.username = username;

        this.store.push(token);
        this.writeStore(`${this.saveDirectory}/store.json`);
        return token;
    }

    private getRandomInt(maxValue: number) {
        return Math.floor(Math.random() * Math.floor(maxValue));
    }

    public loadStore(path: string) {
        if(fs.existsSync(path))
        {
            const storeContents: string = fs.readFileSync(path, {encoding: "utf-8"});
            const theStore: Token[] = JSON.parse(storeContents);
            this.store = theStore;
            this.doppelStore = theStore;
            DebugConsole.Writeq('Token Store read!');
        }
        // else, no store! oh well.   
    }

    public writeStore(path: string) {
        const dummyJSObject: any = [];
        this.store.forEach((element) => {
            dummyJSObject.push({username: element.username, token: element.token});
        });

        const storeAsJson: string = JSON.stringify(dummyJSObject);
        fs.writeFileSync(path, storeAsJson, {encoding: "utf-8"});
        DebugConsole.Writeq('Token Store written to disk.');
    }
}
