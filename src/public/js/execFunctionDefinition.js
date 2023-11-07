/*
  Define ExecFunction class structure
 */
let res;
class ExecFunctionDefs {
    static set = []
    constructor() {
        // glob init here
    }

    execute(parameters) {
        console.log(parameters)
        return parameters
    }

    static listFunctionsForPropertyEditor() {
        let options=['none']
        for (let i=0; i<this.set.length; i++) {
            options.push({text:this.set[i].definition, value:this.set[i].name})
        }
        console.log({options:options})
        return {options:options}
    }
    static register(){
        this.set.push(this.me())
    }

    static me() {
        return {name: this.name, definition: this.definition}
    }
}

class sendMail extends ExecFunctionDefs {
    static definition='permet d\'envoyer un mail';
    constructor () {
        super()
    }
    execute(parameters) {
        parameters = super.execute(parameters);
        console.log(this.name, 'execute', parameters);
        return parameters
    }
}

class apiGET extends ExecFunctionDefs {
    static definition='permet de faire un appel d\'api GET';
    constructor () {
        super()
    }
    execute(parameters) {
        parameters = super.execute(parameters);
//        console.log(this.name, 'execute', parameters);
      fetch(parameters.url,
            { method:'GET'
            })
            .then(function(response) {
                res = response;
                return response.text();
            }).then(function(data) {
              res.data = data
              let cb = parameters.script;
              let callBack=new Function(cb);
              callBack();
            }).catch(error => {
              console.error(error); // Example: Logging the error to the console
            });
        return parameters
    }
}

class apiPOST extends ExecFunctionDefs {
    static definition='permet de faire un appel d\'api POST';
    constructor () {
        super()
    }

    execute(parameters) {
        parameters = super.execute(parameters);
        console.log(this.name, 'execute', parameters);
        return parameters
    }

}

class apiObjectExists extends ExecFunctionDefs {
    static definition='permet vérifier qu\'un objet existe sur l\'API';
    constructor () {
        super()
    }

    execute(parameters) {
        parameters = super.execute(parameters)
        console.log(this.name, 'execute', parameters)
        return parameters
    }

}

sendMail.register()
apiPOST.register()
apiGET.register()
apiObjectExists.register()

let monGet = new apiGET()
monGet.execute(
    {
        url:'https://apis.rfi.fr/products/get_product/rfi_getpodcast_by_nid?token_application=radiofrance&program.entrepriseId=WBMZ320541-RFI-FR-20230908&format=jsonld&limit=1&force_single_result=1',
        script:'console.log(\'toto\');console.log(\'tata\');console.log(\'pouet\',res.data);'
    }
)


