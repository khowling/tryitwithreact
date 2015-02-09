
Directory Structure

server :
    holds the express server and the API implementation
src:
    the core of the app and everything in there can be rendered on the server or the client
static/js:
    folder holds the client-side bootstrapping code

All of the database methods are implemented in the server-side api.js

Both sides pull in the src directory with relative imports, like require('../src/routes').
The components within src each fetch the data they need, but this needs to work on the client and the server
