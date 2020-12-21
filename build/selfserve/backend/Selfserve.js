"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const https = require("https");
const BlogBackend_Mongo_1 = require("./BlogBackend_Mongo");
const fs = require("fs");
const Debug_1 = require("./Debug");
const ShopBackend_1 = require("./ShopBackend");
const InventoryBackend_1 = require("./InventoryBackend");
const GoogleCalendarBackend_1 = require("./Calendar/GoogleCalendarBackend");
const ServiceCalendarBackend_1 = require("./Calendar/ServiceCalendarBackend");
let site_config = require(`${process.cwd()}/site.config`);
const ClassifiedsBackend_1 = require("./Classifieds/ClassifiedsBackend");
let selfserve_config = site_config.selfserve;
class Selfserver {
    constructor(_port = 3000, _staticDirectory = "selfserve/build/public_html/") {
        this.port = 3000;
        this.port = _port;
        this.app = express();
        this.app.set('views', _staticDirectory);
        this.app.use(bodyParser.json({ limit: '50mb' }));
        this.app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
        this.app.use((req, res, next) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
            res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
            next();
        });
        this.app.use(express.static(_staticDirectory, { index: '/index.html', dotfiles: 'allow' }));
        this.initBackends();
        BlogBackend_Mongo_1.ServerAuth.tokenStore.loadStore('user_tokens/store.json');
    }
    initBackends() {
        BlogBackend_Mongo_1.ServerAuth.initServerAuth();
        ShopBackend_1.ShopBackend.initShopBackend();
        InventoryBackend_1.InventoryBackend.initInvBackend();
        ClassifiedsBackend_1.ClassifiedsBackend.initBackend();
        GoogleCalendarBackend_1.GoogleCalendarBackend.init();
        ServiceCalendarBackend_1.ServiceCalendarBackend.init();
    }
    useRouter(endpoint, route) {
        if (route !== undefined && endpoint.trim()) {
            this.app.use(endpoint, route);
        }
    }
    startServer() {
        try {
            Debug_1.DebugConsole.Writeq(`Try read of CA from ${selfserve_config.ca_path}`);
            let _ca = fs.readFileSync(selfserve_config.ca_path);
            if (_ca !== undefined)
                Debug_1.DebugConsole.Writeq('Success');
            Debug_1.DebugConsole.Writeq(`Try read of key from ${selfserve_config.priv_key_path}`);
            let _key = fs.readFileSync(selfserve_config.priv_key_path);
            if (_key !== undefined)
                Debug_1.DebugConsole.Writeq('Success');
            Debug_1.DebugConsole.Writeq(`Try read of cert from ${selfserve_config.ca_path}`);
            let _cert = fs.readFileSync(selfserve_config.ca_path);
            if (_cert !== undefined)
                Debug_1.DebugConsole.Writeq('Success');
            let _credentials = {
                ca: _ca,
                key: _key,
                cert: _cert
            };
            console.log(_credentials);
            this.server = https.createServer(_credentials, this.app).listen(this.port, () => {
                Debug_1.DebugConsole.Writeq(`HTTPS Listening on ${this.port}`);
            });
        }
        catch (e) {
            Debug_1.DebugConsole.Write(Debug_1.DebugSeverity.ERROR, 'Failed while reading certificate, key, chain. HTTP Only Mode.');
        }
        this.server = http.createServer(this.app).listen(8000, () => {
            Debug_1.DebugConsole.Writeq('HTTP backups on 8000');
        });
        // this.server = this.app.listen(this.port, () => {
        //     DebugConsole.Writeq(`Listening on ${this.port}`);
        // });
    }
    stopServer() {
        if (this.server == undefined) {
            Debug_1.DebugConsole.Writeq("Note: this.server was undefined.");
        }
        else {
            this.server.close();
        }
    }
}
exports.default = Selfserver;
//# sourceMappingURL=Selfserve.js.map