# Especificação técnica das melhorias em Orçamentos e Ordens de Serviço

**Sistema EKIPE Serviços · Versão 1.0 · 03/11/2026**

**Público** — Produto, Desenvolvimento, Financeiro e Homologação.

Esta especificação divide as seis solicitações do cliente em entregas pequenas, com dependências, pontos de integração e critérios de aceite. O escopo vai da edição de um orçamento salvo até a geração do PDF completo da Ordem de Serviço (OS), incluindo empreitadas, pagamentos e anexos.

**Leitura dos requisitos.** Os identificadores R01–R06 correspondem aos itens do PDF do cliente. As etapas E00–E09 organizam o trabalho técnico. As decisões D01–D08 registram pontos a validar antes de implementar os comportamentos afetados. Nomes novos de campos, comandos e estruturas são conceituais até a verificação do banco e dos contratos em homologação.

## 1. Rastreabilidade e sequência de entrega

| ID | Solicitação do cliente | Fonte | Etapas | Aceite |
| --- | --- | --- | --- | --- |
| R01 | Alterar a Data de Abertura de orçamento existente e salvar com os demais dados | p. 1, item 1 | E01 | A01–A03 |
| R02 | Organizar a tela de Empreitadas e permitir múltiplos registros, edição, exclusão e pagamentos com histórico | p. 1, item 2 | E03–E05 | A07–A14 |
| R03 | Confirmar saída quando houver alterações pendentes | p. 2, item 3 | E02, E04, E07 | A04–A06, A09, A19 |
| R04 | Exibir Total da OS, Total Pago e Saldo a Pagar, com atualização automática | p. 2, item 4 | E05–E06 | A11–A16 |
| R05 | Corrigir salvamento, vínculo, visualização e download de anexos | p. 3, item 5 | E07 | A17–A21 |
| R06 | Oferecer PDF completo no fluxo de Faturar, com fotos e documentos | pp. 3–4, item 6 | E08 | A22–A26 |
| REG | Validar os fluxos existentes de cadastro, edição, consulta e faturamento | p. 4, critérios gerais | E09 | A27–A28 |

**Ordem sugerida.** E00 inicia a verificação de ambiente e contratos. E01 → E02 estabiliza o editor principal. E03 → E04 → E05 → E06 entrega cadastro, histórico e totais nessa ordem. O diagnóstico de E07 pode começar em paralelo, e sua integração com a proteção de saída usa E02. E08 depende da disponibilidade de dados de E01, E04, E06 e E07 e da definição do momento da emissão. E09 consolida a validação integrada. Cada etapa termina com evidência de aceite própria.

## 2. Mapa da implementação existente

| Fluxo | Evidência no código local | Implicação para a implementação |
| --- | --- | --- |
| Orçamento e OS | `src/app/home/orcamentos/page.tsx`, `OrdemModel` e `OrdemRepository` usam `ORD_CODIGO` como chave. Serviços usam `OS_ORD` e produtos usam `ORE_ORD`. A impressão atual muda de título conforme `ORD_FAT`. | Usar a identidade da ordem como referência central. Confirmar com o cliente se existem dois números de negócio antes de criar ou exibir um segundo identificador. |
| Data de abertura | `form_identificacao.tsx` já tem um input de data com edição. A consulta faz `new Date(ord.ORD_DATA)` e acrescenta um dia. O salvamento formata a data na tela e novamente no repositório. | Reproduzir o problema na versão usada pelo cliente. Rastrear entrada, API, banco, reabertura e impressão para localizar a diferença. |
| Salvar e sair | A página grava cabeçalho e itens em chamadas separadas. As exclusões de itens chamam repositórios imediatamente. `home/layout.tsx` controla links e logout. | A opção de descartar precisa tratar todas as alterações pendentes, inclusive remoções locais. A navegação interna depende de integração com o layout. |
| Empreitadas | `home/empreitadas/page.tsx` e `empreitada.tsx` já exibem lista, prestador, itens e faturamento. `EmpreitadasRepository` filtra por `EMP_ORD`. O manipulador atual de exclusão remove da lista em memória. As consultas atuais omitem `EMP_NFS` embora o upsert já o escreva. | Completar leitura e escrita, confirmar as colunas reais e criar um fluxo persistente de cadastro e manutenção com identidade própria. |
| Financeiro | `painel_totais.tsx` recebe totais e desconto. A OS usa faturamento de recebimento (`tipoRecPag="R"`) e a empreitada usa pagamento (`tipoRecPag="P"`). Há lançamentos de custo associados ao faturamento de empreitada. | Definir quais baixas representam pagamento elegível para a OS e como evitar dupla contagem ou duplicação de lançamentos. |
| Anexos | `src/components/component/files.tsx` usa Firebase Storage e `ArquivoRepository` grava em `ARQUIVOS_OS`. Também existem rotas FTP em `src/app/api/uploads/route.ts` e `src/app/api/downloads/route.ts`. | Diagnosticar o caminho ativo e levantar os vínculos históricos antes de migrar ou trocar o modo de leitura. |
| PDF e faturamento | `src/app/print/orcamento/page.tsx` imprime dados de `OrdemCtx`. `Faturamentos` chama a estratégia `OperacaoOrdens` e sinaliza conclusão com `setFaturado`. O fluxo aguarda as chamadas, mas a conclusão no frontend não verifica todos os retornos booleanos da estratégia. | Verificar os contratos de sucesso e falha antes de habilitar a emissão. Gerar o documento a partir de dados confirmados e separar tentativa de faturamento, confirmação do faturamento e geração documental. |

