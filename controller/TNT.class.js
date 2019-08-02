const xml2js = require("xml2js");
const utils  = require("./Utils.class.js");
const soap   = require("soap");

var xmlParser = new xml2js.Parser();

/**
 * @author Henrique S. Ribeiro <henriqueribeiro42@gmail.com>
 * @since 01/08/2019
 * @version v1
 */
var TNT = function(){};

TNT.carrierid = "tnt";
/**
 * Operação dos correios que calcula o frete e o prazo
 */
TNT.calc = (payload) => {
    let answerList = [];
    let carrierid = TNT.carrierid;

    return new Promise((resolve,reject) => {
        let start = new Date();
        let end = null;
        let diff = 0;

        let input = payload.input;
        let config = Object.get2(input.config,carrierid);

        if (Object.get("debug")==1) {
            console.log(`${carrierid}: inicio`);
        }

        let params = {
            "in0": {
                "cdDivisaoCliente": config.cdDivisaoCliente,
                "cepDestino": input.zipcode,
                "cepOrigem": config.cepOrigem,
                "login": config.login,
                "nrIdentifClienteDest": input.docnr,
                "nrIdentifClienteRem": config.nrIdentifClienteRem,
                "nrInscricaoEstadualDestinatario": input.ie,
                "nrInscricaoEstadualRemetente": config.nrInscricaoEstadualRemetente,
                "psReal": input.weight,
                "senha": config.senha,
                "tpFrete": config.tpFrete,
                "tpPessoaDestinatario": (input.docnr.length == 11)?"f":"j",
                "tpPessoaRemetente": config.tpPessoaRemetente,
                "tpServico": config.tpServico,
                "tpSituacaoTributariaDestinatario": input.typest,
                "tpSituacaoTributariaRemetente": config.tpSituacaoTributariaRemetente,
                "vlMercadoria": input.total
            }
        };

        let url = "http://ws.tntbrasil.com.br:80/servicos/CalculoFrete?wsdl";
        
        // fazendo requisição
        soap.createClient(url,{"wsdl_options":{"timeout":10000}},(cliErr,client) => {
            if (typeof(client)=="undefined") {
                end = new Date();
                diff = end - start;

                if (Object.get("debug")==1) {
                    console.log(`${carrierid}: fim`);
                }

                resolve({
                    "carrierid": carrierid,
                    "status": "E",
                    "duration": diff,
                    "message": "Serviço indisponível",
                    "result": answerList
                });
                return;
            }

            client.calculaFrete(params,(reqErr,data) => {
                end = new Date();
                diff = end - start;

                if (Object.get("debug")==1) {
                    console.log(`${carrierid}: fim`);
                }

                if (reqErr) {
                    xmlParser.parseString(reqErr.body,(err, result) => {
                        resolve({
                            "carrierid": carrierid,
                            "status": "E",
                            "duration": diff,
                            "message": result["soap:Envelope"]["soap:Body"][0]["soap:Fault"][0].faultstring[0],
                            "result": answerList
                        });
                        return;
                    });
                } else {
                    let output = data.out;
                    if (typeof(output.errorList) != "undefined" && output.errorList != null &&
                        typeof(output.errorList.string) != "undefined" &&
                        output.errorList.string.length > 0) {
                        resolve({
                            "carrierid": carrierid,
                            "status": "E",
                            "duration": diff,
                            "message": output.errorList.string[0],
                            "result": answerList
                        });
                        return;
                    }
                    
                    let answer = utils.getDefaultAnswer();
                    answer.carrierid = carrierid;
                    answer.product.id = "default";
                    answer.product.name = "default";
                    answer.price = output.vlTotalFrete;
                    answer.deliveryDays = output.prazoEntrega;
                    answer.status = "S";
                    answerList.push(answer);

                    resolve({
                        "carrierid": carrierid,
                        "status": "S",
                        "duration": diff,
                        "message": "",
                        "result": answerList
                    });
                }
            },{"timeout":10000});
        });
    });
}

module.exports = TNT;