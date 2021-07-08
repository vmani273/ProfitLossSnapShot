const yargs = require('yargs');
const index = require('./index.js')


// stock name, date, time
// make demand optoin for tim in total by increment false
// day - 
yargs.command({
    command: 'total_summary',
    describe: 'List the total realized amount for all stocks',
    builder: {
        date: {
            describe: 'Desired Date',
            demandOption: true,
            type: 'string'
        },
        time: {
            describe: 'End time',
            demandOption: false,
            type: 'string'
        }
    },
    handler(argv) {
        index.total_summary(argv.date, argv.time)
    }
})


yargs.command({
    command: 'total-breakdown',
    describe: 'List the p&l through the day in 15 min increments',
    builder: {
        date: {
            describe: 'Desired Date',
            demandOption: true,
            type: 'string'
        },
        time: {
            describe: 'End time',
            demandOption: false,
            type: 'string'
        },
        increment: {
            describe: 'time increment',
            demandOption: false,
            type: 'integer'
        }
    },
    handler(argv) {
        index.total_breakdown(argv.date, argv.time, argv.increment)
    }
})


yargs.command({
    command: 'breakdown-one-stock',
    describe: 'List the p&l through the day with appropriate min increments per stock',
    builder: {
        stock: {
            describe: 'name of stock',
            demandOption: true,
            type: 'string'
        },
        date: {
            describe: 'Desired Date',
            demandOption: true,
            type: 'string'
        },
        time: {
            describe: 'End time',
            demandOption: false,
            type: 'string'
        },
        increment: {
            describe: 'time increment',
            demandOption: false,
            type: 'integer'
        }
    },
    handler(argv) {
        index.breakdown_one_stock(argv.stock, argv.date, argv.time, argv.increment)
    }
})


yargs.parse();



