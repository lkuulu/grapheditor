/*
  Define ExecFunction class structure
 */

class ExecFunctionDefs {
    static set = []
    constructor() {
        // glob init here
    }

    execute(parameters, runtime) {
        // here we can alter parameters globally,
        // ex: sanitize,
        return parameters
    }

    static classInstanceByName(options, className) {
        let myClass = options.filter(option => option.value === className);
        return myClass[0].class;
    }

    static listFunctionsForPropertyEditor() {
        let options=['none']

        for (let i=0; i<this.set.length; i++) {
            options.push({text:this.set[i].definition, value:this.set[i].name, class:this.set[i].registeredClass, jsonSchema:this.set[i].jsonSchema})
        }
        return options
    }
    static register(){
        this.set.push(this.me(this))
    }

    static me(classToRegister) {
        return {name: this.name, definition: this.definition, registeredClass:classToRegister, jsonSchema: this.jsonSchema}
    }
}

class sendMail extends ExecFunctionDefs {
    static definition='Envoyer un mail';
    static jsonSchema = {}
    constructor () {
        super()
    }
    async execute(parameters, runtime) {
        parameters = super.execute(parameters, runtime);
        logger.debug.log(this.name, 'execute', parameters);
        /*
                parameters.body = 'monbody'
                parameters.subject = 'testMail'
                logger.debug.log(parameters)
                Email.send({
                    Host: "smtp.*****.***",
                    Username: "***********",
                    Password: "***********",
                    To: parameters.sendTo,
                    From: "luc@pharabod.com",
                    Subject: parameters.subject,
                    Body: parameters.body,
                }).then(
                    message => {
                        parameters.result = 'OK'
                        logger.debug.log("mail sent successfully")
                    }
                );
                */

        return parameters
    }
}



class bootstrapAskAQuestion extends ExecFunctionDefs {
    static definition = 'Bootstrap Question';
    static jsonSchema = {}

    constructor() {
        super()
    }


async execute(parameters, runtime) {
        parameters = super.execute(parameters, runtime);
        logger.debug.log(parameters)
        const request = async (parameters, runtime) => {
            let result = {return: false}
            let response = null

            response = await this.showPrompt(parameters)

            //response = await prompt(parameters.question, parameters.default)
            result = await response;

            // correct isTransitioning issue for opening many times
            let modal = bootstrap.Modal.getInstance($('#promptModal'))

            $('#promptModal').modal('hide')
            await new Promise(resolve => setTimeout(resolve, 400));

/*
            if (modal._isTransitioning) {
                modal._isTransitioning = false
            }
 */

            const setContext = new Function('return ' + JSON.stringify(runtime.getContext()))
            let context = setContext(parameters.context)

            const callBack = new Function('answer', 'context',  parameters.script);

            result = callBack(result, context);
            logger.debug.log('SORTIE DE SCRIPT : ', result);
            runtime.setContext(result.context)

            return result.return
        }
        return await request(parameters, runtime)
    }

    htmlFragment = function() {
        return '<div class="modal fade" id="promptModal" tabindex="-1" aria-labelledby="promptModal" aria-hidden="true">\n' +
            '\t<div class="modal-dialog">\n' +
            '\t\t<div class="modal-content">\n' +
            '\t\t\t<div class="modal-header">\n' +
            '\t\t\t\t<h5 class="modal-title" id="promptModalLabel">New message</h5>\n' +
            '\t\t\t\t<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>\n' +
            '\t\t\t</div>\n' +
            '\t\t\t<div class="modal-body">\n' +
            '\t\t\t\t<form>\n' +
            '\t\t\t\t\t<div class="mb-3">\n' +
            '\t\t\t\t\t\t<label for="recipient-name" class="col-form-label"></label>\n' +
            '\t\t\t\t\t\t<input type="text" class="form-control" id="recipient-name">\n' +
            '\t\t\t\t\t</div>\n' +
            '\t\t\t\t</form>\n' +
            '\t\t\t</div>\n' +
            '\t\t\t<div class="modal-footer">\n' +
            '\t\t\t\t<button type="button" class="btn btn-secondary" data-bs-dismiss="modal" id="prompt-modal-secondary">Close</button>\n' +
            '\t\t\t\t<button type="button" class="btn btn-primary" data-bs-dismiss="modal" id="prompt-modal-primary">Send message</button>\n' +
            '\t\t\t</div>\n' +
            '\t\t</div>\n' +
            '\t</div>\n' +
            '</div>\n'
    }

