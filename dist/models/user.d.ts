import { Document, Types } from "mongoose";
export interface IUser extends Document {
    name: string;
    email: string;
    phone: string;
    password: string;
    organization?: Types.ObjectId;
}
export declare const User: import("mongoose").Model<IUser, {}, {}, {}, Document<unknown, {}, IUser, {}, import("mongoose").DefaultSchemaOptions> & IUser & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IUser>;