O frontend consulta o servidor pelo repositório de cada domínio. Vários repositórios usam `POST /dataset` com SQL montado no frontend. O código Delphi do servidor está em `F:/Projetos/servidor-ekipe-servicos`, com controllers de Ordens, Dataset e Empreitadas. Para novos comandos sensíveis, a proposta é usar operações de domínio no servidor, com autenticação, autorização, parâmetros tipados e transações delimitadas. A análise foi estática. Dados da instalação, regras do armazenamento, permissões efetivas e estado do banco devem ser confirmados em homologação.

## 3. Decisões que precisam de validação

| ID | Pergunta a resolver | Proposta para avaliação | Bloqueio |
| --- | --- | --- | --- |
| D01 | Quais perfis podem alterar a abertura e gerenciar empreitadas, pagamentos, anexos e PDF? Como isso varia por status e após faturar? | Validar matriz com ações de consultar, criar, editar, excluir, registrar ou corrigir pagamento, anexar, baixar e exportar. Confirmar acesso direto no servidor e refletir a mesma regra na interface. | Operações restritas de E01, E04, E05, E07 e E08. |
| D02 | Quais campos da empreitada são obrigatórios em rascunho e na conclusão? Qual é o catálogo de serviços? Coordenador pode ser digitado livremente? Loja e pedido têm cadastro ou são referências externas? | Permitir leitura de registros antigos com campos ausentes. Tratar NF, loja e pedido como identificadores de dígitos e preservar zeros à esquerda quando fizerem parte do identificador. Confirmar se prestador e local de execução continuam obrigatórios e se há regras de unicidade. | Validações finais de E03–E04. |
| D03 | “Valor Recebido” representa entrada do cliente, saída para prestador ou outro tipo de baixa? Quais pagamentos legados e estornos entram no Total Pago? | Identificar a fonte oficial com o Financeiro, usando amostras conciliadas. Reaproveitar ou vincular a baixa existente quando ela representar o mesmo movimento. | E05, E06 e seção financeira de E08. |
| D04 | Pagamento acima do Valor da NF ou do Total da OS é permitido? O saldo negativo aparece? O Total Pago interfere na cobrança do faturamento? | Aplicar a diferença literal solicitada e pactuar exibição e validação do excedente. Manter a cobrança atual até decisão explícita sobre abatimento e conciliação do saldo. | Regras de excedente de E05–E06 e valor cobrado em E08. |
| D05 | Como corrigir pagamentos e excluir uma empreitada com baixa ou faturamento? | Permitir exclusão conforme matriz e integridade. Para registro com histórico financeiro, bloquear exclusão física e adotar estorno ou cancelamento rastreável, conforme autorização. | Exclusão e correção de E04–E05. |
| D06 | Quais extensões, tipos, tamanhos e limites por envio são permitidos? Quem pode abrir anexos antes e depois do faturamento? | Confirmar políticas de armazenamento e permissões com amostras reais. Usar visualização para formatos suportados e download autenticado para os demais formatos permitidos. | Validação e autorização finais de E07 e E08. |
| D07 | Em que ponto de Faturar o PDF fica disponível? O PDF pode ser emitido novamente? A emissão representa a situação da data do faturamento ou o estado atual? | Oferecer geração após confirmação, com acesso posterior pelo mesmo registro e versão identificável quando houver política de arquivamento. Confirmar o papel do status FINALIZADO, a data oficial e a equivalência ou distinção dos números de orçamento e OS. | E08. |
| D08 | Quais observações podem aparecer no documento entregue ao cliente? Como incluir PDFs protegidos, grandes ou inválidos? | Incluir observações destinadas à emissão. Tratar `ORD_OBS_ADM` como interno até validação. Incorporar PDFs compatíveis e manter originais no pacote quando a incorporação não for possível. | Conteúdo e pacote de E08. |

O PDF do cliente sugere uma mensagem de confirmação. A redação e os dois rótulos podem ser usados nos fluxos internos. Fechamento e atualização usam o diálogo nativo do navegador quando disponível.

## 4. Etapas de implementação

### E00 Verificar ambiente, dados e contratos

