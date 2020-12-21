/**
 * About shop.js
 * 
 * Shop.js is designed to encompass any and all functions needed for shop
 * with the Selfserver server software.
 * 
 * Created by Mike Santiago
 * Copyright (C) 2018
 * 
 * DO NOT REDISTRIBUTE!
 */

//#region HTML Element Constants
const element_cart_text = ".item_count"
//#endregion


//#region Object Constructors
/**
 * 
 * @param {number} amount The amount of the items in the cart.
 * @param {ShopItem} shop_item The ShopItem template.
 */
function CartItem(amount, shop_item) {
    return { quantity: amount, item: shop_item };
}

/**
 * Defines the constructor for the ShopItem. This should theoretically match exactly with the TypeScript code.
 */
function ShopItem(params) {
    this.images = new Array();
    
    if (params === undefined) {
        this.price = 0;
        this.currency = "USD";
        this.item_name = "Template";
        this.description = "N/A";
        this.images.push("./images/shop/empty_cart.png");
        this.optional_file = undefined;
    }
    else {
        this.price = params.price;
        this.currency = params.currency;
        this.item_name = params.item_name;
        this.description = params.description;
        this.optional_file = params.optional_file;

        if(params.images === undefined)
        {
            this.images.push("./images/shop/empty_cart.png");
        }
        else this.images = params.images;
    }
    this.list_date = Date.now();
}
//#endregion Object constructors


selfserve.shop = {
    cart: new Array(),
    admin: {},
    db: [],
    initCompleteFn: () => { },
    isTestMode: false,
    initErrorFn: () => {}
}

/**
 * Retrieves an item description from the db
 */
selfserve.shop.getItemByID = (id, callback) => {

    if (selfserve.shop.isTestMode) {
        if (selfserve.shop.db[id] !== undefined) {
            callback(selfserve.shop.db[id]);
            
        }
        else callback(undefined);

        return;
    }
    else {
        if ($.trim(id) && id !== undefined) {
            selfserve.shop.db.forEach(element => {
                console.log(element._id, id);
                console.log(`${element._id}` === id);
                if (`${element._id}` === id) {
                    console.log('returning!!!!');
                    callback(element);
                    return element;
                }
            });
        }
        else console.log('WHAT THE ');
    }
}

selfserve.shop.getItemByID2 = (id) => {
    if (selfserve.shop.isTestMode) {
        if (selfserve.shop.db[id] !== undefined) {
            return selfserve.shop.db[id];
        }
        else return undefined;
    }
    else {
        if ($.trim(id) && id !== undefined) {
            selfserve.shop.db.forEach(element => {
                console.log(`${element._id}`, id);
                console.log(`${element._id}` === id);
                if (`${element._id}` === id) {
                    console.log('returning', element);
                    return element;
                }
            });
        }
    }
}

selfserve.shop.getItemByName = (name, callback) => {
    selfserve.shop.db.forEach((element, index) => {
        if(element.item_name === name)
        {
            callback(element);
            return;
        }
    });
    callback(undefined);
}

selfserve.shop.admin.editItem = (item_id, item, callback) => {
    let payload = {
        username: selfserve.global.currentUser.username,
        token: selfserve.auth.getCookie('token'),
        id: item_id,
        item: item
    };

    $.post('./shop/edit_item', payload, (result, status, xhr) => {
        callback(status, result);
    }).fail((msg) => {
        alert(`Error occurred while editing item\n\n${msg}`);
        callback(msg, undefined);
    });
};

selfserve.shop.getCart = () => selfserve.shop.cart;

selfserve.shop.CartSetItemQuantity = (item, newQuantity, callback) => {
    console.log(`Setting cart total for to ${newQuantity}`, item)

    selfserve.shop.cart.forEach((cart_item, index) => {
        if(cart_item.item._id === item._id)
        {
            console.log('found item in cart');
            cart_item.quantity = newQuantity;
            callback();
        }
    });
};

selfserve.shop.hasItemInCart = (shop_item) => {
    console.log(`verifying if ${shop_item.item_name} is in cart already`);

    if (selfserve.shop.cart !== undefined) {
        var retrievedIndex = -1;
        selfserve.shop.cart.forEach((cart_item, index) => {
            if (cart_item !== undefined) {
                let resolved_id = cart_item.item_id || cart_item.item._id;
                let shop_id = shop_item._id
                console.log(resolved_id, shop_id);


                if (resolved_id == shop_id) {
                    console.log('item found', cart_item, index);
                    retrievedIndex = index;
                }
            }
        });

        return retrievedIndex;
    }
    return -1;
}

selfserve.shop.incrementCartCount = () => {
    var asNumber = Number.parseInt($(element_cart_text).text());
    $(element_cart_text).text((++asNumber));
}

