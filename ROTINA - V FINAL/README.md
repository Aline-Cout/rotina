# Minha Rotina

Painel responsivo de organização pessoal em formato de quadro. O app está publicado no GitHub Pages e sincroniza contas pelo Firebase.

## Abrir e começar

Acesse [Minha Rotina](https://aline-cout.github.io/rotina/ROTINA%20-%20V%20FINAL/ROTINA.html) no computador ou celular. Crie uma conta com seu e-mail e uma senha própria do app; não precisa entrar com Google. Use essa mesma conta nos outros aparelhos.

Se este navegador tiver dados de uma versão antiga, o app perguntará antes de importá-los para a nuvem. Confira se a cópia pertence a você. Em Ajustes, baixe um backup JSON, restaure uma cópia ou exclua sua conta e os dados sincronizados.

## Privacidade e beta

O código e a configuração do app Web são públicos. Dados de rotina são gravados em `users/{uid}/appData/main`, e as regras do Firestore limitam cada conta ao próprio UID. O Firebase Authentication gerencia as senhas. O navegador também mantém uma cópia local para uso e recuperação. Leia [`PRIVACIDADE.html`](PRIVACIDADE.html) no app antes de participar do beta e evite inserir informações altamente confidenciais.

O link **Enviar feedback** abre uma solicitação pública no GitHub. Não inclua dados privados nessa solicitação.

## Uso gratuito

O projeto usa GitHub Pages e Firebase no plano Spark. Não associe faturamento nem mude para um plano pago. Os serviços têm cotas gratuitas e podem limitar o acesso caso sejam excedidas; veja os [limites do Firestore](https://firebase.google.com/docs/firestore/pricing) e os [planos do Firebase](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans).

## Arquivos

- `ROTINA.html`: painel, login e telas de escolha/importação.
- `styles.css`: interface responsiva para desktop e celular.
- `app.js`: quadro, backup local, autenticação e sincronização por conta.
- `firebase-config.js`: configuração pública do app Web Firebase.
- `firestore.rules`: regras de acesso por usuário.
- `PRIVACIDADE.html`: aviso sobre dados, serviços e beta.

Os dados locais antigos (`appSettings`, `appTemplates`, `appOverrides`, `appChecks` e `appDayExtras`) são reconhecidos como cópia local e nunca enviados sem escolha explícita.

