const MAX_EXECUTION_COUNT = 20
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
        let uniqueIdentifier = [shape.name , JSON.stringify(context)]
        // abort if execution count > 200
        this.count++
        console.log(this.count, uniqueIdentifier)
        return !(this.count<MAX_EXECUTION_COUNT) || this.shapes.some(function(item) {
            return item[0]===uniqueIdentifier[0] && item[1]===uniqueIdentifier[1]
        })
    }

    addShape(shape, context) {
        this.shapes.push([shape.name , JSON.stringify(context)])
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
