/**
 * Autor Vinicius <dias.viniciuscesar@gmail.com>
 * Desde 19/07/2019 v0.1
 */
var Freight = function(){};

Freight.httpScheme = "http";
Freight.servername = "localhost";
Freight.port 	   = 3000;

/**
 * Monta o endpoint
 */
Freight.getEndpoint = function(uri){
	return Freight.httpScheme+"://"+Freight.servername+":"+Freight.port+uri;
}

/**
 * Calcula o frete de forma sincrona
 */
Freight.calcSync = function(input,carrierList){
	return new Promise(function(resolve,reject){
		let promises = [];
		
		for(let i in carrierList){
			let carrierid = carrierList[i];
			let promiseItem = Freight.calcCarrier(input,carrierid);
			promises.push(promiseItem);
		}
		
		Promise.all(promises).then(function(resultArray){
			resolve(resultArray);
		});
	});
}

/**
 * Calcula o frete de forma asincrona
 */
Freight.calcAll = function(input,carrierList,renderCallback,finishCallback,errorCallback){
	let promises = [];
	
	for(let i in carrierList){
		let carrierid = carrierList[i];
		let promiseItem = Freight.calcCarrier(input,carrierid);
		promiseItem.then(function(arg){
			renderCallback(arg);
		});
		promises.push(promiseItem);
	}
	
	Promise.all(promises).then(function(){
		finishCallback();
	});
}

/**
 * Retorna o frete de uma transportadora
 */
Freight.calcCarrier = function(input,carrierid){
	return new Promise(function(resolve,reject){
		$.ajax({
			type: 'POST',
			url: Freight.getEndpoint('/frete/'+carrierid),
			contentType: 'application/json',
			data: JSON.stringify(input),
			dataType: 'json',
			success: function(data){
				resolve(data);
			},
			error: function(xhr){
				reject(xhr);
			}
		});
	});
}