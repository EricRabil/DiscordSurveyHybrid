import { ClientField, FieldRequest, ReadOnlyClientField, AboutMeRequest, FormCreateSuccess } from "../http/types/api";
(async function() {
    function getCookie(cookiename: string) {
        var cookiestring=RegExp(""+cookiename+"[^;]+").exec(document.cookie);
        return decodeURIComponent(!!cookiestring ? cookiestring.toString().replace(/^[^=]+./,"") : "");
    }
    const token = getCookie("token");
    if (!token) {
        console.error("Bad token in cookie store.");
        return;
    }
    const request = (method: "get" | "post" | "options" | "patch" | "delete", url: string, body?: any): Promise<any> => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open(method.toUpperCase(), url, true);
            if (url.startsWith("/")) {
                xhr.setRequestHeader("Authorization", token);
            }
            if (method === "post" || method === "patch") {
                xhr.setRequestHeader("Content-type", "application/json");
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === XMLHttpRequest.DONE) {
                        if (xhr.status === 204) {
                            resolve();
                            return;
                        }
                        if (xhr.status < 299) {
                            resolve(JSON.parse(xhr.response));
                        } else {
                            reject(JSON.parse(xhr.response));
                        }
                    }
                }
                xhr.send(body);
            } else {
                xhr.onload = function() {
                    if (xhr.status === 204) {
                        resolve();
                        return;
                    }
                    if (xhr.status < 299) {
                        resolve(JSON.parse(xhr.response));
                    } else {
                        reject(JSON.parse(xhr.response));
                    }
                };
                xhr.send(null);
            }
        });
    };

    const fields: FieldRequest = await request("get", "/api/v0/form/fields");
    const me: AboutMeRequest = await request("get", "/api/v0/auth/@me");
    const root: HTMLSpanElement = document.getElementById("dynamicRoot") as any;

    const form: HTMLFormElement = document.getElementsByTagName("form")[0];
    form.onsubmit = (event) => event.preventDefault();

    const isReadOnlyField: (field: ClientField) => field is ReadOnlyClientField = (field): field is ReadOnlyClientField => {
        return "prefill" in field && "userEntryEnabled" in field && "submitToServer" in field;
    }

    const insert = (field: ClientField) => {
        const insert = (element: HTMLElement, classOverrides?: string[], appendTo: HTMLElement = inputElementWrapper) => {
            element.classList.add(...(classOverrides || ["form-control"]));
            if (field.id) {
                element.id = field.id;
            }
            appendTo.appendChild(element);
        };
        
        // Handle non-form field first
        if (field.type == "seperator") {
            const seperatorElement = document.createElement("hr");
            insert(seperatorElement, [], root);     
            return;   
        }

        const formGroup = document.createElement("div");
        formGroup.classList.add("form-group", "row");
        root.appendChild(formGroup);
        
        const label = document.createElement("label");
        label.htmlFor = field.id;
        label.innerText = field.label;
        label.classList.add("col-sm-2", "col-form-label");
        formGroup.appendChild(label);

        const inputElementWrapper = document.createElement("div");
        inputElementWrapper.classList.add("col-sm-10");
        formGroup.appendChild(inputElementWrapper);

        if (field.type === "text" || field.type === "password" || field.type === "email") {
            const inputElement = document.createElement("input");
            inputElement.type = field.type;
            if (field.placeholder) {
                inputElement.placeholder = field.placeholder;
            }
            if (isReadOnlyField(field)) {
                inputElement.disabled = !field.userEntryEnabled;
                inputElement.value = (me as any)[field.prefill];
            }
            insert(inputElement);
        } else if (field.type === "dropdown") {
            const inputElement = document.createElement("select");
            for (const choice of (field.choices as string[])) {
                const optionElement = document.createElement("option");
                optionElement.innerText = choice;
                inputElement.appendChild(optionElement);
            }
            insert(inputElement);   
        } else if (field.type === "checkbox") {
            const checkWrapper = document.createElement("div");
            checkWrapper.classList.add("form-check");

            const element: HTMLInputElement = document.createElement("input");
            element.type = field.type;
            element.classList.add("form-check-input");
            element.id = field.id;
            checkWrapper.appendChild(element);

            inputElementWrapper.appendChild(checkWrapper);
        } else if (field.type === "radio") {
            const fieldset = document.createElement("fieldset");
            fieldset.classList.add("form-group");
            inputElementWrapper.appendChild(fieldset);
            
            const row = document.createElement("div");
            row.classList.add("row");
            row.id = field.id;
            fieldset.appendChild(row);

            const inputContainerWrapper = document.createElement("div");
            inputContainerWrapper.classList.add("col-sm-10");
            row.appendChild(inputContainerWrapper);


            for (let i = 0; i < (field.choices as string[]).length; i++) {
                const inputContainer = document.createElement("div");
                inputContainer.classList.add("form-check");
                inputContainerWrapper.appendChild(inputContainer);

                const value = (field.choices as string[])[i];

                const inputElement = document.createElement("input");
                inputElement.classList.add("form-check-input");
                inputElement.type = field.type;
                inputElement.name = field.id;
                inputElement.id = `${field.id}${i}`;
                inputElement.value = value;
                inputContainer.appendChild(inputElement);

                const label = document.createElement("label");
                label.classList.add("form-check-label");
                label.htmlFor = `${field.id}${i}`;
                label.innerText = value;
                inputContainer.appendChild(label);
            }
        }
    }
    for (const field of fields) {
        insert(field);
    }

    const submittableFields: ClientField[] = fields.filter(field => (field as any).submitToServer !== false && (field as any).type !== 'separator');

    const simpleValueFields: ClientField[] = submittableFields.filter(field => field.type === "text" || field.type === "dropdown" || field.type === "password" || field.type === "email");
    const checkboxFields: ClientField[] = submittableFields.filter(field => field.type === "checkbox");
    const radioFields: ClientField[] = submittableFields.filter(field => field.type === "radio");

    const helpElements: HTMLElement[] = [];

    const submitButton: HTMLButtonElement = document.getElementById("formSubmitButton") as HTMLButtonElement;
    
    if (!me.canSubmit) {
        submitButton.disabled = true;
        submitButton.classList.add("disabled");
        setTimeout(() => alert("Thanks for applying! You can no longer make submissions. We'll get back to you as soon as we can!"), 1);
    }

    submitButton.onclick = async (event) => {
        helpElements.forEach(element => element.remove());
        event.stopImmediatePropagation();
        event.stopPropagation();
        const simpleValueElements: Array<{value: string, id: string}> = simpleValueFields.map(field => document.getElementById(field.id) as any);
        const checkboxElements: Array<{checked: boolean, id: string}> = checkboxFields.map(field => document.getElementById(field.id) as any);
        const radioElements: Array<{value: string, id: string}> = [];
        radioFields.forEach(field => {
            const inputElements: Array<{checked: boolean, value: string, name: string}> = document.getElementsByName(field.id) as any;
            for (const element of inputElements) {
                if (!element.checked) {
                    continue;
                }
                radioElements.push({value: element.value, id: element.name});
                break;
            }
        });
        const submission: {[key: string]: string | boolean} = {};

        for (const element of [...simpleValueElements, ...radioElements]) {
            submission[element.id] = element.value;
        }
        for (const element of checkboxElements) {
            submission[element.id] = element.checked;
        }
        try {
            const res: FormCreateSuccess = await request("post", "/api/v0/form/submit", JSON.stringify(submission));
            for (const child of root.children) {
                child.remove();
            }
            for (const field of fields) {
                insert(field);
            }
            if (!res.canSubmitAgain) {
                submitButton.disabled = true;
                submitButton.classList.add("disabled");
                alert("Thanks for applying! You can no longer make submissions. We'll get back to you as soon as we can!");
            }
        } catch (e) {
            if (e.fields) {
                const fields: {[key: string]: string[]} = e.fields;
                for (const field in fields) {
                    const [error] = fields[field];
                    // <small id="emailHelp" class="form-text text-muted">We'll never share your email with anyone else.</small>
                    // TODO: Refactor to use https://getbootstrap.com/docs/4.0/components/forms/#server-side
                    const help = document.createElement("small");
                    help.id = `${field}ErrorHelp`;
                    help.classList.add("form-text", "text-danger");
                    help.innerText = error;

                    const basicElement: HTMLElement | null = document.getElementById(field);
                    if (basicElement && basicElement.parentElement) {
                        if ((basicElement as any).type === "checkbox") {
                            const wrapper: HTMLSpanElement = document.createElement("span");
                            wrapper.appendChild(document.createElement("br"));
                            wrapper.appendChild(help);
                            helpElements.push(wrapper);
                            if (basicElement.parentElement.parentElement) {
                                basicElement.parentElement.parentElement.appendChild(wrapper);
                            }
                        } else {
                            helpElements.push(help);
                            basicElement.parentElement.appendChild(help);
                        }
                    }
                }
                return;
            }
            alert(e.message);
        }
    }
})();