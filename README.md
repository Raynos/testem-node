# Testem node

Connect to a testem server and run the unit tests in node.js

## Example

    var testemNode = require("testem-node")

    testemNode({
        argv: {
            remain: process.cwd() + "/test"
        }
    }, {
        port: 7357
        , host: "localhost"
    })

The first argument to testemNode is options to pass to a node-tap runner. The second argument consists of the port & localhost of the testem server