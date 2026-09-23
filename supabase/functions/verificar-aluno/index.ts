/**
 * verificar-aluno — responde se um e-mail pertence a um aluno elegível ao
 * upgrade da Implementação (https://implementacao.rodrigorosar.com.br/upgrade/).
 *
 * Desenho e limites, de propósito:
 *
 * - A resposta é só `{ elegivel: boolean }`. Nunca devolve nome, curso, data ou
 *   qualquer dado do aluno: quem chama é uma página pública.
 * - A credencial do banco vive em variável de ambiente da função, nunca no
 *   navegador.
 * - CORS restrito à origem do site. Isso não impede chamada via curl (nada
 *   impede), mas impede que outro site embuta o endpoint.
 * - Limite de tentativas por IP, contado no banco. Em memória não funciona aqui:
 *   cada chamada roda numa instância nova (15 chamadas seguidas geraram 15
 *   execution_id distintos em 23/09/2026), então o contador nasceria zerado
 *   sempre. Reduz enumeração em massa de e-mails; não é um cofre — o dado
 *   exposto é "esta pessoa é aluna", não credencial.
 *
 * Elegibilidade (definida com o Rodrigo em 23/09/2026): possuir grant do curso
 * "Certificação Projeto de Primeira", INCLUSIVE revogado — ex-aluno que perdeu
 * acesso também pode fazer o upgrade.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const CURSO_ELEGIVEL = 'Certificação Projeto de Primeira';

const ORIGENS_PERMITIDAS = new Set([
  'https://implementacao.rodrigorosar.com.br',
  'http://localhost:3000',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
]);

function cabecalhosCors(origem: string | null): Record<string, string> {
  const permitida = origem && ORIGENS_PERMITIDAS.has(origem) ? origem : 'https://implementacao.rodrigorosar.com.br';
  return {
    'Access-Control-Allow-Origin': permitida,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, authorization, apikey',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function json(corpo: unknown, status: number, origem: string | null): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...cabecalhosCors(origem), 'Content-Type': 'application/json; charset=utf-8' },
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req: Request) => {
  const origem = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cabecalhosCors(origem) });
  }
  if (req.method !== 'POST') {
    return json({ erro: 'metodo_nao_permitido' }, 405, origem);
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('cf-connecting-ip') ||
    'desconhecido';

  let email: string;
  try {
    const corpo = await req.json();
    email = String(corpo?.email ?? '').trim().toLowerCase();
  } catch {
    return json({ erro: 'corpo_invalido' }, 400, origem);
  }

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return json({ erro: 'email_invalido' }, 400, origem);
  }

  const url = Deno.env.get('SUPABASE_URL');
  const chave = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !chave) {
    console.error('verificar-aluno: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente no ambiente');
    return json({ erro: 'configuracao_ausente' }, 500, origem);
  }

  const db = createClient(url, chave, { auth: { persistSession: false } });

  // Limite de tentativas: 12 por IP a cada 10 minutos, contado no banco.
  // Se a própria checagem falhar, seguimos em frente: limitar é defesa contra
  // enumeração, e não vale derrubar a verificação de um aluno legítimo por isso.
  const { data: dentroDoLimite, error: erroLimite } = await db.rpc('registrar_tentativa_upgrade', { p_ip: ip });
  if (erroLimite) {
    console.error('verificar-aluno: falha ao registrar tentativa', erroLimite.message);
  } else if (dentroDoLimite === false) {
    return json({ erro: 'muitas_tentativas' }, 429, origem);
  }

  // student_access_grants não guarda e-mail; ele vive em students.
  const { data: aluno, error: erroAluno } = await db
    .from('students')
    .select('id')
    .ilike('email', email)
    .limit(1)
    .maybeSingle();

  if (erroAluno) {
    console.error('verificar-aluno: falha ao consultar students', erroAluno.message);
    return json({ erro: 'falha_consulta' }, 500, origem);
  }
  if (!aluno) {
    return json({ elegivel: false }, 200, origem);
  }

  // Revogado também conta: decisão do Rodrigo em 23/09/2026.
  const { count, error: erroGrant } = await db
    .from('student_access_grants')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', aluno.id)
    .eq('course_name', CURSO_ELEGIVEL);

  if (erroGrant) {
    console.error('verificar-aluno: falha ao consultar grants', erroGrant.message);
    return json({ erro: 'falha_consulta' }, 500, origem);
  }

  return json({ elegivel: (count ?? 0) > 0 }, 200, origem);
});
