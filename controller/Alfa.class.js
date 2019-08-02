const http   = require('http');
const https  = require('https');
const xml2js = require('xml2js');
const utils  = require('./Utils.class.js');

var xmlParser = new xml2js.Parser();

/**
 * @author Henrique S. Ribeiro <henriqueribeiro42@gmail.com>
 * @since 29/07/2019
 * @version v1
 */
var Alfa = function(){};
/**
 * Operação dos correios que calcula o frete e o prazo
 */
Alfa.calc = (payload) => {
    let answerList = [];
    
    return new Promise(function(resolve,reject){
        let start = new Date();
        let end   = null;
        let diff  = 0;
        
        let input = payload.input;
        let config = Object.get2(input.config,"alfa");
        
        let cliTip = 1;
        if (input.docnr.length == 11) {
            cliTip = 2;
        }
        
        if (Object.get("debug") == 1) {
            console.log("alfa: inicio");
        }
        
        // montando url
        let params = {
            "idr": config.idr,
            "cliTip": cliTip,
            "cliCnpj": input.docnr,
            "cliCep": input.zipcode,
            "merVlr": input.total,
            "merPeso": input.weight,
            "merM3": "0.1"
        };
        
        let url = "https://www.alfatransportes.com.br:443/ws/cotacao/";
        
        let args = [];
        for(let i in params){
            args.push(i+"="+params[i]);
        }
        args = args.join("&");
        url += "?"+args;
        
        // fazendo requisição
        https.get(url, (resp) => {
            let data = '';
            
            resp.on('data', (chunk) => {
                data += chunk;
            });
            
            resp.on('end', () => {
                end = new Date();
                diff = end - start;
                
                if (Object.get("debug") == 1) {
                    console.log("alfa: fim");
                }
                
                xmlParser.parseString(data, (err, result) => {
                    if (err) {
                        resolve({
                            "carrierid": "alfa",
                            "status": "E",
                            "duration": diff,
                            "message": err,
                            "result": answerList
                        });
                        return;
                    }
                    let cot = result.wsCotacao.cot[0];
                    
                    if (cot.cotStatus[0].$.stsCd != "1") {
                        resolve({
                            "carrierid": "alfa",
                            "status": "E",
                            "duration": diff,
                            "message": cot.cotStatus[0]._,
                            "result": answerList
                        });
                        return;
                    }
                    
                    let answer = utils.getDefaultAnswer();
                    answer.carrierid = "alfa";
                    answer.product.id = cliTip;
                    answer.product.name = cot.emi[0].emiTransp[0]._;
                    answer.price = cot.vlr[0].cotVlrTot[0];
                    answer.deliveryDays = parseInt(cot.ent[0].entPrev[0].split(" ")[0]);
                    answer.status = "S";
                    answerList.push(answer);
                    
                    resolve({
                        "carrierid": "alfa",
                        "status"   : "S",
                        "duration" : diff,
                        "message"  : "",
                        "result"   : answerList
                    });
                });
            });
        }).on("error", (err) => {
            if (Object.get("debug") == 1) {
                console.log("alfa: error");
            }
            
            resolve({
                "carrierid": "alfa",
                "status"   : "E",
                "duration" : diff,
                "message"  : err.message,
                "result"   : answerList
            });
        }).setTimeout(10000, function(){
            end = new Date();
            diff = end - start;
            
            this.abort();
            
            resolve({
                "carrierid": "alfa",
                "status"   : "E",
                "duration" : diff,
                "message"  : "timeout",
                "result"   : answerList
            });
            
        });
    });
}

module.exports = Alfa;