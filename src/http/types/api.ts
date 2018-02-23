import { Field } from "../../db/entities/Application";

export interface FormCreateSuccess {
    created: string;
    updated: string;
    responses: Field[];
    canSubmitAgain: boolean;
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
    type: "text" | "largetext" | "dropdown" | "checkbox" | "radio" | "password" | "email" | "seperator";
    label: string;
    id: string;
    help?: string;
    placeholder?: string;
    choices?: string[];
}

export interface UserMetadata {
    username: string;
    verified: boolean;
    mfa_enabled: boolean;
    id: string;
    avatar: string;
    discriminator: string;
    email: string;
}

export interface DropdownField extends ClientField {
    type: "dropdown" | "radio";
    choices: string[];
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
    canSubmit: boolean;
}