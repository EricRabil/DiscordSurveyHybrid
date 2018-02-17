import { Config } from "../config";

const realFields = Config.fields.filter(field => !!field.id);

export interface AnyValueField {
    type: string;
    label: string;
    id: string;
}

export interface ChoiceValueField extends AnyValueField {
    choices: string[];
}

export const anyValueFields: {[key: string]: AnyValueField | undefined} = {};
realFields.filter(field => !field.choices).forEach(field => anyValueFields[field.id as string] = field as any);

export const choiceValueFields: {[key: string]: ChoiceValueField | undefined} = {};
realFields.filter(field => !!field.choices).forEach(field => choiceValueFields[field.id as string] = field as any);
