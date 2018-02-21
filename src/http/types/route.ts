import { Request, Response } from "express";
import { User } from "../../db/entities/User";

export interface RequestDataStore {
    authenticated?: boolean;
    user: User;
}

export interface ExtraRequest extends Request {
    data: RequestDataStore;
    body: {
        [key: string]: any;
    };
    params: any;
    query: {[key: string]: string | undefined};
}

export type RouteHandler = (req: ExtraRequest, res: Response, next: () => void) => void;

/**
 * Structure for API routes - API routes are streamed into express and are integrated as efficiently as possible.
 */
export interface Route {
    opts: {
        /**
         * The publicly accessible path
         */
        path: string;
        /**
         * The request method
         */
        method: "get" | "post" | "options" | "patch" | "delete";
        /**
         * The guards, if any, for this route
         */
        guards?: RouteHandler[];
    };
    /**
     * The actual handler for this route
     */
    handler?: RouteHandler;
    /**
     * Just render a view instead of calling a handler
    */
    render?: string;
}