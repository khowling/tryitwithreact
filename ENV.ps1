
$env:MONGO_DB = "mongodb://localhost:27017/mydb01"
$env:PORT = 3000

Set-Alias mongo "C:\Program Files\MongoDB\Server\3.0\bin\mongo"

$mongod = {& "C:\Program Files\MongoDB\Server\3.0\bin\mongod" $args}
Start-Job -scriptblock $mongod -argumentlist  "--dbpath", "c:\Users\keith\mongo_data"

$server = {& "nodemon" $args}
# Start-Job -scriptblock $server -argumentlist  "c:\Users\keith\tryitwithreact\server\main.js"

#  To see output
# 'Get-Job'
# 'Receive-Job n'
# 'Stop-Job n'