1. Identificar versões implantadas do frontend e do servidor. Reproduzir os casos de data e anexos com uma OS de teste. Registrar códigos da OS, horários, status das requisições e resultado da reconsulta em sessão nova.
2. Levantar o esquema real e as referências de `ORDENS`, `ORD_SER`, `ORD_EST`, `EMPREITADAS`, `EMPREITADAS_SERVICOS`, `ARQUIVOS_OS` e tabelas financeiras envolvidas. Confirmar tipos, chaves, geradores, índices, nulabilidade e datas sentinela. Mapear integrações que também escrevam nesses registros.
3. Preparar massas sem dados pessoais reais. Usar uma ordem antiga com campos novos ausentes, outra com serviços e produtos, uma com várias empreitadas, uma faturada, uma com anexos antigos e duas OS com arquivos homônimos. Capturar valores e estados de referência antes das alterações.
4. Registrar as decisões D01–D08 com responsável, data, evidência e etapas liberadas. Usar Operações e Financeiro para validar as amostras de baixa e faturamento.

**Saída da etapa.** Reprodução inicial ou indicação da divergência de versões, mapa de dados reais, massas e decisões de negócio rastreadas. O diagnóstico de anexos e a correção de data podem avançar enquanto se resolve a regra financeira.

### E01 Editar e persistir a Data de Abertura

**Entrada.** Orçamento novo ou existente selecionado pelo código e operador autorizado conforme D01.

1. Manter o campo Data de Abertura acessível no formulário de identificação durante a edição, inclusive após consulta. No novo orçamento, manter o valor inicial de acordo com a convenção atual da aplicação. Permitir alterar data, observações e itens no mesmo fluxo de salvamento.
2. Tratar a data como dia de calendário. Documentar o formato recebido do servidor e o formato de gravação. Normalizar para `YYYY-MM-DD` no contrato da tela, com conversão explícita na fronteira legada quando necessária. Validar preenchimento e calendário, incluindo ano bissexto. Aplicar restrição de período somente se houver regra vigente confirmada.
3. Testar a compensação de um dia e a dupla formatação na versão implantada. Substituir a compensação manual quando a leitura e a gravação compartilharem um contrato verificável. Conferir busca, reabertura e impressão com a mesma data.
4. Gravar sobre o `ORD_CODIGO` carregado. Preservar campos de faturamento, autoria e demais dados que não sejam alterados pelo comando. Revisar o upsert que hoje grava `ORD_DATAC` como `1900-01-01` e validar os efeitos sobre ordens já faturadas se a edição for permitida.
5. Expor ao chamador um resultado de salvamento que diferencie validação, falha e confirmação. Liberar faturamento dependente de salvamento apenas com identidade persistida e dados confirmados. Em falha, preservar o formulário editável e evitar sucesso aparente.

**Aceite da etapa.** A01–A03. Verificar a data consultada, o registro persistido e a saída impressa no mesmo caso.

### E02 Proteger alterações pendentes

**Entrada.** Formulário carregado com os dados confirmados ou inicializado para um novo orçamento.

1. Manter uma referência normalizada do último estado confirmado. Comparar data, cliente, parceiro, status, dados fiscais editáveis, solicitação, observações, desconto e listas de produtos e serviços. Abrir modais, trocar abas, atualizar totais derivados e hidratar a consulta são ações de navegação ou leitura. Voltar todos os valores ao estado de referência deve limpar a pendência.
2. Conferir a pendência antes de navegar pelo menu, voltar no aplicativo, trocar a OS pela pesquisa ou por código, acionar Novo, sair pelo logout ou fechar um editor com rascunho. Integrar o botão Voltar do navegador quando a movimentação ocorrer no histórico interno, testando também Avançar e repetição sem criar entradas extras. Encaminhar a ação pretendida uma única vez após confirmação.
3. No diálogo interno, usar o título **Atenção!**, explicar que a saída descarta as alterações e oferecer **Continuar editando** e **Sair sem salvar**. Continuar preserva o rascunho e o contexto. Sair restaura ou abandona o rascunho e executa a ação solicitada. Escape e fechamento do diálogo devem equivaler a continuar.
4. Para recarregar, fechar a aba ou sair do documento, registrar `beforeunload` apenas enquanto houver pendência e removê-lo ao limpar o estado. O navegador controla texto e rótulos e pode omitir o aviso sem interação prévia ou em encerramento forçado, especialmente em dispositivos móveis. [Referência de `beforeunload`](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event)
5. Ajustar exclusões de produtos e serviços ao ciclo do formulário. Uma exclusão em rascunho deve surtir efeito persistente apenas no salvamento confirmado. Confirmar cabeçalho, itens e exclusões na mesma transação quando fizerem parte do mesmo comando. Sucesso redefine a referência somente para os dados gravados. Falha ou conflito preserva a edição para correção ou nova tentativa.
6. Desconsiderar respostas de consultas que perderam validade após troca de ordem. Proteger alterações feitas enquanto um salvamento está em andamento, bloqueando edição nesse intervalo ou preservando a diferença após a resposta. Em modais de empreitada e anexos, separar rascunho local de operações já confirmadas pelo usuário e pelo servidor.

**Aceite da etapa.** A04–A06. Uma exclusão descartada mantém o item disponível após reabrir a OS.

