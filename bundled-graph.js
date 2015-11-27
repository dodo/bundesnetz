/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/*!******************!*\
  !*** ./graph.js ***!
  \******************/
/***/ function(module, exports) {

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
	    var events = Viva.Graph.webglInputEvents(graphics, graph)
	    events.mouseDown(click)
	} else {
	    graphics.node(function (node) {
	        return Viva.Graph.svg('text').text(node.data).on('mousedown', click.bind(null, node))
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


	fulldata = {}
	function click(node) {
	    var law = fulldata[node.id]
	    var anchor = document.body.querySelector('a[target="gesetz"]')
	    anchor.href = "http://bundestag.github.io/gesetze/" + law.id.charAt(0) + "/" + law.id + "/"
	    anchor.textContent = law.title || "?"
	}

	function redirect(url) {
	    window.open(url, "gesetz")
	}

	chars = {}
	function load(data) {
	    fulldata = data
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
	    xhr.crossOrigin = 'anonymous'
	    xhr.addEventListener('load', function () {
	        if (xhr.status !== 200) callback(xhr.statusText)
	        else callback(null, JSON.parse(xhr.response))
	    })
	    xhr.open('get', url, /*async*/true)
	    xhr.send()
	}


/***/ }
/******/ ]);