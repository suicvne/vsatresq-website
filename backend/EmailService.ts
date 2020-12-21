
let nodemailer = require('nodemailer');
let $ = require('jquery');

export default class EmailService {
    private static APIKey = '4fa5f40b4b37d0ca4ed3fc517471d5a15676432c';
    public static APIURL = 'https://api.sparkpost.com/api/v1/transmissions';
    public static FromAddress = 'donotreply@psychcat.org';


    public static SendEmail(to: string, subject: string, content: string, callback: Function)
    {
        let payload = 
        {
            options: {
                sandbox: true
            },
            content: {
                from: this.FromAddress,
                subject: subject,
                text: content
            }
        }
        $.post(this.APIURL, payload, (result: any, status: any, xhr: any) => {
            callback(result, status);
        }).fail((msg: any) => {
            callback(msg);
        });
    }
}