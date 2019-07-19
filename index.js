/**
 * Autor Vinicius <dias.viniciuscesar@gmail.com>
 * Desde 10/12/2018 v0.1
 */
const express    = require('express');
const bodyParser = require('body-parser');

const freight    = require('./controller/Freight.class.js');
const tnt        = require('./controller/TNT.class.js');
const correios   = require('./controller/Correios.class.js');
const rodonaves  = require('./controller/Rodonaves.class.js');
const utils      = require('./controller/Utils.class.js');

const app = express();
app.disable('x-powered-by');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  
  next();
});

Math.zrand = function(min, max) {
	return Math.floor(min + Math.random()*(max + 1 - min));
}

Object.data = [];
Object.set = function(key,value){
	Object.data[key] = value;
}

Object.get = function(key){
	return Object.data[key];
}

Object.set("debug",1);

console.log("+---------------------------------------------------------------+");
console.log("| Consulta Frete (https://github.com/vcd94xt10z/consulta-frete) |");
console.log("+---------------------------------------------------------------+");

freight.loadConfig();

var requestsCounter = 0;

/**
 * Calcula o frete de todas as transportadoras disponíveis
 * @param req
 * @param res
 * @returns
 */
app.post('/frete/', function(req, res){
	requestsCounter++;
	
	let payload  = {req:req,res:res,input:null};
	let promises = [];
	
	// validações
	try {
		utils.validateInput(req);
	}catch(message){
		res.status(400).send(message);
		return;
	}
	
	payload.input = utils.parseInput(req);
	
	if(Object.get("debug") == 1){
		console.log("-----------------------------------");
		console.log("["+requestsCounter+"] Inicio de chamadas assíncronas");
	}
	
	freight.getInfo(payload,function(){
		for(let i in payload.info.carrierList){
			let carrier = payload.info.carrierList[i];
			if(typeof carrier == "string"){
				eval('promises.push('+carrier+".calc(payload));");	
			}
		}
		
		Promise.all(promises)
		.then(function(resultArray){
			if(Object.get("debug") == 1){
				console.log("Promise.all: done");
			}
			payload.info.result = resultArray;
			payload.res.send(payload.info);
		});
	});
});

/**
 * Retorna informações das transportadoras
 * @param req
 * @param res
 * @returns
 */
app.post('/info/', function(req, res){
	requestsCounter++;
	
	let payload = {req:req,res:res};
	
	// validações
	try {
		utils.validateInput(req);
	}catch(message){
		res.status(400).send(message);
		return;
	}
	
	freight.getInfo(payload,function(){
		res.send(payload.info);
	});
});

/**
 * Calcula o frete de uma transportadora
 * @param req
 * @param res
 * @returns
 */
app.post('/frete/:carrierid', function(req, res){
	requestsCounter++;
	
	let payload = {req:req,res:res};
	let carrierid = req.params.carrierid;
	
	if(Object.get("debug") == 1){
		console.log("-----------------------------------");
		console.log("["+requestsCounter+"] Inicio de chamada para "+carrierid);
	}
	
	// validações
	try {
		utils.validateInput(req);
	}catch(message){
		res.status(400).send(message);
		return;
	}
	
	payload.input = utils.parseInput(req);
	
	freight.getInfo(payload,function(){
		payload.info.carrierList = [carrierid];
		eval('var promise = '+carrierid+".calc(payload);");
		
		promise.then(function(result){
			if(Object.get("debug") == 1){
				console.log("Promise: done");
			}
			payload.info.result.push(result);
			payload.res.send(payload.info);
		});
	});
});

// manipulador de erros
app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Serviço indisponível');
});

// escutando porta
app.listen(3000, function () {
	console.log("");
	console.log('NodeJS rodando na porta 3000');
	console.log('Aguardando novos clientes');
	console.log("");
	console.log('URIs disponíveis:');
	console.log('POST /frete/');
	console.log('POST /info/');
	console.log('POST /<transportadora>/');
	console.log("");
});