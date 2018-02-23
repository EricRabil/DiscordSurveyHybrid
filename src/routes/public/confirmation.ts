import { Route } from "../../http/types/route";
import { AuthorizedGuard } from "../../guards";
import { Config } from "../../config";

export = {
    opts: {
        path: "/confirmation",
        method: "get",
        guards: [AuthorizedGuard]
    },
    render: "confirmation"
} as Route;