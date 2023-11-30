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
            options.push({text:this.set[i].definition, value:this.set[i].name, class:this.set[i].registeredClass})
        }
        return options
    }
    static register(){
        this.set.push(this.me(this))
    }

    static me(classToRegister) {
        return {name: this.name, definition: this.definition, registeredClass:classToRegister}
    }
}

class sendMail extends ExecFunctionDefs {
    static definition='permet d\'envoyer un mail';
    constructor () {
        super()
    }
    async execute(parameters, runtime) {
        parameters = super.execute(parameters, runtime);
        console.log(this.name, 'execute', parameters);
        /*
                parameters.body = 'monbody'
                parameters.subject = 'testMail'
                console.log(parameters)
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
                        console.log("mail sent successfully")
                    }
                );
                */

        return parameters
    }
}

class httpCode extends ExecFunctionDefs {
    static definition='permet d\'avoir un code retour HTTP d\'un GET';
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
                    return res.responseCode
                }).catch(error => {
                    console.error(error);
                    return result
                });
            result = await response;
            console.log(result);
            return result
        }
        return await request(parameters, runtime)

    }
}


class apiGET extends ExecFunctionDefs {
    static definition='permet de faire un appel d\'api GET';
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
                    //console.log(data)
                    res.data = data;
                    const callBack=new Function('res', 'data', parameters.script);
                    return callBack(res, res.data).return;
                }).catch(error => {
                    console.error(error);
                    return result
                });
            result = await response;
//          console.log(result);
            return result
        }
        return await request(parameters, runtime)

    }
}



class apiPOST extends ExecFunctionDefs {
    static definition='permet de faire un appel d\'api POST';
    constructor () {
        super()
    }
    async execute(parameters, runtime) {
        parameters = super.execute(parameters, runtime);
        console.log(this.name, 'execute', parameters);
        return parameters
    }
}

class apiObjectExists extends ExecFunctionDefs {
    static definition='permet vérifier qu\'un objet existe sur l\'API';
    constructor () {
        super()
    }

    async execute(parameters, runtime) {
        parameters = super.execute(parameters, runtime)
        console.log(this.name, 'execute', parameters)
        return parameters
    }
}


class script extends ExecFunctionDefs {
    static definition='permet d\'exécuter du Javascript';

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
        console.log('SORTIE DE SCRIPT : ',result);
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

/* ------------------------------------------------ */
/*

var myClassName = 'script';

var myExecClass = ExecFunctionDefs.classInstanceByName(ExecFunctionDefs.listFunctionsForPropertyEditor(), myClassName);
var myClass = new myExecClass;

let parameters = {
    "parameters":JSON.stringify({"url":"http://test.test.com","monParam1":false}),
    "script":"console.log(context); context.i++;if (context.i>10) {context.stop=true;console.log('stop received')} ;return {context:context, return:true}"
}
let runtime = new Runtime()

runtime.setContext({"i":0, "stop":false})

while ((runtime.getContext().stop!==true) && (runtime.getContext().i<12)) {
    myClass.execute(parameters, runtime)
    console.log('context after:',runtime.getContext())
}
*/

/* ------------------------------------------------ */

//let context = {i:1}

/*
let monGet = new apiGET()
monGet.execute(
    {
        url:'https://apis.rfi.fr/products/get_product/rfi_getpodcast_by_nid?token_application=radiofrance&program.entrepriseId=WBMZ320541-RFI-FR-20230908&format=jsonld&limit=1&force_single_result=1',
        script:'console.log(\'toto\');console.log(\'tata\');console.log(\'pouet\',res.data);'
    }
)

 */
/*
var myClassName = 'apiGET';
let monGet = eval("new "+ myClassName)
console.log(monGet);

monGet.execute({
    url:'https://apis.rfi.fr/products/get_product/rfi_getpodcast_by_nid?token_application=radiofrance&program.entrepriseId=WBMZ320541-RFI-FR-20230908&format=jsonld&limit=1&force_single_result=1',
    script:'console.log(res);console.log(res.headers);console.log(res.statusCode);console.log(data[\'@id\']);return true'
})

 */




