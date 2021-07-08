const exec = require('child_process').exec;
const csv = require('csv-parser');
const fs = require('fs');
const date_and_time = require('date-and-time');


// dont't error out few
// in -breakdowns, check weather first argument is ticker symbol or data and call according method
// fix order bug
//fix seed function
// if increment given but time not given

// sed -i '' $'s/[^[:print:]\t]//g' 063021-cool.csv 
// dont read file every time  - create function to read the csv file


function help_menu() {
    console.log('Please use one of the following commands:')
    console.log('Summary: ./pandlss.sh -s <date> <time>')
    console.log('Breakdown: ./pandlss.sh -b <date> <time> <increment>')
    console.log('Breakdown one stock: ./pandlss.sh -b-os <stock> <date> <time> <increment>')
}

function time_validation(time) {
    let temp = time.split(':');

    let hour = temp[0]
    let min = temp[1]

    if(!(hour >= 0 && hour <= 24 && min >= 0 && min <= 60)) {
        console.log("***Invalid time!***")
        help_menu();
        process.exit(1);
    }
    // let formatted = (date_and_time.format(currentTime, 'HH:mm'));

}



const parse_txt_file = (userInputDate, callback) => {
    let results = [];


    let filePath = "/home/opc/ProfitLossSnapShot/TestFiles/" + userInputDate + ".txt";


    exec('echo google');
    fs.access(filePath, fs.F_OK, (err) => {
        if (err) {
            console.log("***Invalid date!***")
            help_menu();
            process.exit(1);
        }
    })



    let relative_path = "TestFiles/" + userInputDate + ".txt"
    // exec(' sed -i \'\'$\'s/[^[:print:]\t]//g\' ' + relative_path, (e, stdout, stderr) => { });




    fs.createReadStream(filePath)
        .pipe(
            csv(['date', 'time', 'stock', 'action', 'quantity', 'price'])
        )
        .on('data', function (dataRow) {
            results.push(dataRow);
        })
        .on('end', function () {

            callback(results);

        })


}


const main_func = (userInputDate, UserInputTime, results, callback) => {


    let stockNames = [];


    let hour;
    let minute;

    if (!UserInputTime) {
        console.log("**No time given. Defaulting to 20:00**");
        hour = 20;
        minute = 0;

    } else {
        fields = UserInputTime.split(':');
        hour = parseInt(fields[0]);
        minute = parseInt(fields[1]);
    }


    // createArrayOfObjects();

    for (var i = 0; i < results.length; i++) {

        temp = 0;

        for (var v = 0; v < stockNames.length; v++) {
            if (stockNames[v].name == results[i].stock) {
                temp = 1;

            }
        }

        if (temp == 0) {
            const newObject = { name: results[i].stock, positionHeld: 0, totalProfitLossPerStock: 0, soldTotal: 0, boughtTotal: 0, modified: 'no' }
            stockNames.push(newObject);
        }
    }

    // checking if rows in csv file are in order.
    if (!((results[0].date.includes('/')) && (results[0].time.includes(':')) && (!results[0].stock.includes(':') && !results[0].stock.includes('/') && !results[0].stock.includes('.')) && (results[0].action.includes('B') || results[0].action.includes('S')) && (results[0].price.includes('.')))) {
        console.log("Input file not valid. Please double check the order and/or content of the file")
        process.exit(1);
    }


    profitLossLogic(hour, minute, results, stockNames, (data) => {

        callback(UserInputTime, data);

    })



}







