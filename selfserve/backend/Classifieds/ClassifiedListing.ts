export interface IClassifiedListing {
    price: number;
    currency: string;
    year: number;
    make: string;
    model: string;
    miles: number;
    image_path: string;
    images: string[];
    contact: string;
    writeup: string;
}

export class ClassifiedListing implements IClassifiedListing {
    public price: number;
    public currency: string;
    public year: number;
    public make: string;
    public model: string;
    public miles: number;
    public image_path: string;
    public images: string[];
    public contact: string;
    public writeup: string;

    constructor()
    {
        this.price = 0;
        this.currency = "USD";
        this.year = 2004;
        this.make = "Dodge";
        this.model = "Sprinter";
        this.miles = 300000;
        this.image_path = "/classifieds/cdn";
        this.images = [];
        this.contact = "";
        this.writeup = "";
    }
    
}