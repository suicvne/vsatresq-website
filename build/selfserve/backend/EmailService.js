"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let nodemailer = require('nodemailer');
let $ = require('jquery');
class EmailService {
    static SendEmail(to, subject, content, callback) {
        let payload = {
            options: {
                sandbox: true
            },
            content: {
                from: this.FromAddress,
                subject: subject,
                text: content
            }
        };
        $.post(this.APIURL, payload, (result, status, xhr) => {
            callback(result, status);
        }).fail((msg) => {
            callback(msg);
        });
    }
}
exports.default = EmailService;
EmailService.APIKey = '4fa5f40b4b37d0ca4ed3fc517471d5a15676432c';
EmailService.APIURL = 'https://api.sparkpost.com/api/v1/transmissions';
EmailService.FromAddress = 'donotreply@psychcat.org';
//# sourceMappingURL=EmailService.js.map