# Segurança e privacidade

O Timóteo marca **encontros reais de pessoas na rua**. Isso muda o nível de cuidado: um evento mal organizado ou falso pode colocar gente em risco. Este documento descreve o que o projeto faz, o que **não** faz e o que ainda falta.

> Isto não é aconselhamento jurídico. Quem publicar o site é o responsável pelo tratamento dos dados e deve consultar profissional sobre a LGPD.

## O que protege hoje

**Nos lugares (pontos)**
- Cadastra-se **lugar**, nunca casa nem dados de pessoas. As regras de cadastro dizem isso e o aceite é obrigatório.
- Não se cadastram templos de outras religiões como "alvo", nem territórios indígenas e povos isolados sem autorização oficial e da comunidade.
- A ficha padrão tem campos de **autorização** e **segurança** (baixa, média, alta), e o checklist "Antes de ir" reage a eles (ir em dupla ou trio, falar com a liderança local, não ir à noite).
- Em modo compartilhado, todo lugar entra como **não aprovado** e só aparece depois de aprovado por quem modera.

**Nos eventos**
- **Responsável identificado:** nome, igreja ou grupo e contato são obrigatórios.
- **Sempre ligado a um lugar do mapa**, que já traz a ficha de autorização e segurança.
- **Compromissos obrigatórios** antes de publicar: ser maior de 18 anos; respeitar quem não quiser conversar; não coletar dados pessoais; menores só com responsáveis; horário de término e ponto de retorno; saber pedir ajuda (SAMU 192, Polícia 190, Bombeiros 193). Conforme o tipo e a ficha do lugar, entram também: autorização do lugar, falar com a liderança local (segurança alta), ir em duplas ou trios (boca a boca) e respeitar limites de som (culto).
- **Selos de segurança** no evento mostram o que o responsável declarou.
- **Denúncia** em todo evento, com motivo.
- **Aprovação antes de publicar**, em modo compartilhado.

**Em geral**
- Sem contas, sem rastreamento próprio e sem anúncios.
- **Serviços de terceiros veem dados do visitante.** O site carrega a fonte do Google Fonts e as bibliotecas do cdnjs (o IP do visitante chega a esses serviços). Ao escolher um ponto no mapa ou usar "Usar onde eu estou", as coordenadas vão ao Nominatim (OpenStreetMap) para achar a cidade, e depois à API do IBGE (apenas o código da cidade). Para evitar, hospede fonte e bibliotecas no próprio site e use um geocodificador próprio.
- O texto vindo de usuários é escapado antes de ser mostrado (proteção contra injeção de HTML).
- Links de grupo só aceitam `https://`.

## O que **não** é verificado

- Os compromissos são **declarados**, não verificados. A plataforma não confere identidade, igreja, autorização do lugar nem idade.
- O site avisa isso na tela do evento: "Declarado pelo responsável. A plataforma não verifica cada informação."

## Riscos conhecidos e lacunas

| Risco | Situação | O que fazer |
|---|---|---|
| Contato (WhatsApp) do responsável fica **público** no evento | Aviso no formulário para usar o contato da igreja ou do grupo | Guardar o contato em tabela privada e revelar só a quem confirmar presença |
| Qualquer pessoa pode enviar pontos, eventos e presenças sem limite | Sem proteção contra spam | Limite de envios, captcha (por exemplo Cloudflare Turnstile) e função de borda |
| Moderação só pelo painel do Supabase | Sem painel próprio | Painel de moderação com aprovação, edição e leitura de denúncias |
| Responsável não consegue cancelar o evento no modo compartilhado | O cancelamento só funciona no modo local | Login do responsável ou link secreto de gerenciamento |
| Denúncias não são lidas em lugar nenhum | Só no painel do Supabase | Fila de denúncias na moderação |
| Evento marcado em lugar perigoso | Depende do que o responsável declara e da moderação | Revisão humana de eventos em lugares de segurança média ou alta |
| Serviços gratuitos de mapa e busca têm limites de uso | Podem bloquear com tráfego real | Provedores próprios ou contratados (veja [PUBLICAR.md](PUBLICAR.md)) |

## Para quem modera

Antes de aprovar um evento ou lugar, confira:

1. O responsável e a igreja ou grupo existem e têm presença verificável (site, rede social, igreja local conhecida).
2. O lugar é público ou há autorização plausível. Em escola, hospital e espaço privado, exija a confirmação da autorização.
3. Segurança média ou alta: há liderança local envolvida e equipe mínima de 3 ou mais pessoas?
4. O texto não ataca outras religiões, não expõe pessoas e não pede dados pessoais.
5. Em evento com menores, há responsáveis presentes.
6. Em caso de dúvida, **não aprove** e peça mais informação.

## LGPD e dados pessoais

- O projeto foi desenhado para **coletar o mínimo**: lugares, eventos, nome ou apelido opcional de quem marca presença e dados do responsável do evento.
- Religião é **dado pessoal sensível**. O site usa apenas números agregados publicados pelo IBGE e nunca cadastra a religião de pessoas.
- Quem publicar uma instância deve: informar quais dados coleta e por quê; oferecer forma de pedir remoção; definir prazo de guarda; definir quem responde pelo tratamento (controlador).
- Antes de publicar de verdade, falta uma política de privacidade e termos de uso. Está no [roadmap](ROADMAP.md).

## Como reportar uma vulnerabilidade

Veja [SECURITY.md](../SECURITY.md).
