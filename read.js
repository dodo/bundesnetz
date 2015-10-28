var fs = require('fs')
var path = require('path')
var glob =  require('glob')
var async = require('async')
var BufferStream = require('bufferstream')
var elasticsearch = require('elasticsearch')


var config = require('./config')
var client = new elasticsearch.Client(config.elasticsearch)


async.waterfall([
    // clear index
    function (callback) {
        client.indices.exists({index:config.index}, function (err, exists) {
            if (err) return callback(err)
            if (!exists) return callback()
            client.indices.delete({index:config.index}, function (err) {
                callback(err)
            })
        })
    },
    // create index
    function (callback) {
        client.indices.create({index:config.index}, function (err) {
            callback(err)
        })
    },
    // glob all index.md
    function (callback) {
//         glob('1/*/index.md', {cwd:config.cwd}, callback)
        glob('**/index.md', {cwd:config.cwd}, callback)
    },
    // read files
    function (files, callback) {
        async.mapSeries(files, function (filename, callback) {
            read(filename, function (err, file) {
                if (file) console.log(file.slug, file.Title)
                callback(err, file)
            })
        }, callback)
    },
    // done
], function (err) {
    if (err) return console.error("FAIL", err.stack || err.message || err)
    console.log('done.')
})



function read(filename, callback) {
    console.log("* read", filename)
    async.waterfall([
        // read file
        function (callback) {
            var error, file = {header:[], content:""}, lines = 0
            var stream = new BufferStream({size:'flexible'})
            stream.split('\n')
            stream.on('split', function (chunk, token) {
                if (error) return
                var line = chunk.toString('utf8')
                if (lines >= 2) {
                    file.content += line + token
                } else if (line.substr(0,3) === '---') {
                    lines++
                    if (lines < 2) file.header.push(line)
                } else if (lines) {
                    file.header.push(line)
                }
            })
            stream.on('error', function (err) {error = err})
            stream.on('end', function () {
                callback(error, file)
            })
            fs.createReadStream(path.join(config.cwd, filename)).pipe(stream)
        },
        // parse header
        function (file, callback) {
            var key
            file.header.forEach(function (line) {
                if (/^\w+:/.test(line)) {
                    if (key) file[key] = file[key].trim()
                    key = line.match(/^(\w+):/)[1]
                    file[key] = line.substr(key.length + 1).trim()
                } else if (key) {
                    file[key] += " " + line.trim()
                }
            })
            if (key) file[key] = file[key].trim()
            delete file.header
            callback(null, file)
        },
        // save into elasticsearch
        function (file, callback) {
            client.create({
                index: config.index,
                type: "gesetz",
                id: file.origslug || file.slug,
                body: file,
            }, function (err) {
                callback(err)
            })
        },
        // done
    ], callback)
}




