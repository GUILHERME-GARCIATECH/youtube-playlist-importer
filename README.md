# YouTube Playlist Importer

Script em TypeScript que transforma uma lista de músicas em uma playlist do YouTube. Para cada item, busca `title artist official audio` na categoria Música e adiciona o primeiro vídeo encontrado, mantendo a ordem da lista.

## Requisitos

- Node.js 22 ou superior e npm.
- Conta Google com canal do YouTube.
- Projeto no Google Cloud com a **YouTube Data API v3** habilitada e credenciais OAuth de **aplicativo para computador**.

## Instalação

```sh
git clone https://github.com/GUILHERME-GARCIATECH/youtube-playlist-importer.git
cd youtube-playlist-importer
npm ci
```

O `package-lock.json` é versionado para reproduzir a instalação.

## Configurar o Google

1. Crie ou selecione um projeto no [Google Cloud Console](https://console.cloud.google.com/).
2. Em **APIs e serviços > Biblioteca**, habilite **YouTube Data API v3**.
3. Configure a tela de consentimento no **Google Auth Platform**. Para uso pessoal, escolha público externo e, enquanto o aplicativo estiver em teste, adicione sua conta Google como usuário de teste.
4. Crie um cliente OAuth 2.0 do tipo **Aplicativo para computador / Desktop app**.
5. Baixe o JSON desse cliente e salve como `credentials.json` na raiz do repositório. Ele deve conter a propriedade `installed`. Uma chave de API sozinha não permite criar playlists na sua conta.
6. Execute o script: o navegador abre a tela de autorização. Autorize com a conta cujo canal receberá a playlist. Execute em uma máquina com navegador; o login usa retorno local (`localhost`).

As credenciais estão no `.gitignore`. O script não salva tokens de acesso em disco; a autenticação pode ser solicitada novamente em outra execução. Referências: [introdução à API](https://developers.google.com/youtube/v3/getting-started) e [OAuth para aplicativos instalados](https://developers.google.com/identity/protocols/oauth2/native-app).

## Lista de músicas

Edite `musicas.json`, que preserva sua lista original, ou use outro arquivo. Há uma lista pequena em `examples/musicas.json`.

```json
[
  { "title": "Sweet", "artist": "Cigarettes After Sex" },
  { "title": "Sparks", "artist": "Coldplay" }
]
```

A entrada deve ser um array não vazio, com `title` e `artist` como textos não vazios. A lista inteira é validada antes de autenticar ou criar a playlist.

## Uso

```sh
npm start
```

Por padrão, lê `musicas.json`, usa `credentials.json`, cria uma playlist **privada** chamada **soft** e espera 500 ms entre músicas. O terminal mostra o link da playlist e o progresso.

```sh
npm start -- --title "Minha playlist" --input examples/musicas.json
npm start -- --title "Favoritas" --privacy unlisted --delay 1000
npm start -- --help
```

| Opção | Padrão | Descrição |
| --- | --- | --- |
| `--input` | `musicas.json` | Lista de músicas |
| `--credentials` | `credentials.json` | Credenciais OAuth |
| `--title` | `soft` | Título da nova playlist |
| `--description` | `Playlist importada automaticamente via script Node.js.` | Descrição da nova playlist |
| `--privacy` | `private` | `private`, `unlisted` ou `public` |
| `--playlist-id` | — | Adiciona músicas a uma playlist existente |
| `--failures` | `falhas.json` | Arquivo de músicas pendentes |
| `--delay` | `500` | Intervalo em milissegundos; inteiro não negativo |
| `--help`, `-h` | — | Ajuda sem autenticar ou acessar a API |

Use `--` para encaminhar as opções pelo npm. Caminhos relativos usam a pasta atual; coloque caminhos e nomes com espaços entre aspas. Ao passar `--playlist-id`, título, descrição e privacidade não alteram a playlist existente.

### Tentar novamente as falhas

O script continua após falhas individuais. Ao terminar, grava apenas as músicas que falharam no mesmo formato da entrada. Uma execução sem falhas grava `[]`. O código de saída é `0` no sucesso e `1` se houver erro ou músicas pendentes.

Para repetir somente as falhas na playlist criada, copie o ID mostrado no terminal (o valor após `list=` no link):

```sh
npm start -- --input falhas.json --playlist-id "ID_DA_PLAYLIST" --failures falhas-retry.json
```

Use outro caminho para o novo relatório: o script impede que ele sobrescreva a entrada ou as credenciais. Antes da autenticação, o relatório é inicializado com todas as músicas e substituído pelo resultado ao final. Se o processo for interrompido, pode conter músicas já adicionadas; confira a playlist antes de repetir.

## Comportamento e limites

- Cada execução sem `--playlist-id` cria uma nova playlist.
- O primeiro resultado pode ser uma versão ao vivo, cover ou vídeo diferente do esperado. Não há confirmação manual.
- Não há deduplicação: repetir a lista em uma playlist existente pode adicionar músicas novamente.
- A pausa controla o ritmo, mas não reduz o consumo de cota. Busca e escrita estão sujeitas aos limites do projeto. Confira as cotas atuais no [Console](https://console.cloud.google.com/apis/dashboard) e na [documentação oficial](https://developers.google.com/youtube/v3/determine_quota_cost).
- O relatório é sobrescrito a cada execução; use nomes diferentes para manter históricos.

## Desenvolvimento

```sh
npm run typecheck
npm test
npm run build
npm run start:prod -- --help
npm run check
```

`npm start` executa TypeScript com `tsx`; `npm run build` gera JavaScript em `dist/`. `start:prod` exige compilação prévia. Os testes usam um cliente simulado e não criam playlists nem consomem cota. O CI executa tipos, testes e compilação a cada push ou pull request.

```text
src/
  config.ts       Opções e validação da linha de comando
  index.ts        Execução, autenticação e relatório
  songs.ts        Leitura e validação da lista
  youtube.ts      Autenticação OAuth e chamadas à API
  importer.ts     Importação e tratamento de falhas individuais
  types.ts        Tipos compartilhados
examples/         Lista mínima de exemplo
tests/            Testes locais sem acesso à API
musicas.json      Lista original
```

## Solução de problemas

| Problema | O que conferir |
| --- | --- |
| Credenciais não encontradas | Salve o JSON OAuth como `credentials.json` ou passe `--credentials` |
| Login bloqueado / `access_denied` | Confira o usuário de teste, o cliente Desktop e a configuração de consentimento |
| API desabilitada / `accessNotConfigured` | Habilite a YouTube Data API v3 no projeto das credenciais |
| Cota excedida / `quotaExceeded` | Consulte as cotas no Console e tente as músicas pendentes após a renovação |
| Erro ao adicionar em playlist existente | Use uma playlist editável pela conta autenticada e confira o ID |
| JSON inválido | Confira aspas, vírgulas e os campos `title` e `artist` |

## Licença

[MIT](LICENSE) © 2026 Guilherme Garcia Pinto.
