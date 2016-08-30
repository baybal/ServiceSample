#!/usr/bin/env node

const port = 1338;
const target = 'http://localhost:1337';
const http = require('http');
const url = require('url');
const server = http.createServer(myProxy);
const uuid = require('uuid');
const httpProxy = require('http-proxy');
var proxy = httpProxy.createProxyServer({});
const redis = require("redis");
var client = redis.createClient();
var cookie = require('cookie');
var debug = true;
var debugListeners = ['connection', 'message', 'request', 'close', 'aborted', 'abort', 'continue', 'response', 'connect'];
client.on("error", function(err) {
	console.log("Redis client error: " + err);
});
/*proxy.on('proxyReq', function(proxyReq, req, res, options) {
	client.get(cookie.parse(req.headers.cookie).sessionid, (err,value) => {
		proxyReq.setHeader('authtoken', value);
	})
	console.log('ProxyReq');
});*/
proxy.on('error', function(err, req, res) {
	res.writeHead(500, {
		'Content-Type': 'text/plain'
	});
	res.end('Something went wrong. And we are reporting a custom error message.');
});

function myProxy(req, res) {
	debug && function() {
		console.log("Request for " + req.url + " received." + '\n' + req.headers);
		debugListeners.forEach((e) => {
			res.addListener(e, () => {
				console.log(e);
			});
		});
	};
	console.log(url.parse(req.url).pathname);
	if(url.parse(req.url).pathname == '/auth') {
		console.log('Getting authpage');
		auth(req, res);
	} else if(!req.headers.cookie){
			modReq = req;
			proxy.web(modReq, res, {
				target: target
			});
	} else{
		client.get(cookie.parse(req.headers.cookie).sessionid, (err, value) => {
			err&&console.error('Redis error: ' + err);
			console.log('authtoken ' + value + '\n' + 'sessionid ' + cookie.parse(req.headers.cookie).sessionid);
			var modReq = {};
			debug&&console.log(req);
			modReq = req;
			modReq.headers.authtoken = value;
			proxy.web(modReq, res, {
				target: target
			});
			var modReq = {};
		})
	}
}

function auth(req, res) {
	var sessionid = uuid.v4();
	var options = {
		host: url.parse(target).hostname,
		path: '/token',
		port: url.parse(target).port
	};
	console.log(options);
	callback = function(beresponse) {
		var str = '';
		beresponse.on('data', function(chunk) {
			str += chunk;
		});
		beresponse.on('end', function() {
			console.log('Str: '+ str);
			client.set(sessionid, JSON.parse(str).token, redis.print);
			console.log('Response parsed. Authentication token ' + JSON.parse(str).token + ' assigned to session ' + sessionid);
			res.statusCode = 200;
			res.statusMessage = 'Session cookie generated';
			res.setHeader('Content-Type', 'application/json');
			res.setHeader('Access-Control-Allow-Origin', 'http://localhost');
			res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');			
			res.setHeader('Access-Control-Allow-Headers', 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type')
			res.setHeader('Access-Control-Allow-Credentials', 'true');
			res.setHeader('Set-Cookie', cookie.serialize('sessionid', sessionid, {
				httpOnly: false,
				maxAge: 60 * 60 * 24 * 7 // 1 week 
			}));
			res.end();
		});
	}
	http.request(options, callback).end();
}
server.listen(port);
console.log('Server running at port: ' + port);