### E03 Preparar o contrato de empreitadas

**Dependências.** E00 e as definições pertinentes de D02. A camada existente vincula a empreitada à OS por `EMP_ORD` e os serviços da empreitada por `ES_EMP`.

| Campo pedido | Tipo e semântica | Mapeamento ou decisão de implementação |
| --- | --- | --- |
| Nota Fiscal | Identificador numérico da NF | Verificar `EMP_NFS` e completar leitura e escrita. Validar dígitos e tamanho conforme D02. Distinguir de `ORD_NFS`, que pertence ao cabeçalho da OS. |
| Loja | Identificador numérico da loja | Verificar se há cadastro de lojas ou referência já existente. Usar ID validado se for referência de cadastro. |
| Pedido de Compra | Identificador numérico do pedido associado ao serviço | Confirmar se é número externo ou chave de um pedido interno. A estrutura `PEDIDOS` do módulo de vendas exige validação semântica antes de ser reaproveitada. |
| Serviço | Seleção de cadastro ou descrição personalizada | Manter a descrição persistida do serviço. Para cadastro, persistir a referência e a descrição usada na operação. Para texto livre, exigir descrição preenchida e associá-la à empreitada. Confirmar catálogo, cardinalidade e limites. A estrutura atual admite vários itens por empreitada. |
| Valor da NF | Valor total da nota em BRL | Usar precisão monetária de duas casas e coluna ou contrato próprio, a menos que a equivalência com um campo legado seja demonstrada. O fluxo atual calcula `EMP_VALOR` a partir dos serviços no faturamento. |
| Data de Emissão | Data de calendário da NF | Usar um campo separado da abertura da OS, do prazo do serviço e da data de faturamento. |
| Valor Recebido | Acumulado dos pagamentos elegíveis da empreitada | Exibir o acumulado e oferecer registro de nova parcela. Derivar o campo do histórico definido em E05. |
| Coordenador | Funcionário responsável ou texto, conforme D02 | Em seleção, persistir o identificador do funcionário. Se o texto livre for aprovado, armazenar o texto com semântica própria. Distinguir coordenador do operador que registrou a ação. |
| Observação | Texto livre da empreitada | Reaproveitar `EMP_OBS` conforme esquema. Preservar pontuação, acentos, quebras de linha e apóstrofos. |

1. Definir leitura de lista e detalhe, salvamento do cabeçalho com itens, e exclusão ou cancelamento. A leitura deve identificar a OS e a empreitada pelo código. Um ID de empreitada recebido para outra OS deve ser rejeitado no servidor.
2. Acrescentar apenas os campos e relações que faltarem. Testar a migração com registros antigos. Valores desconhecidos devem ser distinguíveis de valores zero. Preenchimento retroativo exige fonte verificável.
3. Gravar cabeçalho e itens de forma consistente. Incluir na leitura os campos que a gravação suporta e devolver a identidade persistida. Validar permissões, tipo, formato e vínculo na fronteira do servidor. Mapear respostas para validação, acesso negado, ausência, conflito e falha de persistência.

**Aceite da etapa.** Base de A07, A08 e A10. Demonstrar leitura de um registro antigo e salvamento de um novo com os campos aprovados.

### E04 Entregar a gestão de múltiplas empreitadas

**Dependências.** E02 para proteger rascunhos, E03 para persistência, D01 e D05 para manutenção.

1. Ao abrir **Empreitadas**, apresentar a OS ativa, a lista de empreitadas vinculadas e a ação **Nova empreitada**. Usar o código da OS confirmada. Se o orçamento ainda não tiver código persistido, orientar o salvamento antes de abrir o cadastro, conforme o padrão atual.
2. Organizar o formulário em seções para dados fiscais e de compra, serviço e coordenação, valores e pagamentos, e observação. A lista deve identificar cada registro com os dados operacionais disponíveis, incluindo NF, loja ou pedido, serviço, valor e valor recebido. Usar os padrões de campos e ações do aplicativo e testar teclado, foco e telas estreitas.
3. Permitir cadastrar uma segunda empreitada sem sobrescrever a primeira e editar pela identidade da empreitada, independentemente da ordenação da lista. Preservar os vínculos de prestador, local de execução, serviços e faturamento que tiverem significado no fluxo existente. Permitir salvar o cadastro como operação própria, sem exigir faturar a empreitada.
4. Confirmar a exclusão e aguardar o resultado persistido antes de retirá-la da lista. Aplicar D05 para registros com histórico ou vínculo financeiro. Oferecer mensagens distintas para falta de permissão, vínculo bloqueante, conflito e falha. Cancelar ou fechar com rascunho deve acionar a proteção de E02.
5. Recarregar lista e detalhe da mesma OS após criação, alteração ou exclusão confirmada. Mostrar carregamento, lista vazia e erro de leitura de forma distinta. Respostas recebidas de uma OS anterior devem ser descartadas.

