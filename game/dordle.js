
async function game_logic(method, params){
    if(method === GAME_OP_CREATE){
	
	logger.info("New Dordle game created with params: \n"+JSON.stringify(params, null, 4));
	return {msg: "Game "};
    }else
    if(method === GAME_OP_JOIN){
	logger.info("New player joined with params: \n"+JSON.stringify(params, null, 4));
	return;
    }else
    if(method === GAME_OP_STARTED){
	logger.info("Game started with params: \n"+JSON.stringify(params, null, 4));
	return;
    }
}