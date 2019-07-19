/**
 * Autor Vinicius <dias.viniciuscesar@gmail.com>
 * Desde 09/07/2019 v0.1
 */
var Utils = function(){};

/**
 * Resposta padrão de um produto da transportadora
 */
Utils.getDefaultAnswer = function(){
	return {
		"carrierid": "",
		"product": {
			"id": "",
			"name": ""
		},
		"price": 0,
		"deliveryDays": 0,
		"status": "E",
		"message": "",
		"errorCode": ""
	};
}

/**
 * Valida os dados para calculo de frete
 */
Utils.validateInput = function(req){
	if(req == undefined){
		throw 'Requisição inválida';
	}
	
	let input    = req.body;
	let required = ["zipcode","weight","total","width","height","length","diameter"];
	
	if(input == undefined){
		throw 'Entrada inválida';
	}
	
	for(let i in required){
		let property = required[i];
		if(!input[property]){
			throw 'Campo '+property+' não informado';
		}
		
		if(input[property] == ''){
			throw 'Campo '+property+' vazio';
		}
	}
	
	input = Utils.parseInput(req);
	
	if(input.zipcode.length != 8){ 
		throw 'CEP inválido';
	}
	
	if(input.weight <= 0){
		throw 'Peso zerado ou negativo';
	}
	
	if(input.total <= 0){
		throw 'Total zerado ou negativo';
	}	
}

/**
 * Interpreta os dados de frete
 */
Utils.parseInput = function(req){
	if(req == undefined){
		throw 'Requisição inválida';
	}
	
	let input     = req.body;
	input.zipcode = input.zipcode.replace("/[^0-9]/g","");
	
	if(!isNaN(input.weight)){
		input.weight = parseFloat(input.weight);
	}
	
	if(!isNaN(input.total)){
		input.total = parseFloat(input.total);
	}
	
	if(!isNaN(input.width)){
		input.width = parseFloat(input.width);
	}
	
	if(!isNaN(input.height)){
		input.height = parseFloat(input.height);
	}
	
	if(!isNaN(input.depth)){
		input.depth = parseFloat(input.depth);
	}
	
	if(!isNaN(input.diameter)){
		input.diameter = parseFloat(input.diameter);
	}
	
	return input;
}

/**
 * Interpreta um valor monetário
 */
Utils.parseCurrency = function(value){
	if(typeof(value) == 'number'){
		return value + 0.00;
	}
	
	if(value == undefined || typeof(value) != 'string' || value == ""){		
		return 0.00;
	}
	
	value = value.replace(/[^0-9\,\.]/g,"");
	
	if(value.indexOf(",") != -1){
		value = value.replace(/[\.]/,"");
		value = value.replace(/[\,]/,".");
	}
	
	try {
		return parseFloat(value);
	}catch(e){
		return 0;
	}
};

module.exports = Utils;