    showPrompt = async function (parameters) {
        // prepare modal container
        let promptModalContainer =document.getElementById('promptModal-container')
        if (promptModalContainer===null) {
            // create container in body if not exists
            promptModalContainer = document.createElement('div');
            promptModalContainer.id='promptModal-container'
            document.body.appendChild(promptModalContainer);
        }
        promptModalContainer.innerHTML=this.htmlFragment()

        let promptModal = document.getElementById('promptModal')

        switch (parameters.type) {
            case 'prompt':
                promptModal.querySelector('.modal-body').style.display = 'block'
                promptModal.querySelector('.modal-body input').value = parameters.default
                break
            case 'confirm':
                promptModal.querySelector('.modal-body').style.display = 'none'
                break
        }
        $('#promptModal').modal("dispose")
        promptModal.querySelector('.modal-title').textContent = parameters.question
        promptModal.querySelector('.btn-secondary').textContent = parameters.buttons.secondary.label
        promptModal.querySelector('.btn-primary').textContent = parameters.buttons.primary.label
        $('#promptModal').modal('show')

        return new Promise(resolve => {
            document.querySelector('#prompt-modal-primary').addEventListener('click', async function() {
                resolve((parameters.type==='prompt') ? $('#recipient-name').val() : parameters.buttons.primary.value )
            });
            document.querySelector('#prompt-modal-secondary').addEventListener('click', async function() {
                resolve((parameters.type==='prompt') ? parameters.default : parameters.buttons.secondary.value )
            });
        })
    }
}
class askAQuestion extends ExecFunctionDefs {
    static definition='Question utilisateur';
    static jsonSchema = {}
    constructor () {
        super()
    }
    async execute(parameters, runtime) {
        parameters = super.execute(parameters, runtime);
logger.debug.log(parameters)
        const request = async (parameters, runtime) => {
            let result ={return:false}
            let response = null
            switch(parameters.type) {
                case 'prompt':
                    response = await prompt(parameters.question, parameters.default)
                    break
                case 'confirm':
                     response = await confirm(parameters.question)
                    break


            }

            //response = await prompt(parameters.question, parameters.default)
            result = await response;

            const setContext = new Function( 'return '+ JSON.stringify(runtime.getContext()) )
            let context = setContext(parameters.context)

            const callBack=new Function('answer', 'context',  parameters.script);

            result = callBack(result, context);
            logger.debug.log('SORTIE DE SCRIPT : ',result);
            runtime.setContext(result.context)
            return result.return

            logger.debug.log(result);
            return result
        }
        return await request(parameters, runtime)

    }
}

class httpCode extends ExecFunctionDefs {
    static definition='Code retour HTTP GET';
    static jsonSchema = {
        "$schema": "http://json-schema.org/draft-04/schema#",
        "type": "object",
        "properties": {
            "url": {
                "type": "string"
            },
            "script": {
                "type": "string"
            }
        },
        "required": [
            "url",
            "script"
        ]
    }
    constructor () {
        super()
    }
    async execute(parameters, runtime) {
        parameters = super.execute(parameters, runtime);
        let res = {responseCode:'', responseText:'', url:'', data:{}, headers: {}}
        const request = async (parameters, runtime) => {
            let result ={return:false}
            const response = await fetch(   parameters.url,
                {
                    method:'GET'
                })
                .then(function(response) {
                    res.url = response.url
                    res.responseCode = response.status
                    res.responseText = response.statusText

                    const setContext = new Function('return ' + JSON.stringify(runtime.getContext()))
                    let context = setContext(parameters.context)
                    const callBack=new Function('res',  'context', parameters.script);
                    let result = callBack(res, context)
                    runtime.setContext(result.context)
                    return result
                }).catch(error => {
                    console.error(error);
                    return result
                });
            result = await response;
            logger.debug.log(result);

            runtime.setContext(result.context)
            return result.return
        }
        return await request(parameters, runtime)
    }
}


