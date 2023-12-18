const MAX_EXECUTION_COUNT = 20
const MAX_SAME_EXECUTION_COUNT = 5

class Runtime {
    constructor() {
        this.context = {}
        this.stacktrace = []
        this.shapes = []
        this.count=0
    }

    init() {
        this.context = {}
        this.stacktrace = []
        this.shapes = []
        this.count=0
    }

    start() {
        this.init()
    }

    alreadyRunThis(shape, context) {
        let uniqueIdentifier = [shape.name , JSON.stringify(context), 0]
        // abort if execution count > 200
        this.count++
        console.log(this.count, uniqueIdentifier)

        // TODO faire un bouton d'interruption de run

        let alreadyRunThisItem = this.shapes.filter((item) => item[0]===uniqueIdentifier[0] && item[1]===uniqueIdentifier[1])
        if (alreadyRunThisItem.length>0) {
            alreadyRunThisItem[0][2]++
        } else
            this.addShape(uniqueIdentifier)

        console.log(this.shapes);
        return (this.count>MAX_EXECUTION_COUNT) ||
               ((alreadyRunThisItem.length>0) && alreadyRunThisItem[0][2]>=MAX_SAME_EXECUTION_COUNT)

    }

    addShape(uniqueIdentifier) {
        this.shapes.push(uniqueIdentifier)
    }

    addTrace(trace) {
        this.stacktrace.push(trace)
    }

    getTrace() {
        return this.stacktrace
    }
    printTrace() {
        console.log(this.stacktrace)
    }

    printLastTrace() {
        console.log(this.stacktrace.length>0 ? this.stacktrace[this.stacktrace.length-1] : 'no trace to print')
    }

    setContext(context) {
        this.context = context
    }

    getContext() {
        return this.context
    }
}
