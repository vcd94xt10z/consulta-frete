![Node](https://img.shields.io/badge/node-%3E%3D%208.0.0-brightgreen.svg)

<p align="center">
  <h1 align="center">Consulta de Frete</h1>
</p>

Consulta de frete assíncrono com várias transportadoras, ideal para uso em seu site.

## Transportadoras
- :heavy_check_mark: Alfa
- :heavy_check_mark: Atlas/Jundiaí
- :heavy_check_mark: Braspress
- :heavy_check_mark: Correios
- :heavy_check_mark: JadLog
- :heavy_check_mark: Jamef
- :heavy_check_mark: Plimor
- :heavy_check_mark: Rodonaves
- :heavy_check_mark: São Miguel
- :heavy_check_mark: Sudoeste
- :heavy_check_mark: TNT
- :heavy_check_mark: TransLovato
- :heavy_check_mark: Transpen
- :heavy_check_mark: Transportadoras que utilizam o site SSW

## Instruções

1) Clone ou baixe o zip do projeto e extraia em um diretório de sua preferência.

2) Entre no diretório e execute o comando
 
```
npm install fs express http https xml2js soap moment
```

3) Copie o arquivo de configuração geral config-sample.json para config.json e faça as modificações

4) Copie o arquivo de configuração de exemplo de cada transportadora no diretório "config-sample" para o diretório
"config" e forneça as informações necessárias. Dentro de "config" crie uma pasta "default" ou com outro nome para separar
os arquivos de configuração, assim na chamada é necessário informar qual configuração deseja utilizar.

5) Ative o SSL (opcional): Para ativar o suporte a SSL, crie o diretório "cert" na raiz do projeto com os arquivos ca.crt, ca.pem, site.crt e site.key. Se todos os arquivos forem válidos, o serviço vai subir automaticamente.

6) Inicie o app
 
```
node index.js
```

7) Consuma o serviço conforme explicado abaixo. Para facilitar, acesse a demo para ver um exemplo de funcionamento. Há basicamente duas formas de consumo do serviço:

- A primeira é consultando apenas uma url e recebendo todos os fretes de uma só vez. 
- A segunda forma (recomendada) é consultar as transportadoras que atendem a solicitação e depois chamar a consulta de frete de cada transportadora individualmente. Assim, conforme cada consulta é finalizada, o usuário já recebe
a informação, ao invés de esperar todas terminarem.

Biblioteca frontend para facilitar o consumo do serviço

```
https://cdn.jsdelivr.net/gh/vcd94xt10z/consulta-frete/freight.js
```

## Multiplas configurações

A API suporta multiplas configurações, ou seja, você pode ter uma pasta para cada empresa que contém todos os parâmetros das transportadoras como usuário, senha, CNPJ etc. Lembrando que sempre que uma requisição for feita, a configuração deve ser informada. Caso tenha apenas uma, recomendamos que utilize a pasta "default".

## Segurança e Controle de Acesso

Caso queira limitar o uso da API, você pode modificar as seguintes propriedades no arquivo "config.json"

- accessControlAllowOrigin(string): Informe asterisco "*" para liberar o acesso para todos os sites, ou informe dos domínios. Para mais informações, clique [aqui](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Headers/Access-Control-Allow-Origin)
- tokenRequired(boolean): Ative para solicitar token nas comunicações. O cadastro do token fica no arquivo "user.conf" e o token deve ser informado no cabeçalho de cada requisição, exemplo "x-token: 123456789"

## Demonstração

Para ver como funciona na prática, acesse nossa [demo](https://vcd94xt10z.github.io/projetos/consulta-frete/sample.html), fique a vontade para baixar e modificar conforme sua necessidade.
 
## Operações disponíveis

Os parâmetros podem variar dependendo da transportadora, não esqueça de verificar os erros retornados.

Calcula o frete das transportadoras disponíveis (o acesso ao WebService de cada transportadora é feito de forma assíncrona)

```
POST /frete/

{
	"config": "default",
	"zipcode": "04180112",
	"total": 300.5,
	"weight": 2,
	"width": 14,
	"height": 4,
	"length": 18,
	"diameter": 10	
}
```

Retorna as transportadoras que atendem o frete

```
POST /info/
 
{
	"config": "default",
	"zipcode": "04180112",
	"total": 300.5,
	"weight": 2,
	"width": 14,
	"height": 4,
	"length": 18,
	"diameter": 10	
}
```

Calcula o frete da transportadora Correios

```
POST /frete/correios
 
{
	"config": "default",
	"zipcode": "04180112",
	"total": 300.5,
	"weight": 2,
	"width": 14,
	"height": 4,
	"length": 18,
	"diameter": 10	
}
```

## Transportadoras via site SSW

Acesse o site https://ssw.inf.br e veja a lista de transportadoras disponíveis. Cada transportadora deve ter seu arquivo de configuração, além de ser habilitada no arquivo config.json