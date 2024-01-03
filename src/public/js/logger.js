

const FG = {
    BLACK: '\x1b[30m',
    RED: '\x1b[31m',
    GREEN: '\x1b[32m',
    YELLOW: '\x1b[33m',
    BLUE: '\x1b[34m',
    MAGENTA: '\x1b[35m',
    CYAN: '\x1b[36m',
    WHITE: '\x1b[37m',
    ORANGE: '\x1b[38;2;255;153;00m',
    BRIGHTBLACK: '\x1b[90m',
    BRIGHTRED: '\x1b[91m',
    BRIGHTGREEN: '\x1b[92m',
    BRIGHTYELLOW: '\x1b[93m',
    BRIGHTBLUE: '\x1b[94m',
    BRIGHTMAGENTA: '\x1b[95m',
    BRIGHTCYAN: '\x1b[96m',
    BRIGHTWHITE: '\x1b[97m'
}
const BG = {
    BLACK: '\x1b[40m',
    RED: '\x1b[41m',
    GREEN: '\x1b[42m',
    YELLOW: '\x1b[43m',
    BLUE: '\x1b[44m',
    MAGENTA: '\x1b[45m',
    CYAN: '\x1b[46m',
    WHITE: '\x1b[47m',
    ORANGE: '\x1b[48;2;255;153;00m',
    BRIGHTBLACK: '\x1b[100m',
    BRIGHTRED: '\x1b[101m',
    BRIGHTGREEN: '\x1b[102m',
    BRIGHTYELLOW: '\x1b[103m',
    BRIGHTBLUE: '\x1b[104m',
    BRIGHTMAGENTA: '\x1b[105m',
    BRIGHTCYAN: '\x1b[106m',
    BRIGHTWHITE: '\x1b[107m'
}

const GRAPH = {
    BOLD: '\x1b[1m',
    DIM: '\x1b[2m',
    ITALIC: '\x1b[3m',
    UNDERLINE: '\x1b[4m',
    BLINKING: '\x1b[5m',
    INVERSE: '\x1b[7m',
    HIDDEN: '\x1b[8m',
    STRIKETHROUGH: '\x1b[9m'
}

const LOG_LEVELS = {
    WARN : 4,
    DEBUG : 3,
    VERBOSE : 2,
    PROD : 1,
    NO_LOGS : 0
}

const global_logLevel = LOG_LEVELS.WARN;

class Logger {
    constructor(logLevel) {
        this.setDebugger(logLevel)
    }

    setDebugger(logLevel) {

        // define debug object binding console functions
        switch(logLevel) {
            case LOG_LEVELS.NO_LOGS:
                this.debug = {
                    log:   ()=>{},
                    error: ()=>{},
                    info:  ()=>{},
                    warn:  ()=>{}
                }
                break
            case LOG_LEVELS.PROD :
                this.debug = {
                    error: window.console.error.bind(window.console, BG.RED + FG.WHITE+'\t%o'),
                    log:   ()=>{},
                    info:  window.console.info.bind(window.console, BG.BRIGHTBLUE+ FG.WHITE+'\t%o'), // ()=>{},
                    warn:  ()=>{}
                }
                break
            case LOG_LEVELS.WARN :
                this.debug = {
                    warn:  window.console.warn.bind(window.console, GRAPH.ITALIC + FG.BLACK + BG.ORANGE+'\t%o'),
                    error: window.console.error.bind(window.console, BG.RED + FG.WHITE+'\t%o'),
                    info:  window.console.info.bind(window.console, BG.BRIGHTBLUE+ FG.WHITE+'\t%o'),
                    log:   window.console.log.bind(window.console, BG.GREEN+ '\t%o',),
                }
                break
            case LOG_LEVELS.VERBOSE :
                this.debug = {
                    log:   ()=>{},
                    error: window.console.error.bind(window.console, BG.RED + FG.WHITE+'\t%o'),
                    info:  window.console.info.bind(window.console, BG.BRIGHTBLUE+ FG.WHITE+'\t%o'),
                    warn:  ()=>{}
                }
                break
            case LOG_LEVELS.DEBUG :
                this.debug = {
                    error: window.console.error.bind(window.console, BG.RED + FG.WHITE+'\t%o'),
                    info:  window.console.info.bind(window.console, BG.BRIGHTBLUE+ FG.WHITE+'\t%o'),
                    log:   window.console.log.bind(window.console, BG.GREEN+ '\t%o',),
                    warn:  ()=>{}
                }
                break

        }
    }
}

logger = new Logger(global_logLevel)

