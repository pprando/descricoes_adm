# Acompanhamento de Descrições ADM

Aplicação para consultar e acompanhar descrições e feedbacks registrados. A página inicial leva diretamente ao histórico, onde é possível pesquisar registros e visualizar seus detalhes.

## Acesso de gestores

O histórico e a API são restritos a gestores. Configure uma senha compartilhada (mínimo de 12 caracteres) e um segredo de sessão aleatório (mínimo de 32 caracteres). As credenciais não devem ser incluídas no código-fonte.

### Desenvolvimento local

Copie `.dev.vars.example` para `.dev.vars` e substitua os valores por segredos reais. O arquivo `.dev.vars` é ignorado pelo Git.

### Cloudflare

Configure os segredos no Worker:

```bash
npx wrangler secret put MANAGER_PASSWORD
npx wrangler secret put MANAGER_SESSION_SECRET
```

As sessões expiram após 8 horas e usam cookie `HttpOnly`, `SameSite=Strict` e `Secure` em produção.

## Requisitos

- Node.js
- pnpm

## Executar localmente

Instale as dependências:

```bash
pnpm install
```

Inicie o servidor de desenvolvimento em `http://localhost:3000`:

```bash
pnpm dev
```

## Verificações

```bash
pnpm lint
pnpm typecheck
pnpm build
```
