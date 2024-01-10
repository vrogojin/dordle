const express = require("express");
const router = express.Router();
const storage = require('node-persist');

let games = [];

router.post("/", (req, res) => {
    const { jsonrpc, id} = req.body;
    const { method } = req.body.data;

    swicth(method){
	case 'create':
	    return createGameHanlder(req, res);
	break;
	case 'join':
	    return joinGameHanlder(req, res);
	break;
	case 'list':
	    return listGamesHanlder(req, res);
	break;
	case 'info':
	    return infoGameHanlder(req, res);
	break;
	case 'action':
	    return playGameHanlder(req, res);
	break;
	default:
	    throw ApiError.badRequest('Method '+method+' not implemented');
    }
}

async function createGameHanlder(req, res){
    const { address, game_type, game_name, game_opts } = req.body.data;

    validateGameType(game_type);
    const game_uuid = await generateNewGame(games[game_type], game_name, game_opts, address);

    return respondOk(req, res, { game_uuid });
}

async function joinGameHanlder(req, res){
    const { address, game_type, invite_uuid } = req.body.data;

    validateGameType(game_type);

    return respondOk(req, res, await joinGame(games[game_type], invite_uuid, address));
}

async function listGamesHanlder(req, res){
    const { address } = req.body.data;

    const games = {
	participating: await listGames()
    }

    return respondOk(req, res, await joinGame(games[game_type], invite_uuid, address));
}

function registerGameLogic(game_type, game_logic){
    games[game_type] = game_logic;
}

function validateGameType(game_type){
    if(!games[game_type])
	throw ApiError.badRequest("Game of type "+game_type+" not registered");
}