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
	let config = Object.get("config");
	let folder = './config/';
	
	console.log("Carregando configurações das transportadoras");
	
	let folderList = fs.readdirSync(folder);
	for(let i in folderList){
		let subfolder = folderList[i];
		let sublist   = [];
		
		for(let j in config.carrierList){
			var carrier = config.carrierList[j];
			var file = folder+subfolder+"/"+carrier+".json";
			var jsonData = null;
			
			try {
				jsonData = JSON.parse(fs.readFileSync(file, 'utf-8'));
				console.log(subfolder+" "+carrier+": OK");
			}catch(e){
				console.log(subfolder+" "+carrier+": Erro ("+e+")");
			}
			sublist[carrier] = jsonData;
		}
		Object.set(subfolder,sublist);
	}
};

module.exports = Freight;