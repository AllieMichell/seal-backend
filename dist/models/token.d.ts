import { Document, Types } from "mongoose";
export interface IToken extends Document {
    userId: Types.ObjectId;
    refreshToken: string;
    expiresAt: Date;
}
export declare const Token: import("mongoose").Model<IToken, {}, {}, {}, Document<unknown, {}, IToken, {}, import("mongoose").DefaultSchemaOptions> & IToken & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IToken>;
