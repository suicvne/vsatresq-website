

export interface IShopItem {
    price: number;
    currency: string; // 3 letter code
    item_name: string;
    list_date: Date;
    description: string;
    images: any[]; // Array of urls to the images
    optional_file: string | undefined;
}

export class CartItem {
    public item: ShopItem;
    public quantity: number;

    constructor(item: ShopItem | undefined = undefined, amt: number = 0)
    {
        this.quantity = amt;

        if(ShopItem === undefined) this.item = new ShopItem();
        else this.item = <ShopItem>item;
    }
}

export class ShopItem implements IShopItem {
    public price: number;
    public currency: string;
    public item_name: string;
    public description: string;
    public list_date: Date;
    public images: any[]; // Fuck you MongoDB, not allowing dots in array stuff
    public optional_file: string | undefined;
    public _id: string | undefined;

    constructor()
    {
        this.price = 0;
        this.currency = "USD";
        this.item_name = "Item Name";
        this.description = "Write a description...";
        this.list_date = new Date(Date.now());
        //this.images = [{file: "images/shop/placeholder", ext: "png"},];
        this.images = Array();
        this.images.push("./images/shop/placeholder.png");
        this._id = undefined;
        this.optional_file = undefined;
    }
}