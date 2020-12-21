const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');

const payPalClient = require('./payPalClient');

import { ShopItem, CartItem } from './Shop/ShopItem'
import { ShopBackend } from './ShopBackend';
import { Order } from './Shop/Order';
import EmailService from './EmailService';
import { DebugConsole, DebugSeverity } from './Debug';

module.exports = async function handleRequest(req: any, res: any, cart: CartItem[], cb: Function)
{
    const orderID = req.body.orderID;
    const userID = req.body.userID || 'guest';

    let true_total: number | undefined = undefined;
    ShopBackend.calculateTrueCartTotal(cart).then(async (value: {db_total: number, cart_total: number}) => {
        console.log("done calculating");
        true_total = value.db_total;

        let request = new checkoutNodeJssdk.orders.OrdersGetRequest(orderID);

        let order;
        try
        {
            order = await payPalClient.client().execute(request);

            console.log(order.result);
            console.log(order.result.purchase_units[0]);
        } catch(err) {
            console.log('\n\nerror occurred while trying to execute request', request, '\n\n');
            console.error(err);
            cb(500, err);
            return;
        }

        if(true_total === undefined)
        {
            cb(400, 'True total undefined :(');
            return;
        }
        
        let complete_payer_obj = {...order.result.payer, ...order.result.purchase_units[0].shipping};
        let email = undefined;
        if(complete_payer_obj.email_address)
            email = complete_payer_obj.email_address
        console.log(complete_payer_obj);

        let order_total = order.result.purchase_units[0].amount.value;
        let payer = order.result.payer;
        
        console.log('\n\npayer: ', payer, '\n\n');
        console.log(`${order_total} == ${true_total}: ${order_total == true_total}`);

        if(order.result.purchase_units[0].amount.value != true_total) // TODO: send cart IDs/counts and check this server side
        {
            cb(400, 'Mismatch cart totals');
            return;
        }
        else
        {
            let newOrder = new Order(orderID, userID, true_total, cart, complete_payer_obj, order.result.purchase_units[0].payee.email_address, req.body.optional_data);

            ShopBackend.addNewOrder(newOrder, (err, result) => {
                if(err) cb(400, err);
                else cb(200, JSON.stringify(newOrder));
            });
        }
        let items = '';
        cart.forEach((item, index) => {
            items += `${item.quantity}x ${item.item.item_name} \$${item.item.price} / ea\n`;
        });
        
        // let email = `Thank you for your order! Your order number is ${orderID}. This is to confirm your order of the follwing: ${items}.\n\nOrder Total: ${true_total}`;
        // EmailService.SendEmail(payer.email_address, 'Thank you for your order!', email, (results: any) => {
        //     if(results)
        //     {
        //         DebugConsole.Writeq('Email results: ');
        //         console.log(results);
        //     }
        //     else console.log('Email service gave nothing back.');
        // });
    }).catch((reason: any) => {
        DebugConsole.Write(DebugSeverity.ERROR, `Error while calculating true cart total for PayPal transaction.\n\nError: ${reason}`);
    });
};