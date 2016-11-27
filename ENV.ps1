
$env:MONGO_DB = "mongodb://localhost:27017/mydb01"
#$env:MONGO_DB = "mongodb://mcatdb-dev:EzBmSYKuuroV3HruytF6eOfFpW6knnTihwgCQnAVBwQuVK6R2eehO2MMG8NlY8tA9iitlhHcNGio4y9WElgZMQ==@mcatdb-dev.documents.azure.com:10250/?ssl=true"
$env:PORT = 3000

Set-Alias mongo "C:\Program Files\MongoDB\Server\3.2\bin\mongo"

$mongod = {& "C:\Program Files\MongoDB\Server\3.2\bin\mongod" $args}
Start-Job -scriptblock $mongod -argumentlist  "--dbpath", "c:\Users\kehowli\mongo_data"

#$server = {& "nodemon" $args}
#Start-Job -scriptblock $server -argumentlist  "c:\Users\keith\tryitwithreact\server\main.js"

#  To see output
# 'Get-Job'
# 'Receive-Job n'
# 'Stop-Job n'