**Aceite da etapa.** A07–A10. Confirmar criação, edição, exclusão autorizada e reconsulta em sessão nova.

### E05 Registrar pagamentos parciais e preservar o histórico

**Dependências.** E03, E04 e decisões D03–D05.

1. Definir a origem oficial de cada pagamento. Uma parcela prevista, um valor de NF e um faturamento constituem informações distintas de uma baixa efetiva. Se houver movimento financeiro equivalente, vincular seu identificador ou usar a fonte existente. Revisar a relação com `OperacaoEmpreitadas`, o faturamento da OS e o endpoint Delphi `/empreitadas/faturamento` antes de criar qualquer lançamento adicional.
2. Para cada evento reconhecido, manter identidade estável, empreitada vinculada, valor BRL, data efetiva, operador ou origem da integração, estado ou natureza do movimento e referência à baixa original, quando aplicável. Uma correção deve preservar o evento original e sua relação com a correção ou estorno conforme D05. Exibir o histórico em ordem determinística.
3. Ao registrar um pagamento, informar o valor desta parcela. Validar valor positivo, duas casas decimais, data válida e vínculo. Aplicar limites e regras de excedente aprovados em D04. Guardar valores com precisão decimal fixa ou centavos inteiros. Usar a mesma semântica em interface, persistência e PDF.
4. Proteger o registro com um identificador de operação estável durante reenvios. Uma repetição do mesmo comando deve devolver o evento existente ou o seu resultado. Dois pagamentos distintos de mesmo valor e data devem poder coexistir. Em concorrência, validar limites e gravar o evento dentro da mesma transação aplicável, com uma garantia de unicidade para a operação ou baixa vinculada.
5. Após confirmação, atualizar o histórico, o Valor Recebido da empreitada e o resumo da OS com a resposta ou com uma consulta atualizada. Para legado, importar apenas baixas conciliadas com referências estáveis. Ausência confirmada de pagamento produz zero. Falha de consulta ou legado inconclusivo exige indicação própria na interface.

**Aceite da etapa.** A11–A14. Demonstrar duas baixas parciais, uma repetição do mesmo comando, duas parcelas legítimas de mesmo valor e a correção aprovada.

### E06 Exibir Total da OS, Total Pago e Saldo a Pagar

**Dependência.** E05, com D03 e D04 resolvidas.

| Indicador | Regra |
| --- | --- |
| Total da OS | Soma dos totais de linhas de produtos (`ORE_VALOR`) e serviços (`OS_VALOR`) menos o desconto atual (`ORD_VALOR_DESCONTO`). Os valores de linha já incluem a quantidade. Usar o total confirmado da OS na emissão documental. |
| Total Pago | Soma dos pagamentos efetivos elegíveis das empreitadas ligadas à OS, líquidos das correções aplicáveis e contados uma única vez por identidade financeira. |
| Saldo a Pagar | Total da OS − Total Pago. Aplicar a política aprovada de excedente e apresentação do saldo. |

1. Exibir os três valores no painel inicial, em reais. Se os itens ou desconto estiverem em edição, calcular o total corrente do formulário e indicar o estado pendente. Os pagamentos do resumo devem refletir dados confirmados.
2. Usar uma agregação de referência por OS para o painel e o PDF. Somar primeiro os pagamentos elegíveis por identidade ou por empreitada em fonte deduplicada. Evitar que um join com serviços, itens, notas, anexos ou lançamentos multiplique pagamentos. A deduplicação deve usar o identificador do evento, pois valores iguais podem ser legítimos.
3. Atualizar ao carregar a OS e após qualquer pagamento ou correção confirmada, incluindo o retorno da gestão de empreitadas. Um erro de consulta deve aparecer como indisponibilidade com opção de tentar novamente. Evitar exibir total ou saldo de uma OS anterior durante a troca.
4. Manter separados Valor da NF, valor de serviços da empreitada, Total Pago e valor utilizado pelo módulo de faturamento. Aplicar qualquer abatimento de cobrança somente após a regra de D04 ser aprovada e testada com o Financeiro.

**Exemplo de aceite.** Produtos e serviços somam R$ 2.100,00. O desconto é R$ 100,00. Uma empreitada tem baixas de R$ 400,00 e R$ 350,00. Outra tem baixa de R$ 250,00. O painel deve mostrar Total da OS de R$ 2.000,00, Total Pago de R$ 1.000,00 e Saldo a Pagar de R$ 1.000,00. O resultado permanece igual se uma das empreitadas tiver vários serviços ou se um envio for repetido.

**Aceite da etapa.** A15–A16.

### E07 Corrigir upload, armazenamento e recuperação de anexos

**Dependências.** E00 para diagnóstico, E02 para o descarte da seleção local, D01 e D06 para permissão e validação.

