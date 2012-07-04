var io = require("socket.io-client")
    , tap = require("tap")
    , extend = require("xtend")
    , Runner = tap.createRunner
    , runner
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
    }
    , defaultTapOptions = {
        version: false
        , help: false
        , timeout: 30
        , diag: process.env.TAP_DIAG
        , tap: process.env.TAP_DIAG
        , stderr: process.env.TAP_STDERR
        , cover:  "./lib"
        , "cover-dir": "./coverage"
    }

module.exports = connectToTestem

function connectToTestem(tapOptions, testemOptions) {
    testemOptions = extend({}, defaultTestemOptions, testemOptions || {})
    tapOptions = extend({}, defaultTapOptions, tapOptions || {})

    var socket = io.connect("http://" + testemOptions.host + ":" +
        testemOptions.port)
        , runTests = startTests.bind(null, tapOptions, socket)

    socket.emit("browser-login", "Node")
    socket.on("connect", runTests)
    socket.on("reconnect", runTests)
    socket.on("start-tests", runTests)
}

function startTests(tapOptions, socket) {
    socket.emit("browser-login", "Node")
    if (runner) {
        runner.removeListener("file", onFile)
        runner.removeListener("end", onEnd)
    }

    runner = new Runner(tapOptions)

    runner.on("file", onFile.bind(null, emit))

    runner.on("end", onEnd.bind(null, emit))

    function emit() {
        socket.emit.apply(socket, arguments)
    }
}

function onFile(emit, file, data, details) {
    if (first === false) {
        first = true
        emit("tests-start")
    }

    details.list.forEach(function (data) {
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
                , stacktrace: data.stack.join("\n")
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
    })
}

function onEnd(emit) {
    emit("all-test-results", results)
}