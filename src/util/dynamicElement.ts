import { Config } from "../config";

const realFields = Config.fields.filter(field => !!field.id);
export const allFields: {[key: string]: AnyValueField | ChoiceValueField | undefined} = {};
realFields.forEach(field => allFields[field.id as string] = field as any);

export type Diff<T extends string, U extends string> = ({[P in T]: P } & {[P in U]: never } & { [x: string]: never })[T];  
export type Omit<T, K extends keyof T> = Pick<T, Diff<keyof T, K>>;  

export interface AnyValueField {
    type: string;
    label: string;
    id: string;
    readableRequirements: string;
    validator?: RegExp;
    submitToServer?: boolean;
}

export interface ChoiceValueField extends Omit<AnyValueField, "validator"> {
    choices: string[];
}

export const anyValueFields: {[key: string]: AnyValueField | undefined} = {};
realFields.filter(field => !field.choices).forEach(field => anyValueFields[field.id as string] = field as any);

export const choiceValueFields: {[key: string]: ChoiceValueField | undefined} = {};
realFields.filter(field => !!field.choices).forEach(field => {
    if (field.choices) {
        field.choices = field.choices.map(choice => choice.toLowerCase());
    }
    choiceValueFields[field.id as string] = field as any;
});

function validateAny(field: AnyValueField, data: string): boolean {
    if (field.submitToServer === false) {
        return true;
    }
    if (field.validator) {
        return !!field.validator.exec(data);
    }
    return true;
}

function validateChoice(field: ChoiceValueField, data: string): boolean {
    if (field.submitToServer === false) {
        return true;
    }
    return field.choices.includes(data.toLowerCase());
}

export const validate = (key: string, value: string) => {
    if (typeof value === "undefined" || (typeof value === "string" && value.length === 0)) {
        return false;
    }
    const anyValueField = anyValueFields[key];
    const choiceValueField = choiceValueFields[key];
    return anyValueField ? validateAny(anyValueField, value) : choiceValueField ? validateChoice(choiceValueField, value) : false;
}

const defaultError = "The data provided does not fit the criteria.";

export const getError = (key: string) => {
    const anyField = anyValueFields[key], choiceField = choiceValueFields[key];
    if (!anyField && !choiceField) {
        return "The provided field does not exist.";
    }
    return anyField && anyField.readableRequirements || choiceField && choiceField.readableRequirements || defaultError;
}