**Causas verificáveis no código.** O fluxo Firebase envia todos os arquivos selecionados usando apenas o nome original como chave e, ao final, grava um único vínculo com `lastName`. Assim, uma seleção múltipla pode deixar objetos sem vínculo e nomes iguais podem apontar para o mesmo objeto. A leitura atual usa `getFileName(AO_CAMINHO)`, que descarta a estrutura do caminho. A presença de rotas FTP separadas exige confirmar o uso por versão e a origem dos registros antigos. A extensão do impacto deve ser medida em homologação.

1. Reproduzir com envio unitário, múltiplo e dois arquivos de mesmo nome em OS distintas. Observar o resultado do upload, a chave física, uma linha de metadados por arquivo em `ARQUIVOS_OS`, a consulta por `AO_OS` e a leitura do conteúdo. Verificar falhas de autenticação, regras de Storage e consistência entre ambiente da aplicação, banco e bucket.
2. Vincular cada arquivo a um `ORD_CODIGO` válido e a uma identidade de anexo própria. Usar uma chave de armazenamento única, com namespace da OS e identificador gerado. Preservar o nome original separadamente. Confirmar esquema para caminho integral, tipo, tamanho, observação e metadados de auditoria necessários. Usar o caminho integral na leitura das novas gravações.
3. Validar extensão, tipo e tamanho conforme D06 em um ponto confiável de controle, com retorno claro por arquivo. Manter autorização por OS para seleção, escrita, listagem, visualização, download e uso na emissão. A abertura de imagens e PDFs deve usar a origem autorizada e respeitar o tipo real do arquivo.
4. Só marcar um arquivo como disponível após confirmar conteúdo e metadados. Em envio múltiplo, informar sucesso e falha por item e permitir repetir somente as falhas. Se a gravação do vínculo falhar após o upload, prever limpeza compensatória ou reconciliação de objeto temporário, com reenvio idempotente. Se existir metadado sem objeto, sinalizar a indisponibilidade em vez de oferecer uma ação inválida.
5. Levantar vínculos legados por chave e provedor. Ler registros antigos pelo caminho confirmado em inventário. Separar casos de objeto órfão, referência sem objeto e colisão de nome. Recuperar apenas quando houver evidência da OS de origem. Atualizar metadados depois de verificar a leitura do conteúdo correspondente.
6. Reconsultar a lista após gravar. A seleção ainda sem envio deve seguir a proteção de E02 quando o usuário tentar fechar o modal. Anexos confirmados devem permanecer disponíveis após recarregar, abrir outra sessão, reconsultar, finalizar e faturar a OS. Demonstrar que visualização e download retornam o arquivo original correto.

**Aceite da etapa.** A17–A21. Registrar a causa reproduzida, a correção e a evidência de recuperação.

### E08 Gerar o PDF completo no fluxo de faturamento

**Dependências.** E01, E04, E06, E07 e decisões D07–D08.

1. Integrar **Gerar PDF completo** ao fluxo iniciado por **Faturar**, no momento aprovado em D07. A proposta é habilitar após o servidor confirmar o faturamento e recarregar a OS correta. Validar retornos booleanos e erros da estratégia antes de usar o sinal de sucesso. Em falha ou timeout, reconsultar a OS e os vínculos financeiros para distinguir tentativa rejeitada, operação parcial e sucesso cuja resposta se perdeu. Retomar conforme o estado confirmado, evitando repetir efeitos já persistidos. A emissão deve ser uma operação independente, que pode ser repetida sem faturar novamente, baixar estoque ou registrar novos pagamentos.
2. Preparar um conjunto coerente de dados confirmados da OS, cliente, empresa, serviços, produtos, empreitadas, pagamentos e anexos. Capturar a identificação do faturamento e a data oficial da operação. Validar a origem de `ORD_DATAC` ou data da fatura e tratar datas sentinela como ausência de valor. Ao lidar com `ORD_FAT`, usar o resultado confirmado em vez de inferir a conclusão pela abertura ou fechamento do modal.
3. Preservar a impressão atual como fluxo de orçamento simples e oferecer a emissão completa para consulta, impressão e arquivamento. Usar paginação legível, cabeçalhos de tabelas em continuação, títulos identificáveis e quebra de texto para listas extensas. Tratar dados ausentes de ordens antigas conforme as regras aprovadas.

| Seção obrigatória | Conteúdo |
| --- | --- |
| Identificação | Dados da empresa, números do orçamento e da OS conforme D07, Data de Abertura, dados do cliente e demais identificadores existentes aplicáveis. |
| Serviços executados | Todos os serviços vinculados, descrição, unidade, quantidade, valor unitário e total quando aplicáveis. Incluir empreitadas associadas, serviços executados por elas e responsáveis ou coordenadores cadastrados. |
| Produtos utilizados | Descrição, quantidade, valor unitário e total de cada produto. Usar o valor unitário de origem quando existir ou o cálculo consistente com a quantidade e o total gravados. Tratar quantidade legada inválida sem gerar divisão por zero. |
| Informações financeiras | Total do orçamento e da OS conforme a identidade e os dados existentes, desconto quando aplicável, valores das empreitadas, valores pagos e saldo. Usar a mesma regra de E06 e identificar cada natureza de valor. |
| Arquivos e fotografias | Relação dos anexos com identificação do arquivo, fotos incorporadas ao PDF e documentos incluídos diretamente quando tecnicamente viável. Para formatos incompatíveis, incluir os originais no pacote documental e relacioná-los no PDF. |
| Encerramento | Data oficial de finalização ou faturamento, observações finais autorizadas e informações relevantes existentes na OS. |

