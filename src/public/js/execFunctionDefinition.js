/*
  Define ExecFunction class structure
 */
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
        console.log(this.name, 'execute', parameters);
        fetch('http://postman-echo.com/get',
            { method:'GET', mode:'no-cors',
            headers:{'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Headers': '*'}
            })
            .then(response => {
                console.log(response)
                if (response.ok) {
                    return Object.assign(parameters,response.json())
                } else {
                    throw new Error('API request failed');
                }
            })
            .then(data => {
                // Process the response data here
                console.log(data); // Example: Logging the data to the console
            })
            .catch(error => {
                // Handle any errors here
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
monGet.execute()


