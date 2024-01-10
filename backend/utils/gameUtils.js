const { uuidv4 } = require('uuid');
const storage = require('node-persist');

const GAME_CREATED = 0;
const GAME_STARTED = 1;
const GAME_OVER = 2;
const GAME_HALTED = 3;

const GAME_OP_CREATE = 'GAME_OP_CREATE';
const GAME_OP_START = 'GAME_OP_START';
const GAME_OP_PLAY = 'GAME_OP_PLAY';
const GAME_OP_HALT = 'GAME_OP_HALT';
const GAME_OP_JOIN = 'GAME_OP_JOIN';
const GAME_OP_LEAVE = 'GAME_OP_LEAVE';

function generateGameUUID(address){
    return uuidv4();
}

function generateInviteUUID(game_uuid, game_participant){
    return sha256(uuidv4()+'_'+game_uuid+'_'+game_participant);
}

async function generateNewGame(game_logic, game_name, game_opts, game_owner){
    const game_uuid = generateGameUUID(game_owner);

    await storage.setItem(game_name_key(game_uuid), game_name);
    await storage.setItem(game_opts_key(game_uuid), game_opts);
    await storage.setItem(game_owner_key(game_uuid), game_owner);
    await push_to(owner_games_key, owner_games_length, game_owner, game_uuid);
    await addParticipant(game_uuid, game_owner);
    await game_logic(GAME_OP_CREATE, {game_uuid, game_name, game_opts, game_owner});
    await game_logic(GAME_OP_JOIN, {game_uuid, game_participant: game_owner});
    await setGameStatus(game_uuid, GAME_CREATED);

    return game_uuid;
}

async function createInvite(game_uuid, game_participant, caller_addr){
    await authenticateOwner(game_uuid, caller_addr);

    await storage.setItem(generateInviteUUID(game_uuid, game_participant), {game_uuid, game_participant});
}

async function joinGame(game_logic, invite_uuid, caller_addr){
    const { game_uuid, game_participant } = await storage.getItem(invite_uuid);
//    const game_owner = await storage.getItem(game_owner_key(game_uuid));

    if(game_participant.toLowerCase() !== caller_addr.toLowerCase())
	throw ApiError.unauthorized("Game join error: wrong participant address in the invitation");

    if(await addParticipant(game_uuid, game_participant))
	return await game_logic(GAME_OP_JOIN, {game_uuid, game_participant});
    else
	throw ApiError.internal("Player join error: something went wrong when adding player, try again");
}

async function leaveGame(game_logic, game_uuid, caller_addr){
    if(removeParticipant(game_uuid, game_participant))
	return await game_logic(GAME_OP_LEAVE, {game_uuid, game_participant: caller_id});
}

async function startGame(game_logic, game_uuid, caller_addr){
    await authenticateOwner(game_uuid, caller_addr);

    await setGameStatus(game_uuid, GAME_CREATED);
    return await game_logic(GAME_OP_START, { game_uuid });
}

async function registerMove(game_logic, game_uuid, move_object, caller_addr){
    await authenticateParticipant(game_uuid, caller_addr);

    return await game_logic(GAME_OP_PLAY, {game_uuid, move_object, caller_addr});
}

async function listParticipatedGames(caller_addr){
    return await getArray(participant_games_key, participant_games_length, caller_addr);
}

async function listOwnedGames(caller_addr){
    return await getArray(owner_games_key, owner_games_length, caller_addr);
}

async function listGames(caller_addr){
    let participate_before = [];
    let participate_active = [];
    let participate_completed = [];
    let owned_before = [];
    let owned_active = [];
    let owned_completed = [];

    const participating = await listParticipatedGames(caller_addr);
    const owned = await listOwnedGames(caller_addr);

    for(game_uuid in participating){
	
    }
}

