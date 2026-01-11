const express = require('express');

function printRoutes(app) {
    console.log('--- Registered Routes ---');
    // Safety check: app._router might be undefined if no routes are registered yet or in certain Express versions/configurations
    if (!app._router || !app._router.stack) {
        console.log('Markdown: Unable to print routes (app._router is undefined)');
        console.log('-------------------------');
        return;
    }

    app._router.stack.forEach(print.bind(null, []));
    console.log('-------------------------');
}

function print(path, layer) {
    if (layer.route) {
        layer.route.stack.forEach(print.bind(null, path.concat(split(layer.route.path))))
    } else if (layer.name === 'router' && layer.handle.stack) {
        layer.handle.stack.forEach(print.bind(null, path.concat(split(layer.regexp))))
    } else if (layer.method) {
        console.log('%s /%s',
            layer.method.toUpperCase(),
            path.concat(split(layer.route.path)).filter(Boolean).join('/'))
    }
}

function split(thing) {
    if (typeof thing === 'string') {
        return thing.split('/')
    } else if (thing.fast_slash) {
        return ''
    } else {
        var match = thing.toString()
            .replace('\\/?', '')
            .replace('(?=\\/|$)', '')
            .match(/^\/\^((?:\\[.*+?^${}()|[\]\\\/]|[^.*+?^${}()|[\]\\\/])*)\$\//)
        return match
            ? match[1].replace(/\\(.)/g, '$1').split('/')
            : '<complex:' + thing.toString() + '>'
    }
}

module.exports = printRoutes;
