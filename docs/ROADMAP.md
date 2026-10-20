# Roadmap e lacunas conhecidas

Estado atual: **alfa**. Esta é uma lista honesta do que falta, em ordem aproximada de prioridade.

## Para poder lançar de verdade

- [ ] **Testar o modo compartilhado com um projeto Supabase real.** O código existe, mas não foi exercitado de ponta a ponta.
- [ ] **Painel de moderação.** Hoje a aprovação é marcar uma caixa na tabela do Supabase. Falta aprovar, editar, corrigir e apagar num painel, e ler denúncias.
- [ ] **Editar e cancelar.** O responsável editar o próprio lugar e evento e cancelar evento no modo compartilhado (login ou link secreto).
- [ ] **Proteção contra abuso.** Limite de envios e captcha.
- [ ] **Contato do responsável privado.** Hoje o WhatsApp do evento é público. Revelar só a quem confirmar presença.
- [ ] **Política de privacidade, termos de uso e identificação de quem mantém o site.**
- [ ] **Serviços de mapa e busca próprios ou contratados**, para tráfego real.
- [ ] **Revisão dos guias por povo e dos pedidos de oração** por quem convive.
- [ ] **Declaração de fé** do projeto, para o visitante saber de que posição ele fala.

## Para ficar realmente bom

- [ ] **Camada de povos não alcançados no mapa**, com a API do Joshua Project (precisa de chave gratuita).
- [ ] **Mais camadas do IBGE** que combinam com os guias: população indígena e quilombola, favelas e comunidades urbanas, pessoas com deficiência auditiva (surdos). Possivelmente também endereços de estabelecimentos religiosos (CNEFE), para mostrar áreas com poucas igrejas. Precisa confirmar a disponibilidade.
- [ ] **Depois da conversa.** Pedidos de oração de quem foi abordado e encaminhamento a uma igreja local, com cuidado de privacidade.
- [ ] **Lembretes de evento** por WhatsApp ou e-mail.
- [ ] **Modo offline (PWA)** para abrir a ficha e o roteiro sem sinal.
- [ ] **Painel para líderes**: lugares, eventos, equipes e regiões sem cobertura por cidade.
- [ ] **Telas de "de casa em casa" e de simulador** de impacto.
- [ ] **Estimativa por setor censitário**, se o IBGE publicar religião nesse nível.

## Qualidade

- [ ] Testes em celulares reais e em vários navegadores.
- [ ] Teste de impressão do lambe em PDF e no papel.
- [ ] Auditoria de acessibilidade (leitor de tela, contraste, teclado).
- [ ] Dividir `js/app.js`, que está grande.
- [ ] Mais testes automáticos, inclusive de interface.
- [ ] Imagens de pré-visualização para compartilhamento.
- [ ] Traduções (espanhol, para as regiões de fronteira).

## Como ajudar

Abra uma issue, pegue um item da lista ou veja [CONTRIBUTING.md](../CONTRIBUTING.md).
