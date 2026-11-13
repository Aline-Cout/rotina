# Minha Rotina

Aplicação web estática para organizar rotinas de plantão, folga e tarefas diárias.

## Como abrir

Abra `ROTINA.html` no navegador. Não precisa instalar dependências nem contratar serviços. O projeto pode ser publicado em hospedagem estática gratuita.

## Dados e privacidade

As configurações e tarefas são gravadas no armazenamento local do navegador. Elas permanecem no mesmo navegador e endereço da aplicação; não são enviadas para uma conta Google ou servidor e não sincronizam automaticamente entre dispositivos.

Use **Ajustes → Seus dados → Baixar cópia de segurança** para exportar os dados. Em outro navegador, abra o app e use **Restaurar cópia**. Uma cópia baixada é a forma de transferir ou recuperar as informações.

Os dados de versões anteriores (`appSettings`, `appTemplates`, `appOverrides`, `appChecks` e `appDayExtras`) são lidos e migrados para o armazenamento unificado `rotinaAppData` na primeira abertura desta versão.

## Arquivos

- `ROTINA.html`: estrutura da aplicação.
- `styles.css`: apresentação e adaptação a telas menores.
- `app.js`: lógica, ciclo de plantão, persistência e backups.

