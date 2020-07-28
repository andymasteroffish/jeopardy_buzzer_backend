//https://devcenter.heroku.com/articles/node-websockets

"use strict";

const express = require("express");
const { Server } = require("ws");

//heroku will force this to be port 80
const PORT = process.env.PORT || 3001;
const INDEX = "/index.html"; //TODO: get rid of this

let players = []
let board_ws = null

//setting up a sevrer
const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new Server({ server });

setInterval( lifeline_pulse, 3000);

//getting a new connections
wss.on("connection", ws => {
	
	console.log("papa got that connect")

	ws.on('close', () => {
		console.log('Client disconnected')
		for (let i=players.length-1; i>=0; i--){
			if (players[i].ws == ws){
				console.log("time to kill "+players[i].disp_name)
				players.splice(i,1);
			}
		}
	});

	ws.on('message', function incoming(msg_raw){
		console.log("got a message")
		let msg = JSON.parse(msg_raw)

		console.log(msg)

		if (msg.type == "register_board"){
			console.log("got a board!")
			board_ws = ws;
		}

		if (msg.type == "join"){
			console.log("new player alert!")

			if (get_player_from_ws(ws) == null){
				console.log("add "+msg.player_name)
				let player = {
					ws: ws,
					disp_name: msg.player_name,
					in_game: true
				}
				players.push(player)

				//send reply
				let buzzer_reply = {
					type: "join_confrim",
					player_name:player.disp_name
				}
				ws.send(JSON.stringify(buzzer_reply))

				//and let the board know
				if (board_ws != null){
					let board_reply = {
						type: "new_player",
						player_info:{
							disp_name: player.disp_name
						}
					}
					board_ws.send(JSON.stringify(board_reply))
				}else{
					console.log("no board to send new player to")
				}

			}
			else{
				//TODO: send some type or error? Maybe just ignore it?
			}
		}

		if (msg.type == "buzz"){
			let player = get_player_from_ws(ws)
			if (board_ws != null && player != null){
				console.log("SEND THAT BUZZZZZZZZZZ")
				let val = {
					type: "buzz",
					player_name:player.disp_name
				}
				board_ws.send(JSON.stringify(val))
			}else{
				if (board_ws == null){
					console.log("can't buzz no board")
				}else{
					console.log("somehting went wrong with buzz")
				}
			}
		}

		//console.log("here the players")
		//print_players()
	})
})

function get_player_from_ws(ws){
	console.log("checking "+players.length+" players")
	for (let i=0; i<players.length; i++){
		if (players[i].ws == ws){
			return players[i];
		}
	}
	console.log("could not find that player")
	return null;
}

function print_players(){
	console.log("all players:")
	players.forEach( (player) => {
		console.log("  "+player.disp_name)
	})
}

function lifeline_pulse(){
	let val = {
		type: "pulse"
	}
	if (board_ws != null){
		board_ws.send(JSON.stringify(val))
	}
	players.forEach( player => {
		player.ws.send(JSON.stringify(val))
	})
}

