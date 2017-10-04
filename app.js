angular.module('WebDisco', []
	).factory('socket', function($rootScope) {
	// Open a WebSocket connection

	socket = io();

	return {
		on: function (eventName, callback) {
			socket.on(eventName, function (data) {  
				var args = arguments;
				$rootScope.$apply(function () {
					callback.apply(socket, args);
				});
			});
		},
		emit: function (eventName, data, callback) {
			socket.emit(eventName, data, function () {
				var args = arguments;
				$rootScope.$apply(function () {
					if (callback) {
						callback.apply(socket, args);
					}
				});
			})
		}
	};

}).controller('WebDiscoController', ['$scope', 'socket', '$interval', function($scope, socket, $interval){
	var WDC = this;

	WDC.connectedUsers = 1;

	WDC.tempo = 120;
	Tone.Transport.bpm.value = WDC.tempo;
	
	// WDC.TransportLength = 32;
	WDC.TransportActiveBeat = null;


	WDC.BassLength = 16;
	WDC.SynthLength = 32
	WDC.DrumLength = 16;
	
	
	WDC.isActiveBeat = function(index, instrument){
		if (index == WDC.TransportActiveBeat){
			return true;
		}
		if (instrument == 'drum'){
			return (index === WDC.activeDrumBeat);

		}
		if (instrument == 'synth'){
			return (index === WDC.activeSynthBeat);
		}
		if (instrument == 'bass'){
			return (index === WDC.activeBassBeat);
		}
	}

	function getLoopBeat(transportBeat, LoopLength){
		while (transportBeat >= LoopLength){
			transportBeat = transportBeat - LoopLength;
		}
		return transportBeat;
	}

	var secsPerBeat = WDC.tempo / 16;
	var timer = null;

	WDC.getLength = function(num) {
	    return new Array(parseInt(num));   
	}

	WDC.isOddBar = function(beat, division) {
		beat = beat;
		 return Math.floor(beat / division) % 2;
	}

	WDC.view = 'synth';

	/// GLOBAL CONTROLS
	function playStuff(beat){
		playBass(beat);
		playSynth(beat);
		playDrums(beat);
	}
	WDC.pause = function(){
		if (typeof timer !== 'undefined'){
			$interval.cancel(timer);	
			WDC.TransportActiveBeat = null;
		}
	}

	WDC.play = function(){
		if (typeof timer !== 'undefined'){
			$interval.cancel(timer);	
		}
		beat = 0;
		temp = 60 / WDC.tempo;
		temp = temp * 1000 / 4;
		timer = $interval(function(){
			WDC.TransportActiveBeat = beat;
			playStuff(beat);

			if (beat == Math.max(WDC.SynthLength, WDC.BassLength, WDC.DrumLength) - 1){
				beat = 0;
			} else {
				beat++;	
			}
		}, temp)

	}


	WDC.NoteType = function(grid, note, beat){
		if (typeof grid[note][beat] === undefined){
			return false;
		} else if (grid[note][beat]){
			return true;
		} else{
			return false;
		}
	}

	WDC.isSharp = function(note){
		return (note.indexOf('#') !== -1);
	}


	//// SYNTH
	WDC.SynthGrid = {
		'D#5':[],
		'D5':[],
		'C5#':[],
		'C5':[],
		'B4':[],
		'A#4':[],
		'A4':[],
		'G#4':[],
		'G4':[],
		'F#4':[],
		'F4':[],
		'E4':[],
		'D#4':[],
		'D4':[],
		'C#4':[],
		'C4':[],
		'B3':[],
		'A#3':[],
		'A3':[],
		'G#3':[],
		'G3':[],
		'F#3':[],
		'F3':[],
		'E3':[],
		'D#3':[],
		'D3':[],
		'C#3':[],
		'C3':[],
	}


	// TODO: Make a better synth
	var polySynth = new Tone.PolySynth(4, Tone.Synth, {
		envelope : {
			attack : 0.25,
			release: 4
		}
	}).toMaster();

	// GENERIC SEQENCER SHIT
	WDC.toggleSynthNote = function(grid, note, beat){
		grid[note][beat] = !grid[note][beat];
		socket.emit('SynthUpdate', WDC.SynthGrid)
	}

	notes = []
	heldNotes = [];
	function playSynth(beat){
		beat = getLoopBeat(WDC.TransportActiveBeat, WDC.SynthLength);
		WDC.activeSynthBeat = beat;
		for (note in WDC.SynthGrid){
			if (WDC.SynthGrid[note][beat]){
				notes.push(note);
			}
		}
		if (notes && !heldNotes){
			heldNotes = notes;
			polySynth.triggerAttack(heldNotes);
			notes = [];
		} else if (notes && heldNotes){
			polySynth.triggerRelease(heldNotes);
			polySynth.triggerAttack(notes);
			heldNotes = notes;
			notes = [];
		}
		
	}



	//// BASSS
	
	WDC.BassGrid = {
		'B':[],
		'A#':[],
		'A':[],
		'G#':[],
		'G':[],
		'F#':[],
		'F':[],
		'E':[],
		'D#':[],
		'D':[],
		'C#': [],
		'C':  [],	
	}


	WDC.toggleBassNote = function(note, beat){
		WDC.BassGrid[note][beat] = !WDC.BassGrid[note][beat];
		socket.emit('BassUpdate', WDC.BassGrid)
	}

	// var bass = new Tone.FMSynth({
	// 	"harmonicity" : 1,
	// 	"modulationIndex" : 3.5,
	// 	"carrier" : {
	// 		"oscillator" : {
	// 			"type" : "custom",
	// 			"partials" : [0, 1, 0, 2]
	// 		},
	// 		"envelope" : {
	// 			"attack" : 0.001,
	// 			"decay" : 0.3,
	// 			"sustain" : 0,
	// 			"release" : 0,
	// 		},
	// 	},
	// 	"modulator" : {
	// 		"oscillator" : {
	// 			"type" : "square"
	// 		},
	// 		"envelope" : {
	// 			"attack" : 0.01,
	// 			"decay" : 0.2,
	// 			"sustain" : 0.3,
	// 			"release" : 0.01
	// 		},
	// 	}
	// }).toMaster();

	var bass = new Tone.Synth({
			oscillator : {
			type : 'sawtooth',
		},
			envelope : {
			attack : 0.001,
			decay : 0.1,
			sustain: 0.1,
			release: 0.4
		}
	}).toMaster()

	function playBass(beat){
		beat = getLoopBeat(WDC.TransportActiveBeat, WDC.BassLength);
		WDC.activeBassBeat = beat;
		for (note in WDC.BassGrid){
			if (WDC.BassGrid[note][beat]){
				bass.triggerAttackRelease(note+'2', '8n')
			}
			
		}
	}



	// DRUMS 

	var kick = new Audio('kick.mp3');
	var snare = new Audio('snare.mp3');
	var hihat = new Audio('hhc.mp3');

	WDC.view = 'drum';
	WDC.DrumGrid = {
		'hi-hat': [],
		'snare': [false,false,false,false,true,false,false,false,false,false,false,false,true,false,false,false],
		'kick':  [true,false,false,false,true,false,false,false,true,false,false,false,true,false,false,false],
	}

	function getDrumBeat(transportBeat, DrumLength){
		while (transportBeat >= DrumLength){
			transportBeat = transportBeat - DrumLength;
		}
		return transportBeat;
	}

	function playDrums(beat){
		beat = getLoopBeat(WDC.TransportActiveBeat, WDC.DrumLength);
		WDC.activeDrumBeat = beat;
		if (WDC.DrumGrid['kick'][beat]){
			kick.cloneNode().play();
		}
		if (WDC.DrumGrid['snare'][beat]){
			snare.cloneNode().play();
		}
		if (WDC.DrumGrid['hi-hat'][beat]){
			hihat.cloneNode().play();
		}
	}




	WDC.toggleBeat = function(drum, beat){
		WDC.DrumGrid[drum][beat] = !WDC.DrumGrid[drum][beat];
		socket.emit('DrumUpdate', WDC.DrumGrid)
	}

	WDC.beatType = function(drum, beat){
		if (WDC.DrumGrid[drum][beat] != 0){
			return true;
		} else{
			return false;
		}
	}


	socket.on('DrumUpdate', function(DrumGrid){
		WDC.DrumGrid = DrumGrid;
	})

	socket.on('BassUpdate', function(BassGrid){
		WDC.BassGrid = BassGrid;
	})

	socket.on('SynthUpdate', function(SynthGrid){
		WDC.SynthGrid = SynthGrid;
	})


	socket.on('playPiano', function(data){
		// console.log(data);
		synth.triggerAttackRelease(data.note, data.time, data.when)
	})


	socket.on('connectedUsers', function(data){
		WDC.connectedUsers = data;
	});

}]);