4. Incorporar fotos com orientação e proporção corretas e resolução adequada à leitura. Incorporar PDFs compatíveis com o método aprovado. Para documentos que não possam ser incorporados, a proposta é um ZIP com PDF principal e originais, com nomes únicos e correspondência explícita à lista de anexos. Preservar os bytes dos originais. Se um anexo vinculado estiver inacessível, identificar o item afetado e impedir que uma saída incompleta pareça completa. Disponibilizar nova tentativa da emissão.
5. Testar geração após confirmação, cancelamento antes de confirmar, falha de faturamento e falha exclusiva na geração. Para consulta posterior, aplicar a política aprovada de versão ou reemissão. A regra de acesso ao PDF e ao pacote deve respeitar a autorização de consulta à OS e aos arquivos incluídos.

**Aceite da etapa.** A22–A26. Usar uma OS com itens suficientes para gerar várias páginas e anexos de formatos distintos.

### E09 Validar compatibilidade e preparar a entrega

1. Testar em homologação com banco de versão representativa, usuários com perfis distintos e armazenamento segregado. Conferir leitura, criação, edição, cancelamento e faturamento com dados antigos e novos. Verificar os fluxos que compartilham faturamento, incluindo venda e empreitada, se o componente comum for alterado.
2. Aplicar mudanças de esquema de forma aditiva onde possível. Validar a sequência de publicação do servidor e frontend com a versão anterior e com o código novo. Proteger novas operações até o contrato correspondente estar disponível. Antes de qualquer preenchimento retroativo, comparar contagens, vínculos e totais com as fontes oficiais. Garantir que a execução repetida produza o mesmo resultado.
3. Registrar a ordem de implantação e o procedimento de reversão. Desativar o fluxo novo se necessário, preservando pagamentos, anexos e vínculos já confirmados. Comparar o estado após reversão e definir tratamento para registros criados pela versão nova.
4. Registrar evidências de aceite por caso, incluindo código da OS de teste, versão, papel do operador, resultado de reconsulta, valores antes e depois e arquivo gerado quando aplicável. Concluir a etapa após resolver divergências ou registrar aceite formal da regra de negócio correspondente.

## 5. Matriz de homologação

