# Minha Rotina

Painel web estático para organizar tarefas, rotinas de plantão e folga, e calendário pessoal.

## Como abrir

Abra `ROTINA.html` no navegador. A visão geral funciona como um quadro de fluxo: cada tarefa aparece como cartão em **A fazer**, **Em andamento** ou **Concluído**. Arraste os cartões entre as colunas ou altere a etapa no menu do cartão. Não precisa instalar dependências nem contratar serviços. O projeto pode ser publicado em hospedagem estática gratuita.

## Dados e privacidade

As configurações e tarefas são gravadas no armazenamento local do navegador. Elas permanecem no mesmo navegador e endereço da aplicação; não são enviadas para uma conta Google ou servidor e não sincronizam automaticamente entre dispositivos.

Use **Ajustes → Seus dados → Baixar cópia de segurança** para exportar os dados. Em outro navegador, abra o app e use **Restaurar cópia**. Uma cópia baixada é a forma de transferir ou recuperar as informações.

Os dados de versões anteriores (`appSettings`, `appTemplates`, `appOverrides`, `appChecks` e `appDayExtras`) são lidos e migrados para o armazenamento unificado `rotinaAppData` na primeira abertura desta versão.

## Arquivos

- `ROTINA.html`: estrutura do painel e das telas.
- `styles.css`: apresentação e adaptação a telas menores.
- `app.js`: lógica, ciclo de plantão, persistência e backups.

