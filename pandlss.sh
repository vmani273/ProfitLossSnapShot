
# node index.js $date $time

if [[ $1 = "-s" ]]
then
    node app.js summary --date=$2 --time=$3
elif [[ $1 = "-b" ]]
then
    node app.js breakdown --date=$2 --time=$3 --increment=$4
elif [[ $1 = "-b-os" ]]
then
    node app.js breakdown-one-stock --stock=$2 --date=$3 --time=$4 --increment=$5
else
    echo Please use one of the following commands:
    echo Summary:             ./pandlss.sh -s \<date\> \<time\>  
    echo Breakdown:           ./pandlss.sh -b \<date\> \<time\> \<increment\>
    echo Breakdown one stock: ./pandlss.sh -b-os \<stock\> \<date\> \<time\> \<increment\>
fi


# ./pandlss.sh total-summary date time 
# ./pandlss.sh total-breakdown date time increment
# ./pandlss.sh stock-breakdown date time increment
# else invalid input type




