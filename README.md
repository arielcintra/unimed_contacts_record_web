# Agenda de Contatos — Web

Frontend da Agenda de Contatos: login, consulta de contatos com busca, filtros e paginação, cadastro e edição, inativação/reativação, favoritos e importação de CSV com acompanhamento do processamento. Consome a API REST do repositório [`unimed_contacts_record_api`](../unimed_contacts_record_api).

## Stack

| Item | Escolha |
|---|---|
| Framework | React 19 + Vite |
| Linguagem | TypeScript (modo `strict`) |
| Componentes e estilo | Material UI (com textos em pt-BR) e ícones `@mui/icons-material`; tema com a paleta da Unimed em `src/presentation/theme.ts` |
| Rotas | React Router |
| Estado do servidor (cache, paginação, *polling*) | TanStack Query |
| Testes | Vitest, Testing Library, jsdom |
| Lint | ESLint com `typescript-eslint` |
| Servidor em produção / Docker | nginx |

## Pré-requisitos

- [Node.js 24](https://nodejs.org/)
- API em execução (veja o README da API)

## Como executar

### Desenvolvimento

```bash
npm install
npm run dev
```

A aplicação sobe em http://localhost:5173. Credenciais de desenvolvimento: `admin@unimed.local` / `Admin@123`.

### Com Docker

O frontend é construído e iniciado pelo `docker-compose.yml` do repositório da API, junto com o banco, o RabbitMQ e a API. Clone os dois repositórios lado a lado e, na pasta da API, execute `docker compose up --build`. O frontend fica em http://localhost:3000.

### Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm test` | Executa os testes uma vez |
| `npm run test:watch` | Executa os testes em modo observação |
| `npm run build` | Verifica os tipos (`tsc`) e gera o build de produção em `dist/` |
| `npm run lint` | Executa o ESLint |
| `npm run preview` | Serve o build de produção localmente |

## Telas

| Tela | O que faz |
|---|---|
| **Login** | Autenticação com e-mail e senha |
| **Contatos** | Busca por nome, e-mail ou telefone (com *debounce*), filtros de status (ativos / inativos / todos) e de favoritos, paginação no servidor, favoritar, inativar/reativar, cadastrar e editar |
| **Importações** | Envio de CSV, histórico com status e contadores atualizados automaticamente enquanto o arquivo é processado, e detalhes com as linhas não importadas (filtro por inválidas / duplicadas) e os motivos |

## Arquitetura

Clean Architecture adaptada ao React, com dependências apontando para dentro:

```
presentation ──► application ──► domain
                     ▲
infrastructure ──────┘        main.tsx (composition root) liga os adaptadores às portas
```

| Camada | Pasta | Responsabilidade |
|---|---|---|
| Domain | `src/domain` | Tipos do domínio (`Contact`, `ContactImport`, `Session`, `Page`) e funções puras de exibição. Sem React e sem HTTP. |
| Application | `src/application` | **Portas** (`ContactRepository`, `ImportRepository`, `AuthGateway`, `TokenStorage`), casos de uso em hooks (`useContacts`, `useSaveContact`, `useImports`...), estado de autenticação e o contrato de erro `AppError`. |
| Infrastructure | `src/infrastructure` | **Adaptadores**: `ApiClient` (fetch), repositórios HTTP, armazenamento do token e conversão dos DTOs da API para o domínio. |
| Presentation | `src/presentation` | Páginas e componentes MUI, rotas, tema e notificações. |

O `main.tsx` é o único lugar que conhece as implementações concretas: cria os adaptadores HTTP e os entrega às telas por um `ServicesProvider`. Nos testes, o mesmo provider recebe repositórios falsos.

### Sem duplicar regras do backend

- **Validação só na API:** o formulário envia o que foi digitado, e a mensagem da API (por exemplo, "Já existe um contato com este telefone.") é exibida como veio. O front não repete as regras de telefone, e-mail ou unicidade.
- **Normalização só na API:** o telefone é enviado como digitado (`(11) 98765-4321`); a API guarda só os dígitos. O `formatPhone` do front apenas formata para exibição o que a API devolve.
- **Status e contadores da importação** vêm prontos da API; o front só decide se continua consultando (`isImportRunning`).

### Design patterns

| Padrão | Onde | Problema que resolve |
|---|---|---|
| **Repository + Ports & Adapters** | `ContactRepository` → `HttpContactRepository` | As telas não conhecem URLs nem `fetch`; testes com repositórios falsos |
| **Adapter / Mapper** | DTOs da API → tipos do domínio | Mudanças no contrato da API ficam contidas nos adaptadores |
| **Injeção de dependência** | `ServicesProvider` (Context) | Trocar implementações sem alterar componentes |
| **Interceptor** | `ApiClient` | Anexa o token, converte ProblemDetails em `AppError` e trata o `401` |
| **Observer** | `SessionExpiry` e cache do TanStack Query | Abre um único diálogo de login para várias requisições; telas atualizam após mutações; *polling* das importações; a conclusão de uma importação atualiza as listas de contatos |
| **Facade** | Hooks de caso de uso | O componente chama `useSaveContact()` sem saber de cache, invalidação ou HTTP |
| **Container / Presentational** | `ContactsPage` / `ContactsTable`, `ImportsPage` / `ImportsTable` | Componentes visuais sem estado, fáceis de testar |

## Integração com a API

O frontend sempre chama a API pelo caminho relativo `/api`, sem URL fixa no código:

| Ambiente | Quem encaminha `/api` | Destino |
|---|---|---|
| `npm run dev` | Proxy do Vite (`vite.config.ts`) | http://localhost:5251 |
| Docker | nginx (`nginx.conf`) | Serviço `api` do compose |

Assim o navegador fala com a mesma origem nos dois casos: não é preciso configurar CORS nem gerar um build diferente por ambiente. O nginx resolve o endereço da API a cada requisição (DNS interno do Docker), então continua funcionando quando o container da API é recriado.

## Contatos importados na tela de contatos

A importação é assíncrona: a API responde na hora e grava os contatos em lotes, em segundo plano. Para que os contatos importados apareçam na tela de contatos sem o usuário precisar recarregar nada, foram tomadas três decisões:

| Situação | Decisão | Como funciona |
|---|---|---|
| O usuário volta para a aba Contatos depois que a importação terminou | **Buscar a lista de novo ao abrir a tela** | Comportamento padrão do TanStack Query (dados considerados desatualizados imediatamente): a lista guardada em cache antes da importação não é reaproveitada. |
| Uma importação termina | **Marcar todas as listas de contatos como desatualizadas** | O *polling* das importações compara as importações em andamento com as da consulta anterior; quando uma deixa de estar em andamento, as listas de contatos são invalidadas e buscadas de novo. Isso garante que o último lote apareça, mesmo que a última atualização periódica tenha acontecido antes dele. |
| O usuário está na aba Contatos enquanto a importação ainda está em andamento | **Atualizar a lista periodicamente enquanto houver importação em andamento** | A tela de contatos consulta as importações recentes e, se alguma estiver em andamento, atualiza a lista a cada 2 segundos e mostra o aviso "Há uma importação em andamento". Quando não há mais importação em andamento, as atualizações periódicas param. |

Detalhes:

- **Sem requisições duplicadas:** a consulta de "importações em andamento" usa o mesmo cache em todas as telas, então a lista de contatos e o aviso fazem uma única requisição.
- **Atualizações só com a aba visível:** o TanStack Query pausa as atualizações periódicas quando a aba do navegador fica em segundo plano.
- **Premissa:** importações em andamento são sempre as mais recentes, então a tela de contatos consulta apenas a primeira página do histórico (20 importações) para detectá-las.
- **Ordem e filtros continuam valendo:** os contatos importados nascem ativos (aparecem no filtro padrão) e a lista é ordenada por nome, então podem estar em outra página; a busca os encontra.

O teste `ImportedContactsVisibility.test.tsx` cobre as três situações com as telas reais.

## Sessão expirada sem perda de dados

O token da API vale 60 minutos (configurável na API) e não há *refresh token*. Para que o usuário não perca o que está fazendo quando ele expira:

1. Uma requisição recebe `401`.
2. O `ApiClient` pausa a requisição e o `SessionExpiry` abre o diálogo **"Sessão expirada" por cima da tela atual**. A tela não é desmontada, então o formulário continua preenchido.
3. Se várias requisições falharem ao mesmo tempo, todas aguardam o **mesmo** login e o diálogo aparece uma vez só.
4. Depois do login, cada requisição pausada é **reenviada uma única vez** com o novo token, e o salvamento termina com os dados digitados.
5. Se o usuário escolher sair, as requisições pausadas são canceladas e ele volta para a tela de login.

O teste `SessionExpiredDialog.test.tsx` cobre esse fluxo com o `ApiClient` e o repositório HTTP reais (apenas a rede é simulada).

## Armazenamento do token

**Decisão:** o token fica no `sessionStorage`.

- Sobrevive a um recarregamento da página (o usuário não precisa logar de novo a cada F5).
- É descartado quando a aba é fechada, e não é compartilhado entre abas.
- É simples: não exige mudanças na API nem configuração de cookies, CORS ou proteção contra CSRF.

**Risco aceito:** qualquer script executado na página consegue ler o `sessionStorage`. Em caso de uma falha de XSS, o token poderia ser roubado. O React escapa o conteúdo renderizado por padrão e o projeto não usa `dangerouslySetInnerHTML`, o que reduz esse risco, mas não o elimina.

**Alternativa mais segura (não adotada):** guardar o token em um **cookie `HttpOnly`, `Secure` e `SameSite=Strict`**, emitido pela API no login. O JavaScript da página não consegue ler esse cookie, então um XSS não roubaria o token. Exigiria:

- a API emitir e ler o cookie no lugar do cabeçalho `Authorization`;
- proteção contra CSRF (o `SameSite=Strict` ajuda; um token anti-CSRF completaria);
- um endpoint de logout na API para apagar o cookie.

Por questão de prazo e complexidade, optamos pela solução mais simples e rápida de implementar, deixando a alternativa documentada como evolução.

## Testes

```bash
npm test
```

| Camada | O que cobre |
|---|---|
| Domain | Formatação de telefone; validade da sessão |
| Application | Coordenação da sessão expirada (um único login para várias requisições, cancelamento); regra de *polling* das importações e detecção de importação concluída |
| Infrastructure | `ApiClient` (token, query string, ProblemDetails → `AppError`, `401` → novo login → reenvio único); tradução dos filtros e dos verbos HTTP no repositório de contatos; armazenamento do token |
| Presentation | Login; contatos (listagem, busca com *debounce*, filtros, favoritar, inativar, cadastrar, editar, erro da API mantendo o formulário); importações (upload, erro, detalhes por tipo, falha); **contatos importados aparecendo na tela de contatos** (ao voltar para a aba, ao concluir a importação e durante o processamento); **sessão expirada sem perder os dados do formulário** |

Os testes de tela usam todos os providers reais (`AppProviders`) com serviços falsos, sem servidor e sem biblioteca de *mock* de rede: a injeção de dependência já permite substituir os repositórios.

## Limitações

- **Paleta da Unimed baseada na identidade visual pública** (verde `#00995D`, verde escuro `#0A5F55`, verde claro `#B1D34B`, laranja `#F47920`); os códigos devem ser conferidos com o manual oficial da marca. Texto branco sobre o verde `#00995D` tem contraste de cerca de 3,7:1, abaixo dos 4,5:1 recomendados pela WCAG AA para texto pequeno; usar o verde escuro nos botões resolveria, ao custo de se afastar da cor principal.
- **Token no `sessionStorage`** (veja "Armazenamento do token").
- **Bundle único de ~700 kB** (sem *code splitting*): aceitável para uma aplicação interna com poucas telas; carregar as rotas sob demanda (`React.lazy`) reduziria o carregamento inicial.
- **Sem validação no cliente:** os erros só aparecem depois de enviar o formulário, já que as regras ficam apenas na API (decisão para não duplicá-las).
- **Polling a cada 2 segundos** enquanto houver importação em andamento (na tela de importações e na de contatos); notificações em tempo real (SSE ou WebSocket) evitariam requisições sem novidade.
