const https = require('https');
const utils = require('./Utils.class.js');

/**
 * Autor Vinicius <dias.viniciuscesar@gmail.com>
 * Desde 10/07/2019 v0.1
 */
var TNT = function(){};

/**
 * Calcula o frete
 */
TNT.calc = function(payload){
	let answerList = [];
	
	return new Promise(function(resolve,reject){
		let timeoutSimulation = Math.zrand(1,5) * 1000;
		let start = new Date();
		let end = null;
		let diff = 0;
		
		if(Object.get("debug") == 1){
			console.log("tnt: inicio");
		}
		
		https.get('https://httpstat.us/200?sleep='+timeoutSimulation, (resp) => {
		  let data = '';
		  
	      resp.on('data', (chunk) => {
		    data += chunk;
		  });

		  resp.on('end', () => {
			  end = new Date();
			  diff = end - start;
			  
			  if(Object.get("debug") == 1){
					console.log("tnt: fim");
				}
			  
			  let answer          = utils.getDefaultAnswer();
			  answer.carrierid    = "tnt";
			  answer.product.id   = "default";
			  answer.product.name = "default";
			  answer.price        = parseFloat(Math.zrand(1,50)+"."+Math.zrand(0,99));
			  answer.deliveryDays = Math.zrand(2,65);
			  answer.status       = 'S';
			  answerList.push(answer);
			  
			  resolve({
				  "carrierid": "tnt",
				  "status"   : "S",
				  "duration" : diff,
				  "message"  : "",
				  "result"   : answerList
			  });
		  });
		}).on("error", (err) => {
			if(Object.get("debug") == 1){
				console.log("tnt: error");
			}
			
			resolve({
				"carrierid": "tnt",
				"status"   : "E",
				"duration" : diff,
				"message"  : err.message,
				"result"   : answerList
			});
		}).setTimeout(3000, function(){
			end = new Date();
			diff = end - start;
			
	        this.abort();
	        
	        resolve({
		    	"carrierid": "tnt",
		    	"status"   : "E",
				"duration" : diff,
				"message"  : "timeout",
		    	"result"   : answerList
			});
	        
	    });
	});
}

module.exports = TNT;