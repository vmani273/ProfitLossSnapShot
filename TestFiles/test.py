stocks = ["123,APPLE","123,GOOG", "345,KOS", "345,KSF"]

dict = {}

for element in stocks:
    x  = element.split(",")
    if x[0] in dict:
        dict[x[0]] += 1
    else:
        dict[x[0]] = 1

print(dict)


highest_users = [] 
highestNum = 0;
for key, value in dict.items():
    if value > highestNum:
        highest_users = []
        highest_users.append(key)
        highestNum = value
    elif value == highestNum:
        highest_users.append(key)

print (highest_users)
    



    