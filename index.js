var fs = require('fs')
var path = require('path')
var async = require('async')
var elasticsearch = require('elasticsearch')


var lawIndex = {}
var config = require('./config')
var client = new elasticsearch.Client(config.elasticsearch)


async.waterfall([
    // get all
    function (callback) {
        client.search({
            index: config.index,
            size: 10000,
            body: {
                query: {
                    match_all: {},
                },
                fields: ["slug","origslug","jurabk"],
            },
        }, function (err, res) {
            if (err) return callback(err)
            callback(err, res.hits.hits)
        })
    },
    // try to find each law in every other law
    function (hits, callback) {
        async.eachSeries(hits, function (hit, callback) {
            index({
                slug:     hit.fields.slug[0],
                jurabk:   hit.fields.jurabk[0],
                origslug: hit.fields.origslug[0],
            }, callback)
        }, callback)
    },
    // save index as file
    function (callback) {
        console.log("* save index …")
        fs.writeFile(
            config.index + '.json',
            JSON.stringify(lawIndex, null, 2),
            callback)
    },
], function (err) {
    if (err) return console.error("FAIL", err.stack || err.message || err)
    console.log('done.')
})


function index(law, callback) {
    console.log("* index", law.slug)
    async.series([
        // search for law in all other ones
        function (callback) {
            client.search({
                index: config.index,
                size: 1000,
                body: {
                    query: {
                        match: {
                            content: {
                                query: law.jurabk,
                                type: 'phrase',
                            },
                        },
                    },
                },
            }, function (err, res) {
                if (err) return callback(err)
                var ids = res.hits.hits.map(function (hit) {
                    return hit._id
                }).filter(function (id) {return id !== law.origslug})
                if (ids.length) lawIndex[law.origslug] = ids
                callback()
            })
        },
        // done
    ], callback)
}
