import { Field } from "../../db/entities/Application";

export interface FormCreateSuccess {
    created: string;
    updated: string;
    responses: Field[];
}

export interface APIBasicError {
    code: number;
    message: string;
}

export interface APIFormError {
    code: number;
    fields: {
        [key: string]: string[];
    };
}

export interface ClientField {
    type: "text" | "dropdown" | "checkbox" | "radio" | "password" | "email";
    label: string;
    id: string;
}

export interface ReadOnlyClientField extends ClientField {
    prefill: string;
    userEntryEnabled: boolean;
    submitToServer: boolean;
}

export type FieldRequest = ClientField[];

export interface AboutMeRequest {
    snowflake: string;
    username: string;
    discriminator: string;
    email: string;
}