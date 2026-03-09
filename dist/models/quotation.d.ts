import { Document, Types } from "mongoose";
export interface IQuotationItem {
    name: string;
    description: string;
    quantity: number;
    unit_price: number;
    discount: number;
}
export interface IQuotation extends Document {
    organization_id: Types.ObjectId;
    created_by: Types.ObjectId;
    number: string;
    client: string;
    date: Date;
    valid_until: Date | null;
    status: "borrador" | "pendiente" | "aceptada" | "rechazada";
    items: IQuotationItem[];
    general_discount: number;
    tax_rate: number;
    notes: string | null;
    created_at: Date;
    updated_at: Date;
}
export declare const Quotation: import("mongoose").Model<IQuotation, {}, {}, {}, Document<unknown, {}, IQuotation, {}, import("mongoose").DefaultSchemaOptions> & IQuotation & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IQuotation>;