| Caso | Cenário | Resultado verificável |
| --- | --- | --- |
| A01 | Consultar orçamento existente, editar a abertura, adicionar informação e salvar. | Mesmo código da OS. Reconsulta em sessão nova retorna a data e os dados alterados. |
| A02 | Salvar 29/02 de um ano bissexto e um dia na virada de mês ou ano. Testar um dia inválido e o campo vazio. | Datas válidas coincidem em formulário, leitura da API e impressão. Entrada inválida recebe mensagem e preserva o rascunho. |
| A03 | Simular falha de gravação. Repetir em OS faturada com perfil permitido ou restrito conforme D01. | Falha impede confirmação e faturamento subsequente. A data e os vínculos de faturamento seguem a política aprovada. |
| A04 | Alterar data, cliente, solicitação, observações, desconto ou itens. Usar Voltar, menu, Novo, troca de OS e logout. | O diálogo aparece antes da saída. Continuar preserva o rascunho. Sair executa a ação e descarta a edição local. |
| A05 | Abrir sem editar, desfazer integralmente uma edição, salvar com sucesso e simular falha. | Formulário limpo dispensa o aviso. Falha mantém a pendência. Atualizar e fechar aba acionam o diálogo nativo nas condições suportadas. |
| A06 | Remover item, tentar sair e descartar. Repetir salvando a remoção. | O primeiro cenário mantém o item ao reabrir. O segundo persiste a remoção e o novo total na mesma confirmação. |
| A07 | Cadastrar duas empreitadas na mesma OS, uma com serviço selecionado e outra com texto personalizado. | Duas identidades persistidas, vínculos corretos e todos os campos aprovados recuperados. |
| A08 | Editar NF, loja, pedido, coordenador e observação com acentos, apóstrofo e múltiplas linhas. | Os valores reaparecem corretamente. A segunda empreitada permanece independente. |
| A09 | Fechar formulário de empreitada com rascunho e escolher cada opção do diálogo. | Continuar preserva a edição. Descartar volta aos dados confirmados. |
| A10 | Excluir empreitada autorizada. Repetir sem permissão, com ID de outra OS e com histórico financeiro. | Exclusão autorizada persiste. As demais tentativas seguem a matriz de acesso e D05, inclusive em chamada direta. |
| A11 | Registrar duas parcelas e reabrir a empreitada. | Os dois eventos aparecem com datas e valores. Valor Recebido coincide com o acumulado elegível. |
| A12 | Reenviar a mesma operação após timeout e registrar outra parcela legítima com mesmo valor. | A primeira operação conta uma vez. A parcela distinta conta separadamente. |
| A13 | Corrigir ou estornar conforme D05. Registrar pagamentos em duas sessões quando houver limite de valor. | O histórico é rastreável e o total líquido está correto. A validação de limites é consistente mesmo em concorrência. |
| A14 | Comparar pagamentos legados e novos com as baixas financeiras usadas na amostra. | Valores previstos ficam fora do total. Cada baixa elegível tem uma referência única. Divergências ficam identificadas. |
| A15 | Executar o exemplo de R$ 2.000,00 da E06, adicionar um pagamento e repetir a consulta. | Painel atualiza automaticamente. Totais conferem com o histórico e com o PDF. Vários serviços na mesma empreitada não multiplicam a soma. |
| A16 | Conferir OS sem pagamento, com quitação integral, com excedente e com falha de consulta. | Zero, saldo quitado, excedente e indisponibilidade seguem as regras aprovadas. |
| A17 | Anexar imagem, PDF e outro formato autorizado no mesmo envio e atualizar a página. | Um vínculo por arquivo. Todos aparecem na mesma OS e o conteúdo pode ser recuperado. |
| A18 | Enviar arquivos homônimos com conteúdo diferente para duas OS. Tentar ler anexos de uma OS sem permissão. | Cada OS retorna seus próprios bytes. O acesso indevido é rejeitado. |
| A19 | Selecionar sem enviar, cancelar, enviar formato inválido ou tamanho excedente e simular falha de gravação de metadados. | Seleção local segue o aviso de saída. Arquivo inválido é rejeitado. Falha parcial fica identificada e pode ser retomada sem duplicação. |
| A20 | Consultar anexo legado, um registro sem objeto e um arquivo que exija download. | Legado válido abre. Falta de objeto aparece com mensagem. Download corresponde ao original. |
| A21 | Finalizar e faturar OS com anexos. Reabrir em nova sessão. | Vínculos, visualização e download continuam disponíveis ao perfil autorizado. |
| A22 | Concluir o faturamento com serviços, produtos, empreitadas, pagamentos e anexos. | A opção aparece no momento aprovado. PDF contém todas as seis seções, identificadores, datas e totais conferidos. |
| A23 | Cancelar faturamento ou provocar falha em uma etapa intermediária. | O sistema informa o estado real. Documento definitivo segue a condição de emissão aprovada. |
| A24 | Incluir fotos horizontais e verticais, PDF compatível e documento que exige preservação em separado. | Fotos estão incorporadas e legíveis. PDF compatível está incluído. O pacote identifica e contém os originais aplicáveis. |
| A25 | Forçar falha ao gerar PDF ou ao ler anexo e repetir a emissão. | A falha ou incompletude fica explícita. A repetição não cria faturamento, baixa de estoque nem pagamento adicional. |
| A26 | Emitir OS longa e antiga, com dados opcionais vazios. Conferir perfil e observação administrativa. | Paginação e valores permanecem legíveis. Dados ausentes e conteúdo interno seguem D07–D08. |
| A27 | Criar, editar, buscar, imprimir e faturar orçamento pelos caminhos atuais. | Validações, descontos, estoque e lançamento financeiro conferem com o comportamento aprovado para a OS. |
| A28 | Validar faturamento de venda e de empreitada quando o componente comum for alterado. | As operações mantêm a estratégia, as parcelas, os vínculos financeiros e os controles de acesso correspondentes. |

## 6. Protocolo para implementar uma etapa por vez

1. **Entrada do trabalho.** Informar ID da etapa, requisitos relacionados, decisões aprovadas, arquivos já identificados e casos de aceite. Para cada decisão pendente, descrever o trecho que depende dela e seguir com o restante da etapa quando possível.
2. **Antes da alteração.** Ler a implementação e seus consumidores. Reproduzir o cenário em homologação ou preparar uma massa equivalente. Confirmar contratos de banco e API a partir do ambiente e registrar os campos que a etapa realmente precisa.
3. **Alteração e verificação.** Limitar a mudança ao comportamento da etapa. Testar pelo ponto de entrada normal e, para comandos sensíveis, também por chamada direta autorizada e não autorizada. Conferir reconsulta em sessão nova, falhas intermediárias e repetição quando houver persistência.
4. **Saída do trabalho.** Registrar arquivos e contratos alterados, migrações aplicadas, casos executados, resultados e decisões ainda abertas. Usar essas evidências como entrada da etapa dependente.

## Fontes

- Documento do cliente *Melhorias na tela de Orçamentos EKIPE*, pp. 1–4. Base dos requisitos R01–R06 e da validação de regressão.
- Código local do frontend EKIPE Serviços e do servidor Delphi EKIPE Serviços. Os pontos de entrada e estruturas relevantes estão indicados no mapa da implementação.
