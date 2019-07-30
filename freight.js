/**
 * Autor Vinicius <dias.viniciuscesar@gmail.com>
 * Desde 19/07/2019 v0.1
 */
var Freight = function(){};

Freight.httpScheme = "http";
Freight.servername = "henrique.hayamax2.com.br.des";
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
Freight.calcSync = function(input){
	return new Promise(function(resolve,reject){
		$.ajax({
			type: 'POST',
			url: Freight.getEndpoint('/frete'),
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

/**
 * Calcula o frete de forma asincrona
 */
Freight.calcAll = function(input,renderCallback,finishCallback){
	let promise  = Freight.getInfo(input);
	let promises = [];
	
	promise.then(function(data){
		for(let i in data.carrierList){
			let promiseItem = Freight.calcCarrier(input,data.carrierList[i]);
			promiseItem.then(function(arg){
				renderCallback(arg);
			});
			promises.push(promiseItem);
		}
		
		Promise.all(promises).then(function(){
			finishCallback();
		});
	});
}

/**
 * Retorna as transportadoras que atendem o frete
 */
Freight.getInfo = function(input){
	return new Promise(function(resolve,reject){
		$.ajax({
			type: 'POST',
			url: Freight.getEndpoint('/info'),
			contentType: 'application/json',
			data: JSON.stringify(input),
			dataType: 'json',
			success: function(data){
				resolve(data);
			},
			error: function(xhr){
				resolve(xhr);
			}
		});
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
				var carrierObj = data.result[0];
				resolve(carrierObj);
			},
			error: function(xhr){
				resolve(xhr);
			}
		});
	});
}