import { MessageEvent } from "../../discord";

export type CommandHandler = (messageEvent: MessageEvent, next: () => void) => void;

export interface Command {
    opts: {
        name: string;
        guards?: CommandHandler[];
    };
    handler: CommandHandler;
}