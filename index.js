const exec = require('child_process').exec;
const csv = require('csv-parser');
const fs = require('fs');
const date_and_time = require('date-and-time');




let results = [];
let stockNames = new Array();
let lineNum = 0;
let totalProfitLoss = 0;

// line num start from last line vs first line
// sed -i '' $'s/[^[:print:]\t]//g' 063021-cool.csv 
// default for increment
//fix seed function


const main_func = (userInputDate, UserInputTime, callback) => {



    let filePath = "/home/opc/ProfitLossSnapShot/TestFiles/" + userInputDate + ".txt";


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


            createArrayOfObjects();

            // wskskchecking if rows in csv file are in order.
            if (!((results[0].date.includes('/')) && (results[0].time.includes(':')) && (!results[0].stock.includes(':') && !results[0].stock.includes('/') && !results[0].stock.includes('.')) && (results[0].action.includes('B') || results[0].action.includes('S')) && (results[0].price.includes('.')))) {
                console.log("Input file not valid. Please double check the order and/or content of the file")
                process.exit(1);
            }


            profitLossLogic(hour, minute, (data) => {

                callback(UserInputTime, stockNames);

            })



        })

}







const profitLossLogic = (hour, minute, callback) => {


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


const createArrayOfObjects = () => {
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

}



const total_summary = (date, time) => {

    main_func(date, time, () => {

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


}



const total_breakdown = (date, time, increment) => {


    
    let currentTime = new Date(2017, 0, 2, 8, 0);   
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


   
    while(true) {

        

        var currenttimeSplits = formatted.split(':');
        var currentHour = parseInt(currenttimeSplits[0]);
        var currentMinute = parseInt(currenttimeSplits[1]);
        

        
        
        
        if (currentHour > finalHour) {
            break;
        }

        if (currentHour == finalHour && currentMinute >= finalMinute) {
            break;
        }

       
        main_func(date, formatted, (formatted_input_time, names_of_stocks) => {

            // console.log(this.formatted)


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


            
                
            

        });
        
        currentTime = date_and_time.addMinutes(currentTime, increment);
        formatted = (date_and_time.format(currentTime, 'HH:mm'));

        

       

    }

    
    

}


const breakdown_one_stock = (stock, date, time, increment) => {
    stock = stock.toUpperCase();

    let currentTime = new Date(2017, 0, 2, 8, 0);   
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

    
        
   
    while(true) {

        

        var currenttimeSplits = formatted.split(':');
        var currentHour = parseInt(currenttimeSplits[0]);
        var currentMinute = parseInt(currenttimeSplits[1]);
        
        
        if (currentHour > finalHour) {
            break;
        }

        if (currentHour == finalHour && currentMinute >= finalMinute) {
            break;
        }

        
        main_func(date, formatted, (formatted_input_time) => {

            
            let index = -1;
            for (var i = 0; i < stockNames.length; i++) {
                if (stockNames[i].name === stock) {
                    index = i;
                }              
            }

            if(index === -1) {
                console.log("Invalid stock name, please try again")
                process.exit(1);
            }
    

            if (stockNames[index].positionHeld > 0) {

                if (stockNames[index].totalProfitLossPerStock < 0) {
                    console.log(formatted_input_time + " - $(" + (Math.round(stockNames[index].totalProfitLossPerStock * 100) / 100) * -1 + ") " + stockNames[index].positionHeld + " shares are being held");
                } else {
                    console.log(formatted_input_time + " - $" + Math.round(stockNames[index].totalProfitLossPerStock * 100) / 100 + " " + stockNames[index].positionHeld + " shares are being held");
                }

            } else {


                if (stockNames[index].totalProfitLossPerStock < 0) {
                    console.log(formatted_input_time + " - $(" + (Math.round(stockNames[index].totalProfitLossPerStock * 100) / 100) * -1 + ")");
                } else {
                    console.log(formatted_input_time + " - $" + Math.round(stockNames[index].totalProfitLossPerStock * 100) / 100);
                }

            }




        });

        currentTime = date_and_time.addMinutes(currentTime, increment);
        formatted = (date_and_time.format(currentTime, 'HH:mm'));



    }
    


}


module.exports = {
    total_summary: total_summary,
    total_breakdown: total_breakdown,
    breakdown_one_stock: breakdown_one_stock
}







