webgl = (function() {
    if(!window.WebGLRenderingContext) return false
    var el = document.createElement('canvas')
    return el.getContext && el.getContext('experimental-webgl')
})()

var graph = Viva.Graph.graph()
var layout = Viva.Graph.Layout.forceDirected(graph, {
    springLength : 140,
    springCoeff : 0.0005,
    dragCoeff : 0.02,
    gravity : -1.2,
    theta : 0.8,
})
var graphics = webgl ? Viva.Graph.View.webglGraphics() : Viva.Graph.View.svgGraphics()
var renderer = Viva.Graph.View.renderer(graph, {
    container: document.getElementById('graph'),
    renderLinks: true,
    graphics: graphics,
    layout: layout,
})

if (webgl) {
    graphics.setNodeProgram(Viva.Graph.View.webglTextNodeProgram({
        background: 'transparent',
        foreground: 'black',
    }))
    graphics.node(function (node) {
        return Viva.Graph.View.webglText(node)
    })
} else {
    graphics.node(function (node) {
        return Viva.Graph.svg('text').text(node.data)
    })
}

renderer.run()

fetch('bundesgit.json', function (err, data) {
    if (err) return console.error(err)
    load(data)
    console.log("loaded.")
})


var paused = false
document.querySelector('button[name="pause"]')
.addEventListener('click', function () {
    if (paused) renderer.resume()
    else        renderer.pause()
    paused = !paused
})



chars = {}
function load(data) {
    graph.beginUpdate()
    Object.keys(data).forEach(function (key) {
        var node = data[key]
        if (!node.links.length) {return}
        graph.addNode(key, node.name)
        node.links.forEach(function (id) {
            if (graph.getNode(id)) {return}
            graph.addNode(id, data[id].name)
        })
    })
    Object.keys(data).forEach(function (key) {
        var node = data[key]
        if (!node.links.length) {return}
        node.links.forEach(function (id) {
            graph.addLink(key, id)
        })
    })
    graph.endUpdate()
}

function fetch(url, callback) {
    var xhr = new XMLHttpRequest()
    xhr.responseType = 'json'
    xhr.crossOrigin = 'anonymous'
    xhr.open('get', url, /*async*/true)
    xhr.addEventListener('load', function () {
        if (xhr.status !== 200) callback(xhr.statusText)
        else callback(null, xhr.response)
    })
    xhr.send()
}
