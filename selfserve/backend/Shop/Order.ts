import { CartItem } from "./ShopItem";

export interface IOrderNote {
    // Epoch string
    note_date: string;
    status: string;
    message: string;
}

export class Order {
    public OrderID: string;
    public UserID: string | undefined;
    public AmountPaid: number;
    public ItemsBought: CartItem[];
    public Payer: any;
    public OrderNotes: IOrderNote[];
    public PayeeEmail: string;
    public OptionalData: string | undefined;
    

    constructor(orderID: string, userID: string | undefined, amountPaid: number, cart: CartItem[], payer: any, payee_email: string, optional_data: string | undefined)
    {
        this.OrderID = orderID;
        this.UserID = userID;
        this.AmountPaid = amountPaid;
        this.ItemsBought = cart;
        this.Payer = payer;
        this.PayeeEmail = payee_email;
        this.OptionalData = optional_data;

        this.OrderNotes = new Array<IOrderNote>({note_date: Date.now().toString(), status: 'Created', message: `${payer.name.full_name} created this order.`});
    }
}