const profitLossLogic = (hour, minute, results, stockNames, callback) => {

    let lineNum = 0;


    while (true) {
        var time = results[lineNum].time;
        var timeSplits = time.split(':');

        var currentHour = parseInt(timeSplits[0]);
        var currentMinute = parseInt(timeSplits[1]);

        if (currentHour > hour) {
            callback(stockNames);
            break;
        }

        if (currentHour == hour && currentMinute >= minute) {
            callback(stockNames);
            break;
        }


        var stockIndex;

        for (var i = 0; i < stockNames.length; i++) {
            if (stockNames[i].name == results[lineNum].stock) {
                stockIndex = i;
            }
        }

        stockNames[stockIndex].modified = 'yes';


        if (results[lineNum].action == 'B') {
            // console.log("goes here")
            // console.log(results[lineNum].quantity);
            stockNames[stockIndex].boughtTotal += parseFloat(results[lineNum].price) * parseFloat(results[lineNum].quantity);
            stockNames[stockIndex].positionHeld += parseInt(results[lineNum].quantity);

        }
        if (results[lineNum].action == 'S') {
            stockNames[stockIndex].soldTotal += parseFloat(results[lineNum].price) * parseFloat(results[lineNum].quantity);
            stockNames[stockIndex].positionHeld -= parseInt(results[lineNum].quantity);

        }

        if (stockNames[stockIndex].positionHeld == 0) {
            let netProfit = stockNames[stockIndex].soldTotal - stockNames[stockIndex].boughtTotal;
            stockNames[stockIndex].totalProfitLossPerStock += netProfit;
            // console.log("sold total: " + stockNames[stockIndex].soldTotal + " - bought total: " + stockNames[stockIndex].boughtTotal + " = Net Profit " + netProfit);
            // console.log("Total Profit Loss " + stockNames[stockIndex].totalProfitLossPerStock);
            stockNames[stockIndex].soldTotal = 0;
            stockNames[stockIndex].boughtTotal = 0;

        }


        if (lineNum === results.length - 1) {
            // console.log(results[0]);
            // console.log(results.length);


            callback(stockNames);
            // console.log(stockNames)
            // console.log(lineNum, results.length - 1)
            break;
        }

        lineNum++;

    }




}



const total_summary = (date, time) => {

    if(time) {
        time_validation(time);
    }

    let totalProfitLoss = 0;

    parse_txt_file(date, (results) => {

        main_func(date, time, results, (UserInputTime, stockNames) => {

            console.log("Stock  Realized:");
            for (var i = 0; i < stockNames.length; i++) {

                if (stockNames[i].modified == 'yes') {

                    if (stockNames[i].positionHeld > 0) {

                        if (stockNames[i].totalProfitLossPerStock < 0) {
                            console.log(stockNames[i].name + " $(" + (Math.round(stockNames[i].totalProfitLossPerStock * 100) / 100) * -1 + ") " + stockNames[i].positionHeld + " shares are being held");
                        } else {
                            console.log(stockNames[i].name + " $" + Math.round(stockNames[i].totalProfitLossPerStock * 100) / 100 + " " + stockNames[i].positionHeld + " shares are being held");
                        }

                    } else {


                        if (stockNames[i].totalProfitLossPerStock < 0) {
                            console.log(stockNames[i].name + " $(" + (Math.round(stockNames[i].totalProfitLossPerStock * 100) / 100) * -1 + ")");
                        } else {
                            console.log(stockNames[i].name + " $" + Math.round(stockNames[i].totalProfitLossPerStock * 100) / 100);
                        }

                    }

                    totalProfitLoss += stockNames[i].totalProfitLossPerStock;

                }
            }

            if (totalProfitLoss >= 0) {
                console.log("Total $" + (Math.round(totalProfitLoss * 100) / 100));
            } else {
                console.log("Total $(" + (Math.round(totalProfitLoss * 100) / 100) * -1 + ")");
            }




        })

    })




}



