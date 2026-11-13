# Minha Rotina

Painel web responsivo para organizar tarefas, rotinas de plantão e folga em um quadro de fluxo.

## Uso local

Abra `ROTINA.html` em um navegador moderno. Sem configuração Firebase, o painel funciona sem conta e grava tudo no armazenamento local do navegador. Use **Ajustes → Seus dados** para exportar ou restaurar uma cópia JSON. Dados locais permanecem somente naquele navegador e dispositivo.

## Ativar sincronização gratuita

O app usa Firebase Authentication com e-mail/senha e Cloud Firestore. A pessoa que usa o app não precisa de conta Google. O projeto Firebase é administrado por sua proprietária, que precisa de uma conta Google para criar/configurar o projeto; isso não é usado como login do app.

1. Crie um projeto Firebase no [console Firebase](https://console.firebase.google.com/) e mantenha o plano **Spark (sem custo)**; não associe uma conta de faturamento.
2. Em **Authentication → Sign-in method**, ative **E-mail/senha**.
3. Em **Firestore Database**, crie o banco de dados e publique o conteúdo do arquivo `firestore.rules` na aba **Regras**.
4. Registre um app da Web nas configurações do projeto. Copie `apiKey`, `authDomain`, `projectId` e `appId` para `firebase-config.js`, substituindo os valores `PREENCHER_...`.
5. Hospede a pasta em um serviço estático que ofereça HTTPS (por exemplo, GitHub Pages) e autorize o domínio em **Authentication → Settings → Authorized domains**.
6. Abra o site, crie sua conta com qualquer e-mail válido e senha com ao menos 6 caracteres. O primeiro login salva na nuvem os dados que já estavam nesse navegador. Depois, entre na mesma conta em outro dispositivo.

O Firestore grava em `users/{uid}/appData/main`; as regras permitem que cada conta leia e altere somente o documento correspondente ao próprio UID. A cópia local continua sendo atualizada e o backup JSON segue disponível.

O plano gratuito tem cotas. A referência atual do Firebase informa 1 GiB armazenado, até 50 mil leituras/dia e 20 mil gravações/dia no Firestore; os limites podem mudar e, sem faturamento no Spark, serviços podem ficar indisponíveis ao exceder cotas. Confira os [limites e preços do Firestore](https://firebase.google.com/docs/firestore/pricing) e os [planos Firebase](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans). Não habilite o plano Blaze se a exigência é não pagar.

## Arquivos

- `ROTINA.html`: estrutura do painel e tela de acesso.
- `styles.css`: apresentação responsiva.
- `app.js`: lógica do quadro, persistência local, autenticação e sincronização.
- `firebase-config.js`: configuração pública do app web Firebase (preencher para sincronizar).
- `firestore.rules`: regras para separar e proteger os dados por conta.

Os dados antigos (`appSettings`, `appTemplates`, `appOverrides`, `appChecks` e `appDayExtras`) são importados para `rotinaAppData` na primeira abertura desta versão.

