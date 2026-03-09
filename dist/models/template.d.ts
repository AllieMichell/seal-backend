import { Document, Types } from "mongoose";
export interface IProposalHeader {
    title: string;
    subtitle?: string;
    proposal?: {
        recipient: string;
        date: string;
        location: string;
    };
    backgroundImage?: string;
    balloonIcon?: string;
}
export interface IProposalAboutUs {
    heading: string;
    description: string;
}
export interface IProposalWorkItem {
    imageUrl: string;
    caption: string;
    icon?: string;
}
export interface IProposalOurWork {
    heading: string;
    items: IProposalWorkItem[];
}
export interface IProposalContent {
    header: IProposalHeader;
    aboutUs: IProposalAboutUs;
    ourWork: IProposalOurWork;
}
export declare const VALID_LAYOUTS: readonly ["proposal"];
export type TemplateLayout = (typeof VALID_LAYOUTS)[number];
export interface ITemplate extends Document {
    organization_id: Types.ObjectId;
    name: string;
    slug: string | null;
    layout: TemplateLayout;
    content: IProposalContent | Record<string, unknown>;
    created_at: Date;
    updated_at: Date;
}
export declare const Template: import("mongoose").Model<ITemplate, {}, {}, {}, Document<unknown, {}, ITemplate, {}, import("mongoose").DefaultSchemaOptions> & ITemplate & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ITemplate>;
