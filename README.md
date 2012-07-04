# Testem node

Connect to a testem server and run the unit tests in node.js

## Example

    var testemNode = require("testem-node")

    testemNode({
        port: 7357
        , host: "localhost"
    }, {
        argv: {
            remain: process.cwd() + "/test"
        }
    })

The first argument to testemNode consist of the port & localhost of the testem server. The second argument is options to pass to a node-tap runner.