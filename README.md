![Node](https://img.shields.io/badge/node-%3E%3D%208.0.0-brightgreen.svg)

<p align="center">
  <h1 align="center">Consulta de Frete</h1>
</p>

Consulta de frete assíncrono com várias transportadoras, ideal para uso em sua plataforma de ecommerce.

## Transportadoras
- :heavy_check_mark: Alfa
- :heavy_check_mark: Transportadoras que utilizam o site SSW
- :heavy_check_mark: Atlas/Jundiaí
- :heavy_check_mark: Braspress
- :heavy_check_mark: Correios
- :x: JadLog (Em desenvolvimento)
- :x: Jamef (A desenvolver)
- :heavy_check_mark: Plimor
- :x: Rodonaves (Em desenvolvimento)
- :x: São Miguel (A desenvolver)
- :x: Sudoeste (A desenvolver)
- :x: TNT (Em desenvolvimento)
- :x: TransLovato (A desenvolver)
- :x: Transpen (A desenvolver)

## Instruções

1) Clone ou baixe o zip do projeto e extraia em um diretório de sua preferência.

2) Entre no diretório e execute o comando
 
```
npm install fs express http https xml2js soap moment
```

3) Copie o arquivo de configuração geral config-sample.json para config.json e faça as modificações

4) Copie o arquivo de configuração de exemplo de cada transportadora no diretório "config-sample" para o diretório
"config" e forneça as informações necessárias

5) Ative o SSL (opcional): Para ativar o suporte a SSL, crie o diretório "cert" na raiz do projeto com os arquivos ca.crt, ca.pem, site.crt e site.key. Se todos os arquivos forem válidos, o serviço vai subir automaticamente.

6) Inicie o app
 
```
node index.js
```

7) Consuma o serviço conforme explicado abaixo. Para facilitar, copie o arquivo sample.html para um servidor web e execute para ver a consulta funcionando. Há basicamente duas formas de consumo do serviço:

- A primeira é consultando apenas uma url e recebendo todos os fretes de uma só vez. 
- A segunda forma (recomendada) é consultar as transportadoras que atendem a solicitação e depois chamar a consulta de frete de cada transportadora individualmente. Assim, conforme cada consulta é finalizada, o usuário já recebe
a informação, ao invés de esperar todas terminarem.

Biblioteca frontend para facilitar o consumo do serviço

```
https://cdn.jsdelivr.net/gh/vcd94xt10z/consulta-frete/freight.js
```

## Demonstração

Para ver como funciona na prática, copie o arquivo sample.html para um servidor web e teste localmente.
 
## Operações disponíveis

Os parâmetros podem variar dependendo da transportadora, não esqueça de verificar os erros retornados.

Calcula o frete das transportadoras disponíveis (o acesso ao WebService de cada transportadora é feito de forma assíncrona)

```
POST /frete/

{
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

Acesse o site https://ssw.inf.br e veja a lista de transportadoras disponíveis. Cada transportadora deve ter seu arquivo de configuração próprio e deve ser habilitada no arquivo config.json.