selfserve.shop.refreshCartCount = () => {
    let cartTotalItems = 0;
    selfserve.shop.cart.forEach((element, index) => {
        cartTotalItems = cartTotalItems + parseInt(element.quantity);
    });

    $(element_cart_text).text(cartTotalItems);
}

selfserve.shop.setCartCount = (count) => {
    if (count >= 0) $(element_cart_text).text(count);
}

selfserve.shop.addItemToCart = (shop_item) => {
    if (selfserve.shop.db === undefined) {
        console.log('Unable to read shop database.');
        return 1;
    }

    var cart_item_index = selfserve.shop.hasItemInCart(shop_item);
    
    if (cart_item_index === -1) {
        selfserve.shop.cart.push({quantity: 1, item_id: shop_item._id});
        selfserve.shop.incrementCartCount();
    }
    else if (cart_item_index >= 0) {
        var cartItem = selfserve.shop.cart[cart_item_index];
        cartItem.quantity += 1;
        selfserve.shop.cart[cart_item_index] = cartItem;

        var asNumber = Number.parseInt($(element_cart_text).text());
        $(element_cart_text).text((++asNumber));
    }

    // Ensure we don't lose our cart between pages.
    selfserve.auth.setCookie("cart", JSON.stringify(selfserve.shop.serializeCart()), 2);
    return 0;
}

selfserve.shop.getAllItems = (callback) => {
    if (selfserve.shop.isTestMode) {
        callback(selfserve.shop.db, "success");
    }
    else {
        $.get('./shop/all_items', (result, status, xhr) => {
            selfserve.shop.db = result;
            callback(result, status);
        });
    }
}

selfserve.shop.dbTestItems = () => {

    if (selfserve.shop.db === undefined) selfserve.shop.db = [];

    selfserve.shop.admin.addItemToDb(10, "USD", "USB-C Adapter", "This is pretty much essential and I can't believe I can't ever find one.", ["https://images-na.ssl-images-amazon.com/images/I/61aywE25ksL._SX425_.jpg"]);
    selfserve.shop.admin.addItemToDb(5.59, "USD", "Taco Bell Quesarito", "I'm high and this sounds good.", ["https://www.tacobell.com/images/22371_quesarito_269x269.jpg", "https://hips.hearstapps.com/hmg-prod.s3.amazonaws.com/images/double-beef-quesarito-1555084460.jpg", "https://i2.wp.com/farm9.staticflickr.com/8665/16513414140_d5ba589a6c_z.jpg?resize=640%2C480&ssl=1"]);
    selfserve.shop.admin.addItemToDb(20, "USD", "Space Game", "Cool game bro.", undefined);
    selfserve.shop.admin.addItemToDb(250, "USD", "PS4", "so i can play some fork-knife", ["https://images-na.ssl-images-amazon.com/images/I/71pFB-gWFdL._SX679_.jpg", "https://media.wired.com/photos/5a99f809b4bf6c3e4d405abc/master/pass/PS4-Pro-SOURCE-Sony.jpg"]);
    selfserve.shop.admin.addItemToDb(30000, "USD", "Tesla Model 3", "Electric is the future.", ["https://cdn.pocket-lint.com/r/s/970x/assets/images/147933-cars-review-tesla-model-3-review-lead-image1-sbkpbfvdsl.jpg", "https://www.tesla.com/content/dam/tesla-site/sx-redesign/img/model3-proto/hero/model-3.jpg"]);
}

selfserve.shop.getOrders = (callback) => {
    $.post('/shop/get_order', {order_id: 'all'}, (result, status, xhr) => {
        console.log(result);
        callback(result);
    }).fail((jqXHR) => {
        callback(jqXHR.responseText);
    });
};

selfserve.shop.getOrderByID = (order_id, callback) => {
    if(order_id !== undefined && order_id.trim())
    {
        $.post('/shop/get_order', { order_id: order_id }, (result, status, xhr) => {
            if(result !== undefined)
            {
                callback(result);
                return;
            }
            callback(status);
        }).fail((jqXHR, statusText) => {
            callback(jqXHR.responseText);
        });
    }
    else
    {
        callback('OrderID was invalid');
    }
};

selfserve.shop.admin.addShopItemToDb = (shop_item, callback) => {
    if(shop_item.constructor === ShopItem)
    {
        $.post('/shop/add_item', {new_item: shop_item}, (result, status, xhr) => {
            if(status === "success" && result !== undefined) {
                callback(true);
            }
        }).fail((jqXHR, textStatus, errorThrown) => {
            console.log(jqXHR.responseText);
            callback(jqXHR.responseText);
        });
    }
    else callback("The passed item is not of type ShopItem.");
};