async function addParticipant(game_uuid, game_participant){
    if(await hasParticipant(game_uuid, game_participant) < 0)
	await push_to(game_participant_key, game_participants_length, game_uuid, game_participant);
    if(await participatesIn(game_uuid, game_participant) < 0)
	await push_to(participant_games_key, participant_games_length, game_participant, game_uuid);
    return (await hasParticipant(game_uuid, game_participant) < 0) && (await participatesIn(game_uuid, game_participant) < 0);
}

async function removeParticipant(game_uuid, game_participant){
    const idx = await hasParticipant(game_uuid, game_participant);
    if(idx > -1){
	await remove_from(game_participant_key, game_participants_length, game_uuid, idx);
	const idx2 = await participatesIn(game_uuid, game_participant);
	if(idx2 > -1){
	    await remove_from(participant_games_key, participant_games_length, game_uuid, idx2);
	    return true;
	    }
    }
    return false;
}

async function authenticateOwner(game_uuid, caller_addr){
    const game_owner = await storage.getItem(game_owner_key(game_uuid));

    if(game_owner.toLowerCase() !== caller_addr.toLowerCase())
	throw ApiError.unauthorized("Caller auth error: Not game owner");
}

async function authenticateParticipant(game_uuid, caller_addr){
    const idx = hasParticipant(game_uuid, caller_addr);

    if(idx == -1)
	throw ApiError.unauthorized("Caller auth error: Not game participant");
}

async function push_to(array_item_key, array_length_key, id, value){
    const length = await storage.getItem(array_length_key(id));
    await storage.setItem(array_item_key(id, length), value);
    await storage.setItem(array_length_key(id), length+1);
}

async function remove_from(array_item_key, array_length_key, id, index){
    const length = await storage.getItem(array_length_key(id));
    if(index >= length)
	throw new Error("Index "+index+" out of bounds "+length);
    if(index < length-1)
	await storage.setItem(array_item_key(id, index), await storage.getItem(array_item_key(id, length-1)));
    await storage.setItem(array_length_key(id));
}

async function hasParticipant(game_uuid, game_participant){
    return await find_in(game_participant_key, game_participants_length, (val1, val2) => {return val1 === val2}, game_uuid, game_participant);
}

async function participatesIn(game_uuid, game_participant){
    return await find_in(participant_games_key, participant_games_length, (val1, val2) => {return val1 === val2}, game_participant, game_uuid);
}

async function setGameStatus(game_uuid, game_status){
    return await storage.setItem(game_status_key(game_uuid), game_status);
}

async function getGameStatus(game_uuid){
    return await storage.getItem(game_status_key(game_uuid));
}



async function find_in(array_item_key, array_length_key, verify, id, value){
    const length = await storage.getItem(array_length_key(id));
    for(let index=0;index<length;index++){
	if(verify(value, await storage.getItem(array_item_key(id, index))))
	    return index;
    }
    return -1;
}

async function getArray(array_item_key, array_length_key, id){
    let arr = [];

    const length = await storage.getItem(array_length_key(id));
    for(let index=0;index<length;index++){
	arr.push(await storage.getItem(array_item_key(id, index)));
    }
    return arr;
}

function game_name_key(uuid){
    return sha256(uuid+'_game_name');
}

function game_opts_key(uuid){
    return sha256(uuid+'_game_opts');
}

function game_owner_key(uuid){
    return sha256(uuid+'_game_owner');
}

function game_participant_key(uuid, index){
    return sha256(uuid+'_game_participant_'+index);
}

function game_participants_length(uuid){
    return sha256(uuid+'_game_participants_length');
}

function owner_games_key(address, index){
    return sha256(uuid+'_owner_game_'+index);
}

function owner_games_length(address){
    return sha256(uuid+'_owner_games_length');
}

function participant_games_key(address, index){
    return sha256(uuid+'_participant_game_'+index);
}

function participant_games_length(address){
    return sha256(uuid+'_participant_games_length');
}

function link_game_key(link_uuid){
    return sha256(link_uuid+'_link_game');
}

function game_status_key(uuid){
    return sha256(uuid+'_game_status');
}
