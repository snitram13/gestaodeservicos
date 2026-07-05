/**
 * Migração para MULTI-EMPRESA (isolamento por tenant).
 *
 * Idempotente e NÃO destrutivo:
 *  1. cria a tabela `empresa` (tenant + perfil, absorve a antiga `configuracao`);
 *  2. adiciona `empresa_id` (nullable) a todas as tabelas de negócio;
 *  3. cria/reutiliza a empresa "PN Reparações" a partir da `configuracao` atual;
 *  4. faz backfill de `empresa_id` em TODAS as linhas + utilizadores existentes;
 *  5. define os contadores de numeração da empresa (max(numero)+1);
 *  6. remove o `unique(numero)` global e o default `nextval`; numeração passa a
 *     ser por empresa — `unique(empresa_id, numero)`;
 *  7. aplica NOT NULL + FKs + índices;
 *  8. aplica RLS por empresa (defesa em profundidade; a app usa Drizzle, que
 *     contorna o RLS, mas protege qualquer acesso pela API pública/anon).
 *
 * Executar: npx tsx scripts/migrar-multiempresa.ts
 */
import { config } from "dotenv"
import postgres from "postgres"

config({ path: ".env.local" })

// Todas as tabelas de negócio que passam a ter empresa_id.
const TABELAS = [
  "utilizador",
  "cliente",
  "visita",
  "servico",
  "orcamento",
  "orcamento_item",
  "foto",
  "avaliacao",
  "transacao_financeira",
  "produto_estoque",
]

// Tabelas de dados de negócio (RLS por empresa). `utilizador`/`empresa` ficam
// com política permissiva-autenticada para evitar recursão na subquery.
const DATA_TABLES = TABELAS.filter((t) => t !== "utilizador")

