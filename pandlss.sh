
# node index.js $date $time

if [[ $1 = "total-summary" ]]
then
    node app.js total_summary --date=$2 --time=$3
elif [[ $1 = "total-breakdown" ]]
then
    node app.js total-breakdown --date=$2 --time=$3 --increment=$4
elif [[ $1 = "breakdown-one-stock" ]]
then
    node app.js breakdown-one-stock --stock=$2 --date=$3 --time=$4 --increment=$5
else
    echo Please use one of the following commands:
    echo    ./pandlss.sh total_summary \<date\> \<time\>
    echo    ./pandlss.sh total-breakdown \<date\> \<time\> \<increment\>
fi


# ./pandlss.sh total-summary date time 
# ./pandlss.sh total-breakdown date time increment
# ./pandlss.sh stock-breakdown date time increment
# else invalid input type




