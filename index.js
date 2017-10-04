var https = require('https');
var fs = require('fs');
var request = require('request');
var shell = require('shelljs');

var express = require('express');
var app = require('express')();

// needed for dev 
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var options = {
	key: fs.readFileSync('ssl/server.key'),
	cert: fs.readFileSync('ssl/server.crt')
};
////


var server = https.createServer(options, app)
var io = require('socket.io')(server);


// listen on 8080
server.listen(443, function(){
	console.log('listening on *:443');
});

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/app.js', function(req, res){
  res.sendFile(__dirname + '/app.js');
});
app.get('/tone.js', function(req, res){
  res.sendFile(__dirname + '/tone.js');
});

// app.use(express.static(''));
app.use(express.static('sounds'));

// Authenticate users based on a socket-[user_id] token
io.use(function(socket, next){
	return next();
});

// SocketIO connections
io.on('connection', function(socket){

	socket.on('DrumUpdate', function(data) {
		drums = data;
		io.emit('DrumUpdate', drums);
	});

	socket.on('BassUpdate', function(data) {
		bass = data;
		io.emit('BassUpdate', bass);
	});

	socket.on('SynthUpdate', function(data) {
		synth = data;
		io.emit('SynthUpdate', synth);
	});

});