class apiGET extends ExecFunctionDefs {
    static definition='Appel d\'api GET';
    static jsonSchema = {}
    constructor () {
        super()
    }
    async execute(parameters, runtime) {
        parameters = super.execute(parameters, runtime);
        let res = {responseCode:'', responseText:'', url:'', data:{}, headers: {}}
        const request = async (parameters, runtime) => {
            let result ={return:false}
            const response = await fetch(   parameters.url,
                {
                    method:'GET'
                })
                .then(function(response) {
                    res.url = response.url
                    res.responseCode = response.status
                    res.responseText = response.statusText
                    response.headers.forEach(function(val, key) { var jsonObj = {}; jsonObj[key]=val; Object.assign(res.headers,jsonObj); });
                    return response.json(); //text();
                }).then(function(data) {
                    //logger.debug.log(data)
                    res.data = data;

                    const setContext = new Function('return ' + JSON.stringify(runtime.getContext()))
                    let context = setContext(runtime.getContext())
                    const callBack=new Function('res', 'data', 'context', parameters.script);

                    let result = callBack(res, res.data, context)

                    runtime.setContext(result.context)

                    return result;
                }).catch(error => {
                    console.error(error);
                    return result
                });
            result = await response;
//          logger.debug.log(result);
            runtime.setContext(result.context)

            return result.return
        }
        return await request(parameters, runtime)

    }
}



class apiPOST extends ExecFunctionDefs {
    static definition='Appel d\'api POST';
    static jsonSchema = {}
    constructor () {
        super()
    }
    async execute(parameters, runtime) {
        parameters = super.execute(parameters, runtime);
        logger.debug.log(this.name, 'execute', parameters);
        return parameters
    }
}

class apiObjectExists extends ExecFunctionDefs {
    static definition='Objet existe sur l\'API';
    static jsonSchema = {}
    constructor () {
        super()
    }

    async execute(parameters, runtime) {
        parameters = super.execute(parameters, runtime)
        logger.debug.log(this.name, 'execute', parameters)
        return parameters
    }
}


class script extends ExecFunctionDefs {
    static definition='Exécuter du Javascript';
    static jsonSchema = {}

    /*
    "parameters" : {
        "context":"context here : variables, ... ",
        "script":"myscript here";
    }
    */
    constructor () {
        super()
    }

    async execute(parameters, runtime) {
        parameters = super.execute(parameters, runtime);

        const setContext = new Function( 'return '+ JSON.stringify(runtime.getContext()) )
        let context = setContext(parameters.context)

        const callBack=new Function('context',  parameters.script);
        let result = callBack(context);
        logger.debug.log('SORTIE DE SCRIPT : ',result);
        runtime.setContext(result.context)
        return result.return
    }
}

apiGET.register()
sendMail.register()
apiPOST.register()
apiObjectExists.register()
script.register();
httpCode.register();
askAQuestion.register();
bootstrapAskAQuestion.register()
/* ------------------------------------------------ */
/*

var myClassName = 'script';

var myExecClass = ExecFunctionDefs.classInstanceByName(ExecFunctionDefs.listFunctionsForPropertyEditor(), myClassName);
var myClass = new myExecClass;

let parameters = {
    "parameters":JSON.stringify({"url":"http://test.test.com","monParam1":false}),
    "script":"logger.debug.log(context); context.i++;if (context.i>10) {context.stop=true;logger.debug.log('stop received')} ;return {context:context, return:true}"
}
let runtime = new Runtime()

runtime.setContext({"i":0, "stop":false})

while ((runtime.getContext().stop!==true) && (runtime.getContext().i<12)) {
    myClass.execute(parameters, runtime)
    logger.debug.log('context after:',runtime.getContext())
}
*/

/* ------------------------------------------------ */

//let context = {i:1}

/*
let monGet = new apiGET()
monGet.execute(
    {
        url:'https://apis.rfi.fr/products/get_product/rfi_getpodcast_by_nid?token_application=radiofrance&program.entrepriseId=WBMZ320541-RFI-FR-20230908&format=jsonld&limit=1&force_single_result=1',
        script:'logger.debug.log(\'toto\');logger.debug.log(\'tata\');logger.debug.log(\'pouet\',res.data);'
    }
)

 */
/*
var myClassName = 'apiGET';
let monGet = eval("new "+ myClassName)
logger.debug.log(monGet);

monGet.execute({
    url:'https://apis.rfi.fr/products/get_product/rfi_getpodcast_by_nid?token_application=radiofrance&program.entrepriseId=WBMZ320541-RFI-FR-20230908&format=jsonld&limit=1&force_single_result=1',
    script:'logger.debug.log(res);logger.debug.log(res.headers);logger.debug.log(res.statusCode);logger.debug.log(data[\'@id\']);return true'
})

 */




