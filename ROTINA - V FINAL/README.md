# Minha Rotina

Painel web responsivo para organizar tarefas e rotinas em um quadro de fluxo. Funciona no computador e no celular.

## Usar o painel

Abra `ROTINA.html` por um servidor HTTPS ou servidor local. O app já está conectado ao Firebase `minha-rotinha-organizacao`, com autenticação por e-mail e senha e sincronização pelo Cloud Firestore. Não é necessário ter conta Google para entrar no painel.

Na tela de acesso, crie uma conta com um e-mail válido e senha de pelo menos 6 caracteres. Use a mesma conta nos dispositivos em que deseja ver seus dados. A primeira conta salva na nuvem os dados que já estiverem no navegador. A cópia local e o backup JSON continuam disponíveis.

## Firebase e privacidade

- Projeto no plano **Spark (gratuito)**, sem faturamento associado.
- Autenticação por e-mail e senha ativada.
- Banco Firestore localizado em `southamerica-east1` (São Paulo).
- Os dados ficam em `users/{uid}/appData/main`. As regras em `firestore.rules` limitam cada conta ao próprio UID.
- `firebase-config.js` contém a configuração pública do app Web. Essa configuração não é senha; o controle de acesso aos dados é feito pelas regras do Firestore.

Para publicar em outro domínio, hospede os arquivos por HTTPS e adicione o domínio em **Firebase Console → Authentication → Settings → Authorized domains**. Não associe faturamento nem altere o projeto para o plano Blaze se a exigência é manter o uso gratuito.

O Spark tem limites de uso. Consulte os [limites atuais do Firestore](https://firebase.google.com/docs/firestore/pricing) e os [planos do Firebase](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans). Ao exceder cotas, alguns serviços podem ficar temporariamente indisponíveis.

## Arquivos

- `ROTINA.html`: estrutura do painel e tela de acesso.
- `styles.css`: apresentação responsiva.
- `app.js`: quadro, armazenamento local, autenticação e sincronização.
- `firebase-config.js`: configuração pública do app Web Firebase.
- `firestore.rules`: regras de acesso por usuário.

Os dados antigos (`appSettings`, `appTemplates`, `appOverrides`, `appChecks` e `appDayExtras`) são importados para `rotinaAppData` na primeira abertura desta versão.