async function main() {
  const url = process.env.MIGRATION_URL || process.env.DATABASE_URL
  if (!url) throw new Error("Falta MIGRATION_URL / DATABASE_URL no .env.local")
  const sql = postgres(url, { prepare: false, max: 1 })

  // 1. Tabela empresa ----------------------------------------------------
  await sql.unsafe(`
    create table if not exists empresa (
      id uuid primary key default gen_random_uuid(),
      nome text not null default 'A minha empresa',
      slogan text,
      nif text,
      telefone text,
      email text,
      morada text,
      iban text,
      logo_path text,
      prox_num_visita integer not null default 1,
      prox_num_orcamento integer not null default 1,
      ativo boolean not null default true,
      criado_em timestamptz not null default now(),
      atualizado_em timestamptz not null default now()
    )
  `)
  // Coluna de data-limite de acesso (trial/mensalidade), adicionada mais tarde.
  await sql.unsafe(
    `alter table empresa add column if not exists acesso_ate timestamptz`
  )
  // Nº de lugares de funcionário (preço por funcionário).
  await sql.unsafe(
    `alter table empresa add column if not exists limite_funcionarios integer not null default 0`
  )
  // Módulos opcionais ativos por empresa.
  await sql.unsafe(
    `alter table empresa add column if not exists modulos text[] not null default '{}'::text[]`
  )
  // Assinatura do cliente na visita (módulo Ordens de Serviço).
  await sql.unsafe(
    `alter table visita add column if not exists assinatura_path text`
  )
  // Local da obra no orçamento.
  await sql.unsafe(`alter table orcamento add column if not exists morada text`)
  await sql.unsafe(`alter table orcamento add column if not exists cidade text`)
  // Taxa de IVA por omissão dos orçamentos (por empresa).
  await sql.unsafe(
    `alter table empresa add column if not exists taxa_iva_padrao numeric(4,2) not null default 23`
  )
  console.log("✓ tabela empresa")

  // Ledger de pagamentos da plataforma (mensalidades pagas pelos tenants).
  // Sem política RLS → só acessível via Drizzle (owner); nunca pela API pública.
  await sql.unsafe(`
    create table if not exists pagamento (
      id uuid primary key default gen_random_uuid(),
      empresa_id uuid not null references empresa(id) on delete cascade,
      valor numeric(10,2) not null,
      data date not null,
      periodo_ate timestamptz,
      criado_em timestamptz not null default now()
    )
  `)
  await sql.unsafe(
    `create index if not exists idx_pagamento_empresa on pagamento (empresa_id)`
  )
  await sql.unsafe(`alter table pagamento enable row level security`)
  console.log("✓ tabela pagamento")

  // 2. Colunas empresa_id (nullable primeiro) ----------------------------
  for (const t of TABELAS) {
    await sql.unsafe(`alter table "${t}" add column if not exists empresa_id uuid`)
  }
  console.log("✓ colunas empresa_id adicionadas")

  // 3. Empresa "PN Reparações" (reutiliza a mais antiga, se já existir) ---
  const existentes = await sql`select id from empresa order by criado_em asc limit 1`
  let pnId: string
  if (existentes.length > 0) {
    pnId = existentes[0].id as string
    console.log(`ℹ empresa já existia (${pnId}) — reutilizada`)
  } else {
    const temConfig = await sql`select to_regclass('public.configuracao') as t`
    let cfg: Record<string, unknown> | null = null
    if (temConfig[0].t) {
      const rows = await sql`select * from configuracao order by atualizado_em desc limit 1`
      cfg = rows[0] ?? null
    }
    const ins = await sql`
      insert into empresa (nome, slogan, nif, telefone, email, morada, iban, logo_path)
      values (
        ${(cfg?.nome_empresa as string) ?? "PN Reparações"},
        ${(cfg?.slogan as string) ?? null},
        ${(cfg?.nif as string) ?? null},
        ${(cfg?.telefone as string) ?? null},
        ${(cfg?.email as string) ?? null},
        ${(cfg?.morada as string) ?? null},
        ${(cfg?.iban as string) ?? null},
        ${(cfg?.logo_path as string) ?? null}
      )
      returning id
    `
    pnId = ins[0].id as string
    console.log(`✓ empresa "PN Reparações" criada (${pnId})`)
  }

  // 4. Backfill empresa_id ----------------------------------------------
  for (const t of TABELAS) {
    const r = await sql.unsafe(
      `update "${t}" set empresa_id = '${pnId}' where empresa_id is null`
    )
    if (r.count > 0) console.log(`  · ${t}: ${r.count} linhas atribuídas`)
  }
  console.log("✓ backfill concluído")

  // 5. Contadores de numeração (max+1) ----------------------------------
  await sql`
    update empresa set
      prox_num_visita = greatest(
        prox_num_visita,
        coalesce((select max(numero) from visita where empresa_id = ${pnId}), 0) + 1
      ),
      prox_num_orcamento = greatest(
        prox_num_orcamento,
        coalesce((select max(numero) from orcamento where empresa_id = ${pnId}), 0) + 1
      )
    where id = ${pnId}
  `
  console.log("✓ contadores de numeração definidos")

  // 6. Numeração por empresa: remover unique global + default nextval ----
  for (const t of ["visita", "orcamento"]) {
    await sql.unsafe(`
      do $$
      declare r record;
      begin
        for r in
          select conname from pg_constraint
          where conrelid = '${t}'::regclass and contype = 'u' and conname like '%numero%'
        loop
          execute 'alter table "${t}" drop constraint ' || quote_ident(r.conname);
        end loop;
      end $$;
    `)
    await sql.unsafe(`alter table "${t}" alter column numero drop default`)
    await sql.unsafe(`alter table "${t}" alter column numero set not null`)
  }
  // produto_estoque.sku deixa de ser unique global → unique por empresa
  await sql.unsafe(`
    do $$
    declare r record;
    begin
      for r in
        select conname from pg_constraint
        where conrelid = 'produto_estoque'::regclass and contype = 'u' and conname like '%sku%'
      loop
        execute 'alter table produto_estoque drop constraint ' || quote_ident(r.conname);
      end loop;
    end $$;
  `)
  console.log("✓ numeração convertida para por-empresa")

  // 7. NOT NULL + FKs + índices -----------------------------------------
  for (const t of TABELAS) {
    await sql.unsafe(`alter table "${t}" alter column empresa_id set not null`)
    const fk = `${t}_empresa_id_empresa_id_fk`
    await sql.unsafe(`
      do $$ begin
        if not exists (select 1 from pg_constraint where conname = '${fk}') then
          alter table "${t}" add constraint "${fk}"
            foreign key (empresa_id) references empresa(id) on delete cascade;
        end if;
      end $$;
    `)
  }
  const indices = [
    `create index if not exists idx_utilizador_empresa on utilizador (empresa_id)`,
    `create index if not exists idx_cliente_empresa_nome on cliente (empresa_id, nome)`,
    `create index if not exists idx_cliente_empresa_cidade on cliente (empresa_id, cidade)`,
    `create unique index if not exists uq_visita_empresa_numero on visita (empresa_id, numero)`,
    `create index if not exists idx_visita_empresa_agendado on visita (empresa_id, agendado_para)`,
    `create index if not exists idx_visita_empresa_estado_agendado on visita (empresa_id, estado, agendado_para)`,
    `create index if not exists idx_visita_tecnico on visita (tecnico_id)`,
    `create index if not exists idx_servico_empresa on servico (empresa_id)`,
    `create unique index if not exists uq_orcamento_empresa_numero on orcamento (empresa_id, numero)`,
    `create index if not exists idx_orcamento_empresa_estado on orcamento (empresa_id, estado)`,
    `create index if not exists idx_tx_empresa_data on transacao_financeira (empresa_id, data)`,
    `create index if not exists idx_tx_empresa_tipo_data on transacao_financeira (empresa_id, tipo, data)`,
    `create index if not exists idx_produto_empresa on produto_estoque (empresa_id)`,
    `create unique index if not exists uq_produto_empresa_sku on produto_estoque (empresa_id, sku)`,
  ]
  for (const i of indices) await sql.unsafe(i)
  console.log("✓ NOT NULL + FKs + índices")

  // 8. RLS por empresa (defesa em profundidade) -------------------------
  // empresa: só membros da empresa
  await sql.unsafe(`alter table empresa enable row level security`)
  await sql.unsafe(`drop policy if exists "empresa_membro" on empresa`)
  await sql.unsafe(`
    create policy "empresa_membro" on empresa for all to authenticated
    using (id in (select empresa_id from utilizador where id = auth.uid()))
    with check (id in (select empresa_id from utilizador where id = auth.uid()))
  `)
  // utilizador: permissiva-autenticada (evita recursão nas subqueries acima)
  await sql.unsafe(`alter table utilizador enable row level security`)
  await sql.unsafe(`drop policy if exists "utilizador_auth_all" on utilizador`)
  await sql.unsafe(`
    create policy "utilizador_auth_all" on utilizador for all to authenticated
    using (true) with check (true)
  `)
  // tabelas de dados: só a empresa do utilizador
  for (const t of DATA_TABLES) {
    await sql.unsafe(`alter table "${t}" enable row level security`)
    await sql.unsafe(`drop policy if exists "${t}_auth_all" on "${t}"`)
    await sql.unsafe(`drop policy if exists "${t}_empresa" on "${t}"`)
    await sql.unsafe(`
      create policy "${t}_empresa" on "${t}" for all to authenticated
      using (empresa_id in (select empresa_id from utilizador where id = auth.uid()))
      with check (empresa_id in (select empresa_id from utilizador where id = auth.uid()))
    `)
  }
  console.log("✓ RLS por empresa aplicado")

  await sql.end()
  console.log(`\n✅ Migração multi-empresa concluída. Empresa PN: ${pnId}`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ Erro na migração:", e)
    process.exit(1)
  })
