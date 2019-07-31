const fs = require('fs');

/**
 * Autor Vinicius <dias.viniciuscesar@gmail.com>
 * Desde 11/12/2018 v0.1
 */
var Freight = function(){};
Freight.timeout = 2000;

/**
 * Carrega as configurações das transportadoras
 */
Freight.loadConfig = function(){
	let folder   = './config/';
	
	console.log("Carregando configurações das transportadoras");
	let config = Object.get("config");
	
	for(let i in config.carrierList){
		var carrier = config.carrierList[i];
		var file = folder+carrier+".json";
		var jsonData = null;
		
		try {
			jsonData = JSON.parse(fs.readFileSync(file, 'utf-8'));
			console.log(carrier+": OK");
		}catch(e){
			console.log(carrier+": Erro ("+e+")");
		}
		Object.set(carrier,jsonData);
	}
};

/**
 * Retorna informações das transportadoras
 */
Freight.getInfo = function(payload,callback){
	let config = Object.get("config");
	
	let obj = {
		'carrierList': config.carrierList,
		'input': payload.input,
		'result': []
	};
	payload.info = obj;
	callback();
}

module.exports = Freight;