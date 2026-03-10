import { Document } from "mongoose";
export interface IOrganization extends Document {
    name: string;
    slug: string;
    settings: {
        theme_color: string;
        custom_domain: string;
    };
    created_at: Date;
}
export declare const Organization: import("mongoose").Model<IOrganization, {}, {}, {}, Document<unknown, {}, IOrganization, {}, import("mongoose").DefaultSchemaOptions> & IOrganization & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IOrganization>;
