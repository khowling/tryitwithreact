
$env:MONGO_DB = "mongodb://localhost:27017/mydb01"
$env:PORT = 3000

##$mongod = '"c:\Program Files\MongoDB 2.6 Standard\bin\mongod" "--dbpath" ".\mongo_data"'
## iex "& $mongod"

Set-Alias mongo "C:\Program Files\MongoDB 2.6 Standard\bin\mongo"


$mongod = {& "c:\Program Files\MongoDB 2.6 Standard\bin\mongod" $args}
Start-Job -scriptblock $mongod -argumentlist  "--dbpath", "c:\Users\keith\mongo_data"

$server = {& "nodemon" $args}
# Start-Job -scriptblock $server -argumentlist  "c:\Users\keith\tryitwithreact\server\main.js"

#  To see output
# 'Get-Job'
# 'Receive-Job n'
# 'Stop-Job n'