const total_breakdown = async (date, time, increment) => {

    if(time) {
        if(time.includes(":")) {
            time_validation(time);
        } else {
            increment = time;
            time = ""
        }
        
    }
    

    parse_txt_file(date, async (results) => {


        let currentTime = new Date(2017, 0, 2, 7, 0);
        let formatted = (date_and_time.format(currentTime, 'HH:mm'));

        // making increment optional
        if (increment == 0) {
            console.log("**No increment given. Defaulting to 15 minute increments**")
            increment = 15;
        }

        //making time optional
        let finalHour;
        let finalMinute;


        if (!time) {
            console.log("**No time given. Defaulting to 20:00**");
            finalHour = 20;
            finalMinute = 0;
        } else {
            var finaltimeSplits = time.split(':')
            finalHour = parseInt(finaltimeSplits[0]);
            finalMinute = parseInt(finaltimeSplits[1]);
        }


        console.log("Total Stock Realized in " + increment + " Minute Increments:");



        while (true) {



            var currenttimeSplits = formatted.split(':');
            var currentHour = parseInt(currenttimeSplits[0]);
            var currentMinute = parseInt(currenttimeSplits[1]);





            if (currentHour > finalHour) {
                break;
            }

            if (currentHour == finalHour && currentMinute >= finalMinute) {
                break;
            }

            var self = this;


            await main_func(date, formatted, results, (formatted_input_time, names_of_stocks) => {

                // console.log(this.formatted)

                let totalProfitLoss = 0;


                for (var i = 0; i < names_of_stocks.length; i++) {
                    if (names_of_stocks[i].modified === 'yes') {

                        // console.log(names_of_stocks[i].totalProfitLossPerStock + "+");

                        totalProfitLoss += names_of_stocks[i].totalProfitLossPerStock;
                    }
                }


                if (totalProfitLoss >= 0) {
                    console.log(formatted_input_time + " - $" + (Math.round(totalProfitLoss * 100) / 100));
                } else {
                    console.log(formatted_input_time + " - $(" + (Math.round(totalProfitLoss * 100) / 100) * -1 + ")");
                }
                // console.log(self.formatted);

            });

            currentTime = date_and_time.addMinutes(currentTime, increment);
            formatted = (date_and_time.format(currentTime, 'HH:mm'));





        }


    });





}


const breakdown_one_stock = async (stock, date, time, increment) => {


    if(time) {
        if(time.includes(":")) {
            time_validation(time);
        } else {
            increment = time;
            time = ""
        }
        
    }
    
    parse_txt_file(date, async (results) => {

        stock = stock.toUpperCase();

        let currentTime = new Date(2017, 0, 2, 7, 0);
        let formatted = (date_and_time.format(currentTime, 'HH:mm'));

        // making increment optional
        if (increment == 0) {
            console.log("**No increment given. Defaulting to 15 minute increments**")
            increment = 15
        }

        //making time optional
        let finalHour;
        let finalMinute;


        if (!time) {
            console.log("**No time given. Defaulting to 20:00**");
            finalHour = 20;
            finalMinute = 0;
        } else {
            var finaltimeSplits = time.split(':')
            finalHour = parseInt(finaltimeSplits[0]);
            finalMinute = parseInt(finaltimeSplits[1]);
        }


        console.log(stock + " Realized in " + increment + " Minute Increments:");




        while (true) {



            var currenttimeSplits = formatted.split(':');
            var currentHour = parseInt(currenttimeSplits[0]);
            var currentMinute = parseInt(currenttimeSplits[1]);

        
            if (currentHour > finalHour) {
                break;
            }

            if (currentHour == finalHour && currentMinute >= finalMinute) {
                break;
            }


            await main_func(date, formatted, results, (formatted_input_time, stockNames) => {


                let index = -1;
                for (var i = 0; i < stockNames.length; i++) {
                    if (stockNames[i].name === stock) {
                        index = i;
                    }
                }

                if (index === -1) {
                    console.log("Invalid stock name, please try again")
                    process.exit(1);
                }



                if (stockNames[index].totalProfitLossPerStock < 0) {
                    console.log(formatted_input_time + " - $(" + (Math.round(stockNames[index].totalProfitLossPerStock * 100) / 100) * -1 + ")");
                } else {
                    console.log(formatted_input_time + " - $" + Math.round(stockNames[index].totalProfitLossPerStock * 100) / 100);
                }






            });


            // console.log("google");
            currentTime = date_and_time.addMinutes(currentTime, increment);
            formatted = (date_and_time.format(currentTime, 'HH:mm'));



        }


    });






}


module.exports = {
    total_summary: total_summary,
    total_breakdown: total_breakdown,
    breakdown_one_stock: breakdown_one_stock
}







