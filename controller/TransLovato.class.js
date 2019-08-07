const xml2js = require("xml2js");
const utils  = require("./Utils.class.js");
const soap   = require("soap");
const moment = require("moment");
const fs     = require("fs");

var xmlParser = new xml2js.Parser();

/**
 * @author Henrique S. Ribeiro <henriqueribeiro42@gmail.com>
 * @since 02/08/2019
 * @version v1
 */
var TransLovato = function(){};

TransLovato.carrierid = "translovato";

TransLovato.getToken = (allParams, config) => {
    return new Promise((resolve, reject) => {
        let url = "http://187.84.207.102:85/WsChaveAcesso.dll/wsdl/IwsGeraChaveAcesso";
        let params = {
            "CNPJ": allParams.CNPJ,
            "Usuario": allParams.Usuario,
            "Senha": config.Senha
        };

        soap.createClient(url,{"wsdl_options": {"timeout": 2000}}, function(ccErr, client) {
            if (typeof(client) === "undefined") {
                resolve({
                    "status": "E",
                    "message": "Serviço indisponível"
                });
                return;
            }

            client.geraChaveAcesso(params,(err, resp) => {
                if (err) {
                    resolve({
                        "status": "E",
                        "message": err
                    });
                    return;
                }

                if (typeof(resp.Erro) != "undefined" && typeof(resp.Erro.Descricao) != "undefined" && resp.Erro.Descricao.$value.length > 0) {
                    resolve({
                        "status": "E",
                        "message": resp.Erro.Descricao.$value
                    });
                    return;
                }

                if (resp) {
                    resolve({
                        "status": "S",
                        "result": resp.DadosAcesso.Chave.$value
                    });
                }
            }, {"timeout": 10000}); // 10sec
        });
    });
}

/**
 * Operação dos correios que calcula o frete e o prazo
 */
TransLovato.calc = (payload) => {
    let answerList = [];
    let carrierid = TransLovato.carrierid;

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
            "CNPJ": config.CNPJ,
            "Usuario": config.Usuario,
            "CdEmpresa": config.CdEmpresa,
            "CdRemetente": config.CdRemetente,
            "CdDestinatario": input.docnr,
            "NrCepColeta": config.NrCepColeta,
            "NrCepCalcAte": input.zipcode,
            "InTipoFrete": config.InTipoFrete,
            "InIcms": config.InIcms,
            "CdNatureza": config.CdNatureza,
            "CdTransporte": config.CdTransporte,
            "CdTipoVeiculo": config.CdTipoVeiculo,
            "VlMercadoria": input.total,
            "QtPeso": input.weight,
            "QtVolumes": 1,
            "QtMetrosCubicos": "0.1",
            "QtPares": 0
        };

        // chave acesso
        TransLovato.getToken(params, config).then((token) => {
            if (token.status == "E") {
                end = new Date();
                diff = end - start;

                resolve({
                    "carrierid": carrierid,
                    "status"   : "E",
                    "duration" : diff,
                    "message"  : token.message,
                    "result"   : answerList
                });
                return;
            }

            let url = "http://187.84.207.102:85/wsCotacao.dll/wsdl/IWSSimulacaoFrete";
            params.ChaveAcesso = token.result;
            
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
    
                client.SimulacaoFrete(params,(reqErr,data) => {
                    end = new Date();
                    diff = end - start;
    
                    if (Object.get("debug")==1) {
                        console.log(`${carrierid}: fim`);
                    }
                    
                    let result = data;
                    // xmlParser.parseString(data, (err, result) => {

                    if (typeof(result)=="undefined") {
                        err = "Resultado inválido";
                    }

                    if (err) {
                        resolve({
                            "carrierid": carrierid,
                            "status": "E",
                            "duration": diff,
                            "message": err,
                            "result": answerList
                        });
                        return;
                    }
                    
                    let tSimulacaoFrete = result.TSimulacaoFrete;
                    if (typeof(tSimulacaoFrete.Erro) != "undefined" && typeof(tSimulacaoFrete.Erro.item) != "undefined" && tSimulacaoFrete.Erro.length > 0) {
                        resolve({
                            "carrierid": carrierid,
                            "status": "E",
                            "duration": diff,
                            "message": "Não foi possível processar o frete",
                            "result": answerList
                        });
                        return;
                    }
                    let frete = tSimulacaoFrete.Frete;
                    
                    let answer = utils.getDefaultAnswer();
                    answer.carrierid = carrierid;
                    answer.product.id = "default";
                    answer.product.name = "default";
                    answer.price = frete.Frete.$value;
                    answer.deliveryDays = 0;
                    answer.status = "S";
                    answerList.push(answer);
                    
                    resolve({
                        "carrierid": carrierid,
                        "status"   : "S",
                        "duration" : diff,
                        "message"  : "",
                        "result"   : answerList
                    });
                    return;
                    // });
                },{"timeout":10000});
            });
        });
    });
}

module.exports = TransLovato;