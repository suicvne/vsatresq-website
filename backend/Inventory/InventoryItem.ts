
export interface IInventoryItem {
    item_name: string;
    serial_number: string;
    list_date: Date;
    description: string;
    images: any[]; // Array of urls to the images
    notes: IItemNote[];
}

// Notes about the item
export interface IItemNote {
    note_date: Date;
    status: string;
    message: string;
    user: string;
}

export class InventoryItem implements IInventoryItem {
    public item_name: string;
    public serial_number: string;
    public description: string;
    public list_date: Date;
    public images: any[]; // Fuck you MongoDB, not allowing dots in array stuff
    public _id: string | undefined;
    public notes: IItemNote[];

    constructor()
    {
        this.serial_number = "1N0TAR3A1N0M83R";
        this.item_name = "Item Name";
        this.description = "Write a description...";
        this.list_date = new Date(Date.now());
        //this.images = [{file: "images/shop/placeholder", ext: "png"},];
        this.images = Array();
        this.images.push("images/shop/placeholder.png");
        this._id = undefined;

        this.notes = [
            {note_date: new Date(Date.now()), status: "Info", message: "Item first created in the database.", user: "none"}
        ];
        this.notes.push();
    }
}