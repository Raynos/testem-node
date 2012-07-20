var io = require("socket.io-client")
    , tap = require("tap")
    , extend = require("xtend")
    , Consumer = tap.Consumer
    , spawn = require("child_process").spawn
    , consumer
    , first = false
    , results = {
        failed: 0
        , passed: 0
        , total: 0
        , tests: []
    }
    , defaultTestemOptions = {
        port: 7357
        , host: "localhost"
        , command: "node"
        , args: []
    }
    , es = require("event-stream")

module.exports = connectToTestem

function connectToTestem(testemOptions) {
    var stream = es.through(function (data) {
        this.emit("data", data)
    }, noop)

    testemOptions = extend({}, defaultTestemOptions, testemOptions || {})

    var socket = io.connect("http://" + testemOptions.host + ":" +
        testemOptions.port)

    emit("browser-login", "Node")
    socket.on("connect", startTests)
    socket.on("reconnect", startTests)
    socket.on("start-tests", startTests)

    return stream

    function startTests() {
        emit("browser-login", "Node")
        stream.write("login again")
        if (consumer) {
            consumer.removeListener("data", onData)
            consumer.removeListener("end", onEnd)
        }

        consumer = new Consumer()

        consumer.on("data", onData)

        consumer.on("end", onEnd)

        var child = spawn(testemOptions.command, testemOptions.args)
        child.stdout.pipe(consumer)
        child.stderr.on("data", function (data) {
            stream.write(data)
        })
    }

    function emit() {
        socket.emit.apply(socket, arguments)
    }

    function onData(data) {
        if (first === false) {
            first = true
            emit("tests-start")
        }

        if (data.id === undefined) {
            return
        }

        var tst = {
            passed: 0
            , failed: 0
            , total: 1
            , id: data.id
            , name: data.name
            , items: []
        }

        if (!data.ok) {
            tst.items.push({
                passed: false
                , message: data.name
                , stacktrace: data.stack && data.stack.join("\n")
            })
            results.failed++
            tst.failed++
        } else {
            results.passed++
            tst.passed++
        }

        results.total++
        results.tests.push(tst)

        emit("test-result", tst)
    }

    function onEnd(err, count, passed) {
        emit("all-test-results", results)
    }
}

function noop() {}