selfserve.shop.admin.deleteShopItemFromDb = (shop_item, callback) => {
    if(shop_item)
    {
        let payload = 
        {
            username: selfserve.global.currentUser.username,
            token: selfserve.auth.getCookie('token'),
            item_id: shop_item._id,
        };

        $.post('/shop/delete_item', payload, (result, status, xhr) => {
            callback(result);
        }).fail((jqXHR, textStatus, errorThrown) => {
            console.log(jqXHR.responseText);
            callback(jqXHR.responseText);
        });
    }
    else callback('Not a shop item. Passed: ', shop_item);
};

selfserve.shop.admin.addItemToDb = (_price, _cur, _name, _desc, _images) => {
    var shopItem = new ShopItem({ price: _price, currency: _cur, item_name: _name, description: _desc, images: _images });
    var asStr = JSON.stringify(shopItem);
    
    if (shopItem !== undefined) {
        if (selfserve.shop.isTestMode) {
            let previousID = -1;
            if(selfserve.shop.db.length > 0)
            {
                previousID = selfserve.shop.db[selfserve.shop.db.length - 1]._id;
            }

            shopItem._id = (previousID + 1);
            selfserve.shop.db.push(shopItem);
        }
        else {
            $.post('/shop/add_item', { new_item: shopItem }, (result, status, xhr) => {
                if (status === "success" && result !== undefined) {
                    console.log('added item to real db:');
                    console.log(result.ops);
                }
            });
        }
    }
};

selfserve.shop.totalCartItemCount = () => {
    var count = 0;
    selfserve.shop.cart.forEach((element) => {
        count += parseInt(element.quantity);
    });
    return count;
}

selfserve.shop.checkAvailability = (callback) => {
    $.get('/shop/availability', (result, status, xhr) => {
        console.log("Shop Availability: ", result, status);
        if (status === 'success')
            callback(result);
        else callback(false);
    });
}

selfserve.shop.serializeCart = () => {
    // Cart: [{item_id, quantity}]
    let serializedCart = [];

    for(i = selfserve.shop.cart.length - 1; i >= 0; i--)
    {
        if(selfserve.shop.cart[i].quantity == 0)
        {
            selfserve.shop.cart[i] = undefined;
        }
        else
        {
            let obj = {
                item_id: selfserve.shop.cart[i].item_id || selfserve.shop.cart[i].item._id,
                quantity: selfserve.shop.cart[i].quantity
            };
            serializedCart.push(obj);
        }
    }
    return serializedCart;
};

selfserve.shop.clearCart = () => {
    selfserve.shop.cart = [];
};

selfserve.shop.restoreCart = () => {
    selfserve.shop.getAllItems((result, status) => {
        if (status === "success" && selfserve.shop.initCompleteFn !== undefined) {
            var _cartCookie = selfserve.auth.getCookie('cart');
            if (_cartCookie) {
                var restoredCart = JSON.parse(_cartCookie);

                // Filter out any 0 quantity items
                var filtered = restoredCart.filter(function(value, index, arr) {
                    return (value.quantity > 0);
                });

                selfserve.shop.cart = [];
                filtered.forEach((bare, index) => {
                    console.log(bare);
                    selfserve.shop.getItemByID(bare.item_id || bare.item._id, (true_item, err) => {
                        if(err) console.log(err);
                        else
                        {
                            selfserve.shop.cart.push({
                                quantity: bare.quantity,
                                item: true_item
                            }); 
                        }
                    });
                });
            }
            $(element_cart_text).text(selfserve.shop.totalCartItemCount());
            selfserve.shop.initCompleteFn();
        }
        else console.error('something vewy bad happened :(');
    });
};

function ItemNote(date, status, message) {
    this.note_date = date;
    this.status = status;
    this.message = message;
    this.id = ranId().toString();
}

function ranId() {
    return Math.floor(Math.random() * 1000000000);
}

selfserve.shop.admin.editOrder = (order_id, order, callback) => {
    if(order.OrderNotes === undefined || order.OrderNotes.length === 0) {
        order.OrderNotes = ["__"];
    }

    if(order._id) delete order._id;

    let payload = {
        username: selfserve.global.currentUser.username,
        token: selfserve.auth.getCookie('token'),
        id: order_id,
        order: order
    };

    console.log(`edit order payload`, payload);

    $.post('/shop/edit_order', payload, (result, status, xhr) => {
        console.log(result, status);
        callback(status, result);
    }).fail((jqXHR) => {
        callback(jqXHR.responseText, undefined);
    });
};

/// !! Function call..*not* a decl
selfserve.shop.checkAvailability((isAvailable) => {
    console.log("Selfserve shop availability check.");
    
    let asBool = (isAvailable == 'true');

    if (asBool) {
        selfserve.shop.restoreCart();
    }
    else {
        console.log('unable to reach shop backend\npopulating with test items, setting test flag.');
        selfserve.shop.isTestMode = true;
        selfserve.shop.dbTestItems();

        selfserve.shop.restoreCart();
    }
});
