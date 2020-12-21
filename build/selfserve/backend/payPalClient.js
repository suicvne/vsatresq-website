'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const config = require(`${process.cwd()}/site.config`).selfserve;
/**
 *
 * PayPal Node JS SDK dependency
 */
const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');
/**
 *
 * Returns PayPal HTTP client instance with environment that has access
 * credentials context. Use this instance to invoke PayPal APIs, provided the
 * credentials have access.
 */
function client() {
    return new checkoutNodeJssdk.core.PayPalHttpClient(environment());
}
/**
 *
 * Set up and return PayPal JavaScript SDK environment with PayPal access credentials.
 * This sample uses SandboxEnvironment. In production, use LiveEnvironment.
 *
 */
function environment() {
    let clientId = process.env.PAYPAL_CLIENT_ID || config.paypal_client_id;
    let clientSecret = process.env.PAYPAL_CLIENT_SECRET || config.paypal_client_secret;
    return new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);
}
function prettyPrint(jsonData, pre = "") {
    return __awaiter(this, void 0, void 0, function* () {
        let pretty = "";
        function capitalize(string) {
            return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
        }
        for (let key in jsonData) {
            if (jsonData.hasOwnProperty(key)) {
                if (isNaN(key))
                    pretty += pre + capitalize(key) + ": ";
                else
                    pretty += pre + (parseInt(key) + 1) + ": ";
                if (typeof jsonData[key] === "object") {
                    pretty += "\n";
                    pretty += yield prettyPrint(jsonData[key], pre + "    ");
                }
                else {
                    pretty += jsonData[key] + "\n";
                }
            }
        }
        return pretty;
    });
}
module.exports = { client: client, prettyPrint: prettyPrint };
//# sourceMappingURL=payPalClient.js.map