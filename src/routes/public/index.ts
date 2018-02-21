import { Route } from "../../http/types/route";
import { Config } from "../../config";

export = {
    opts: {
        path: "/",
        method: "get"
    },
    render: "index"
} as Route;