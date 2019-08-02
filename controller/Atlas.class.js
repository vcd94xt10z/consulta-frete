const xml2js = require("xml2js");
const utils  = require("./Utils.class.js");
const soap   = require("soap");
const moment = require("moment");

var xmlParser = new xml2js.Parser();

/**
 * @author Henrique S. Ribeiro <henriqueribeiro42@gmail.com>
 * @since 30/07/2019
 * @version v1
 */
var Atlas = function(){};

Atlas.carrierid = "atlas";
/**
 * Operação dos correios que calcula o frete e o prazo
 */
Atlas.calc = (payload) => {
    let answerList = [];
    let carrierid = Atlas.carrierid;

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
            "token": config.token,
            "cnpjRemetente": config.cnpjRemetente,
            "ieRemetente": config.ieRemetente,
            "cnpjDestinatario": input.docnr,
            "ieDestinatario": input.ie,
            "flDestinatarioConsumidorFinal": true,
            "cnpjTomador": config.cnpjTomador,
            "ieTomador": config.ieTomador,
            "cnpjRecebedor": input.docnr,
            "ieRecebedor": input.ie,
            "observacao": "",
            "dataEmbarque": moment().format("YYYY-MM-DD"),
            "placaVeiculo": "",
            "kmViagem": 0.0,
            "flArmazemGeral": false,
            "flIncideIcms": true,
            "ufOrigem": config.ufOrigem,
            "cepOrigem": config.cepOrigem,
            "ufEntrega": input.uf,
            "cepEntrega": input.zipcode,
            "codCondicaoContrato": 0,
            "pesoNominal": input.weight,
            "cubagem": 0,
            "vlMercadoria": input.total,
            "qtVolumes": 1,
            "codEmbagem": 0,
            "codProduto": 1,
            "idTipoCalculoFrete": 1,
            "flNFDevolucao": false,
            "codTipoServico": 1
        };

        let url = "https://newsitex.expressojundiai.com.br/NewSitex/WebServices/wsFreteCombinado.asmx?WSDL";

        // let args = [];
        // for(let i in params){
        //     args.push(i+"="+params[i]);
        // }
        // args = args.join("&");
        // url += "?"+args;

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

            client.FreteCombinado(params,(reqErr,data) => {
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
                    // console.log("result: "+JSON.stringify(data, null, 2));
                    let cot = data.FreteCombinadoResult.cotacao;
                    let momentFreight = moment(cot.dtPrevisaoEntrega);
                    let momentShipping = moment(params.dataEmbarque);
                    let days = momentFreight.diff(momentShipping,"days");
                    
                    let answer = utils.getDefaultAnswer();
                    answer.carrierid = carrierid;
                    answer.product.id = null;
                    answer.product.name = "ATLAS";
                    answer.price = cot.vlFrete;
                    answer.deliveryDays = days;
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
            });
        });
    });
}

module.exports = Atlas;