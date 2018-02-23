import { Route } from "../../../http/types/route";
import { Config } from "../../../config";
import { validate, getError, allFields } from "../../../util/dynamicElement";
import { AuthorizedGuard } from "../../../guards";
import { Application, Field } from "../../../db/entities/Application";
import { APIFormError, APIBasicError, FormCreateSuccess, FieldRequest } from "../../../http/types/api";
import { Framework } from "../../..";

async function computeErrors(submission: {[key: string]: any}) {
    const errors: {[key: string]: string[]} = {};
    let errorCount: number = 0;
    for (const field in allFields) {
        if (!validate(field, submission[field])) {
            errorCount++;
            errors[field] = [getError(field)];
        }
    }
    return {errors, errorCount};
}

export = [
    {
        opts: {
            method: "get",
            path: "/api/v0/form/fields",
            guards: [AuthorizedGuard]
        },
        handler(req, res) {
            res.json(Config.fields as FieldRequest);
        }
    }, {
        opts: {
            method: "post",
            path: "/api/v0/form/validate",
            guards: [AuthorizedGuard]
        },
        async handler(req, res) {
            const {errors, errorCount} = await computeErrors(req.body);
            if (errorCount === 0) {
                res.status(204).end();
                return;
            }
            res.status(400).json({code: 400, fields: errors} as APIFormError);
        }
    },
    {
        opts: {
            method: "post",
            path: "/api/v0/form/submit",
            guards: [AuthorizedGuard]
        },
        async handler(req, res) {
            const {errors, errorCount} = await computeErrors(req.body);
            if (errorCount !== 0) {
                res.status(400).json({code: 400, fields: errors} as APIFormError);
                return;
            }
            if (!(await req.data.user.canSubmit())) {
                res.status(403).json({code: 403, message: "Cannot submit more than once."} as APIBasicError);
                return;
            }
            const application = new Application();
            application.user = req.data.user.snowflake;
            const responses: Field[] = [];
            for (const formID in req.body) {
                const field = allFields[formID];
                if (!field) {
                    continue;
                }
                const formField = new Field();
                formField.response = req.body[formID];
                formField.type = field.type;
                formField.prompt = field.label;
                formField.formID = formID;
                responses.push(formField);
            }
            application.responses = responses;
            if (!(await req.data.user.submit(application))) {
                res.status(500).json({code: 500, message: "We couldn't process your submission."} as APIBasicError);
                return;
            } else {
                res.json({
                    created: application.created.toISOString(),
                    updated: application.updated.toISOString(),
                    responses: application.responses,
                    canSubmitAgain: await req.data.user.canSubmit()
                } as FormCreateSuccess);
                Framework.events.emit("submit", application);
            }
        }
    }
] as Route[];