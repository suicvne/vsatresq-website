import express = require('express');
import bodyParser = require('body-parser');
import http = require('http');
import https = require('https');
import { ServerAuth } from './BlogBackend_Mongo';
import fs = require('fs');

import * as BlogController from './controllers/BlogController';
import { DebugConsole, DebugSeverity } from './Debug';
import { ShopBackend } from './ShopBackend';
import {InventoryBackend} from './InventoryBackend';
import {GoogleCalendarBackend} from './Calendar/GoogleCalendarBackend';
import {ServiceCalendarBackend} from './Calendar/ServiceCalendarBackend';

let site_config = require(`${process.cwd()}/../site.config`);
import { ClassifiedsBackend } from './Classifieds/ClassifiedsBackend';
let selfserve_config = site_config.selfserve;

export default class Selfserver {

    public port: number = 3000;
    public backupPort: number = 8000;

    private app: express.Application;
    private server: https.Server| http.Server | undefined;

    private initBackends()
    {
        ServerAuth.initServerAuth()
        ShopBackend.initShopBackend();
        InventoryBackend.initInvBackend();
        ClassifiedsBackend.initBackend();
        GoogleCalendarBackend.init();
        ServiceCalendarBackend.init();
    }
    
    constructor(_port: number, _backupPort: number, _staticDirectory: string = `${process.cwd()}/build/public_html/`) 
    {
        this.port = _port;
        this.backupPort = _backupPort;

        this.app = express();

        console.log(`static dir: ${_staticDirectory}`);
        this.app.set('views', _staticDirectory);

        this.app.use(bodyParser.json({limit: '50mb'}));
        this.app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
        

        this.app.use((req, res, next) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
            res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
            next();
        });
        this.app.use(express.static(_staticDirectory, {index: 'index.html', dotfiles: 'allow'}));

        this.initBackends();

        ServerAuth.tokenStore.loadStore(`${process.cwd()}/../data/user_tokens/store.json`);
    }

    public useRouter(endpoint: string, route: express.Router) {
        if (route !== undefined && endpoint.trim())
        {
            this.app.use(endpoint, route);
        }
    }

    public startServer(){
        try
        {
            DebugConsole.Writeq(`Try read of CA from ${selfserve_config.ca_path}`);
            let _ca = fs.readFileSync(selfserve_config.ca_path);
            if(_ca !== undefined) DebugConsole.Writeq('Success');

            DebugConsole.Writeq(`Try read of key from ${selfserve_config.priv_key_path}`);
            let _key = fs.readFileSync(selfserve_config.priv_key_path);
            if(_key !== undefined) DebugConsole.Writeq('Success');

            DebugConsole.Writeq(`Try read of cert from ${selfserve_config.ca_path}`);
            let _cert = fs.readFileSync(selfserve_config.ca_path);
            if(_cert !== undefined) DebugConsole.Writeq('Success');

            let _credentials = {
                ca: _ca,
                key: _key,
                cert: _cert
            };

            console.log(_credentials);

            this.server = https.createServer(_credentials, this.app).listen(this.port, () => {
                DebugConsole.Writeq(`HTTPS Listening on ${this.port}`);
            });    
        }
        catch(e)
        {
            DebugConsole.Write(DebugSeverity.ERROR, 'Failed while reading certificate, key, chain. HTTP Only Mode.');
        }
        
        this.server = http.createServer(this.app).listen(this.backupPort, () => {
            DebugConsole.Writeq('HTTP backups on ' + this.backupPort)
        });


        // this.server = this.app.listen(this.port, () => {
        //     DebugConsole.Writeq(`Listening on ${this.port}`);
        // });
    }

    public stopServer() {
        if(this.server == undefined)
        {
            DebugConsole.Writeq("Note: this.server was undefined.");
        }
        else
        {
            this.server!.close();
        }
    }
}
