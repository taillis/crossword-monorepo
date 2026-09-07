import fs from 'fs';
import path from 'path';

interface RawWordNode {
  word: string;
  clue: string;
  category: string;
}

const DOMAIN_MAP: Record<string, string> = {
  'med.': 'ciencia',
  'quím.': 'ciencia',
  'fís.': 'ciencia',
  'mat.': 'ciencia',
  'astron.': 'ciencia',
  'bot.': 'natureza',
  'zool.': 'natureza',
  'biol.': 'natureza',
  'ictiol.': 'natureza',
  'entom.': 'natureza',
  'ornit.': 'natureza',
  'geog.': 'geografia',
  'top.': 'geografia',
  'hist.': 'historia',
  'mit.': 'historia',
  'arqueol.': 'historia',
  'mús.': 'arte',
  'teatr.': 'arte',
  'pint.': 'arte',
  'poét.': 'arte',
  'náut.': 'geral',
  'jur.': 'geral',
  'mil.': 'geral',
  'agr.': 'natureza',
};

// Base manual enriquecida de tecnologia
const TECH_WORDS: RawWordNode[] = [
  {
    word: 'TYPESCRIPT',
    clue: 'Superset tipado do JavaScript criado pela Microsoft',
    category: 'tecnologia',
  },
  {
    word: 'FASTIFY',
    clue: 'Framework web para Node.js focado em altíssima performance',
    category: 'tecnologia',
  },
  {
    word: 'REACT',
    clue: 'Biblioteca para construção de interfaces declarativas',
    category: 'tecnologia',
  },
  {
    word: 'TURBOREPO',
    clue: 'Ferramenta de build de alto desempenho para monorepos',
    category: 'tecnologia',
  },
  {
    word: 'DOCKER',
    clue: 'Plataforma para empacotar e executar aplicações em containers',
    category: 'tecnologia',
  },
  {
    word: 'GRAPHQL',
    clue: 'Linguagem de consulta e manipulação de APIs',
    category: 'tecnologia',
  },
  {
    word: 'POSTGRES',
    clue: 'Sistema gerenciador de banco de dados objeto-relacional',
    category: 'tecnologia',
  },
  {
    word: 'REDIS',
    clue: 'Armazenamento de estrutura de dados em memória usado como cache',
    category: 'tecnologia',
  },
  {
    word: 'KUBERNETES',
    clue: 'Sistema para automatizar a implantação e escalonamento de containers',
    category: 'tecnologia',
  },
  {
    word: 'VITE',
    clue: 'Ferramenta moderna de compilação e servidor local ultrarrápido',
    category: 'tecnologia',
  },
  {
    word: 'PYTHON',
    clue: 'Linguagem de programação interpretada e de tipagem dinâmica',
    category: 'tecnologia',
  },
  {
    word: 'JAVASCRIPT',
    clue: 'Linguagem de programação que roda nos navegadores web',
    category: 'tecnologia',
  },
  {
    word: 'LINUX',
    clue: 'Sistema operacional open source com núcleo criado por Linus Torvalds',
    category: 'tecnologia',
  },
  {
    word: 'BACKEND',
    clue: 'Camada de uma aplicação que roda no servidor e acessa o banco',
    category: 'tecnologia',
  },
  {
    word: 'FRONTEND',
    clue: 'Camada de interface visual acessada diretamente pelo usuário',
    category: 'tecnologia',
  },
  {
    word: 'ROUTER',
    clue: 'Dispositivo ou módulo responsável por encaminhar tráfego de rede',
    category: 'tecnologia',
  },
  {
    word: 'GATEWAY',
    clue: 'Ponto de conexão ou conversão entre duas redes diferentes',
    category: 'tecnologia',
  },
  {
    word: 'FIREWALL',
    clue: 'Dispositivo de segurança que monitora e filtra tráfego de rede',
    category: 'tecnologia',
  },
  {
    word: 'COMPILADOR',
    clue: 'Programa que traduz código-fonte em linguagem de máquina',
    category: 'tecnologia',
  },
  {
    word: 'ALGORITMO',
    clue: 'Conjunto ordenado e finito de passos para executar uma tarefa',
    category: 'tecnologia',
  },
  {
    word: 'DATABASE',
    clue: 'Coleção organizada de dados eletrônicos acessíveis via software',
    category: 'tecnologia',
  },
  {
    word: 'BACKTRACK',
    clue: 'Algoritmo que retrocede para encontrar soluções viáveis',
    category: 'tecnologia',
  },
  {
    word: 'FRAMEWORK',
    clue: 'Estrutura pré-fabricada que serve de suporte para desenvolvimento',
    category: 'tecnologia',
  },
  {
    word: 'MEMORIA',
    clue: 'Componente de hardware onde dados e instruções ficam alocados',
    category: 'tecnologia',
  },
  {
    word: 'SERVIDOR',
    clue: 'Computador ou programa que fornece serviços a outros clientes',
    category: 'tecnologia',
  },
  {
    word: 'ENCRIPTAR',
    clue: 'Codificar dados para proteger sua confidencialidade',
    category: 'tecnologia',
  },
  {
    word: 'PROTOCOLO',
    clue: 'Conjunto de regras que governam a transmissão de dados',
    category: 'tecnologia',
  },
  {
    word: 'VARIABLE',
    clue: 'Entidade que retém valor em linguagem de programação',
    category: 'tecnologia',
  },
  {
    word: 'TERMINAL',
    clue: 'Interface de linha de comando para interagir com o sistema',
    category: 'tecnologia',
  },
  {
    word: 'PACOTE',
    clue: 'Conjunto de arquivos e códigos distribuídos conjuntamente',
    category: 'tecnologia',
  },
  {
    word: 'INTERFACE',
    clue: 'Ponto de interação entre componentes de software ou com o usuário',
    category: 'tecnologia',
  },
  {
    word: 'BROWSER',
    clue: 'Navegador web utilizado para acessar e renderizar páginas',
    category: 'tecnologia',
  },
  {
    word: 'HARDWARE',
    clue: 'Parte física e tangível de um sistema de computação',
    category: 'tecnologia',
  },
  {
    word: 'SOFTWARE',
    clue: 'Conjunto de programas, rotinas e instruções executadas pelo computador',
    category: 'tecnologia',
  },
  {
    word: 'INTERNET',
    clue: 'Rede global interconectada de computadores e servidores',
    category: 'tecnologia',
  },
  {
    word: 'PIXEL',
    clue: 'Menor unidade de cor que forma uma imagem digital na tela',
    category: 'tecnologia',
  },
  {
    word: 'MONITOR',
    clue: 'Dispositivo de saída visual que exibe imagens do computador',
    category: 'tecnologia',
  },
  {
    word: 'TECLADO',
    clue: 'Dispositivo de entrada periférico com teclas para inserção de texto',
    category: 'tecnologia',
  },
  {
    word: 'DEBUGGER',
    clue: 'Ferramenta usada para testar e depurar erros de programação',
    category: 'tecnologia',
  },
  {
    word: 'PROMPT',
    clue: 'Instrução ou entrada de texto fornecida para guiar uma inteligência artificial',
    category: 'tecnologia',
  },
  {
    word: 'BACKUP',
    clue: 'Cópia de segurança de arquivos para recuperação em caso de perda',
    category: 'tecnologia',
  },
  {
    word: 'USUARIO',
    clue: 'Pessoa que utiliza um sistema computacional ou serviço digital',
    category: 'tecnologia',
  },
  {
    word: 'SISTEMA',
    clue: 'Conjunto integrado de partes que trabalham com um objetivo comum',
    category: 'tecnologia',
  },
  {
    word: 'SOCKET',
    clue: 'Ponto de terminação de fluxo de comunicação bidirecional em rede',
    category: 'tecnologia',
  },
  {
    word: 'THREAD',
    clue: 'Menor sequência de instruções que pode ser gerenciada pelo sistema operacional',
    category: 'tecnologia',
  },
  {
    word: 'NUVEM',
    clue: 'Modelo de computação onde recursos são acessados pela internet sob demanda',
    category: 'tecnologia',
  },
  {
    word: 'COMPUTADOR',
    clue: 'Máquina eletrônica que processa dados e executa instruções programadas',
    category: 'tecnologia',
  },
  {
    word: 'CHIP',
    clue: 'Pequeno componente semicondutor com circuitos eletrônicos integrados',
    category: 'tecnologia',
  },
  {
    word: 'CPU',
    clue: 'Unidade de processamento central que executa os cálculos principais',
    category: 'tecnologia',
  },
  {
    word: 'MOUSE',
    clue: 'Dispositivo periférico apontador usado para mover o cursor na tela',
    category: 'tecnologia',
  },
  {
    word: 'NOTEBOOK',
    clue: 'Computador portátil integrado com bateria, tela e teclado',
    category: 'tecnologia',
  },
  {
    word: 'TABLET',
    clue: 'Dispositivo móvel com tela sensível ao toque para navegação e leitura',
    category: 'tecnologia',
  },
  {
    word: 'SMARTPHONE',
    clue: 'Telefone celular inteligente com sistema operacional e acesso à internet',
    category: 'tecnologia',
  },
  {
    word: 'CELULAR',
    clue: 'Aparelho portátil de comunicação móvel e conectividade sem fio',
    category: 'tecnologia',
  },
  {
    word: 'CIRCUITO',
    clue: 'Caminho fechado por onde circula corrente elétrica entre componentes',
    category: 'tecnologia',
  },
  {
    word: 'CHIPSET',
    clue: 'Conjunto de circuitos integrados que gerencia a comunicação na placa-mãe',
    category: 'tecnologia',
  },
  {
    word: 'ROTEADOR',
    clue: 'Dispositivo de rede que encaminha pacotes de dados entre computadores',
    category: 'tecnologia',
  },
  {
    word: 'MODEM',
    clue: 'Aparelho que modula e converte sinais analógicos em dados digitais de internet',
    category: 'tecnologia',
  },
  {
    word: 'CABO',
    clue: 'Condutor protegido e flexível para transmissão de energia ou dados',
    category: 'tecnologia',
  },
  {
    word: 'FIBRA',
    clue: 'Meio óptico de transmissão de dados em altíssima velocidade pela luz',
    category: 'tecnologia',
  },
  {
    word: 'BLUETOOTH',
    clue: 'Protocolo de comunicação sem fio para curta distância entre dispositivos',
    category: 'tecnologia',
  },
  {
    word: 'BATERIA',
    clue: 'Dispositivo que acumula energia química para alimentar aparelhos eletrônicos',
    category: 'tecnologia',
  },
  {
    word: 'WEBCAM',
    clue: 'Câmera de vídeo digital integrada ou conectada ao computador para chamadas',
    category: 'tecnologia',
  },
  {
    word: 'MICROFONE',
    clue: 'Periférico de entrada que converte ondas sonoras em sinais de áudio',
    category: 'tecnologia',
  },
  {
    word: 'HEADSET',
    clue: 'Aparelho que combina fones de ouvido e microfone em uma única haste',
    category: 'tecnologia',
  },
  {
    word: 'IMPRESSORA',
    clue: 'Periférico de saída que transfere textos e imagens digitais para o papel',
    category: 'tecnologia',
  },
  {
    word: 'SCANNER',
    clue: 'Dispositivo de digitalização óptica de imagens e documentos impressos',
    category: 'tecnologia',
  },
  {
    word: 'SENSOR',
    clue: 'Componente eletrônico que detecta estímulos físicos como luz, calor ou toque',
    category: 'tecnologia',
  },
  {
    word: 'COOLER',
    clue: 'Ventoinha interna usada para refrigerar processadores e placas',
    category: 'tecnologia',
  },
  {
    word: 'PLACA',
    clue: 'Base rígida de circuito impresso onde são soldados chips e componentes',
    category: 'tecnologia',
  },
  {
    word: 'CONECTOR',
    clue: 'Dispositivo físico para encaixe e ligação entre cabos e portas',
    category: 'tecnologia',
  },
  {
    word: 'CODIGO',
    clue: 'Conjunto de instruções e comandos escritos em linguagem de programação',
    category: 'tecnologia',
  },
  {
    word: 'PROGRAMA',
    clue: 'Sequência de instruções elaboradas para o computador realizar tarefas',
    category: 'tecnologia',
  },
  {
    word: 'SCRIPT',
    clue: 'Arquivo de texto com comandos executados diretamente por um interpretador',
    category: 'tecnologia',
  },
  {
    word: 'FUNCAO',
    clue: 'Sub-rotina que recebe parâmetros, executa ações e retorna um resultado',
    category: 'tecnologia',
  },
  {
    word: 'CONSTANTE',
    clue: 'Espaço de armazenamento de dados cujo valor não pode ser alterado',
    category: 'tecnologia',
  },
  {
    word: 'COMANDO',
    clue: 'Instrução dada ao sistema ou terminal para execução de uma operação',
    category: 'tecnologia',
  },
  {
    word: 'INTERPRETE',
    clue: 'Programa que analisa e executa código-fonte linha por linha em tempo real',
    category: 'tecnologia',
  },
  {
    word: 'MODULO',
    clue: 'Unidade de software independente que agrupa funções e funcionalidades afins',
    category: 'tecnologia',
  },
  {
    word: 'BIBLIOTECA',
    clue: 'Coleção de rotinas e códigos prontos reutilizáveis por outros programas',
    category: 'tecnologia',
  },
  {
    word: 'CLASSE',
    clue: 'Modelo na programação orientada a objetos que define atributos e métodos',
    category: 'tecnologia',
  },
  {
    word: 'OBJETO',
    clue: 'Instância de uma classe contendo propriedades de estado e comportamento',
    category: 'tecnologia',
  },
  {
    word: 'METODO',
    clue: 'Procedimento ou função pertencente a um objeto ou classe',
    category: 'tecnologia',
  },
  {
    word: 'VETOR',
    clue: 'Estrutura unidimensional de dados organizada por índices numéricos',
    category: 'tecnologia',
  },
  {
    word: 'MATRIZ',
    clue: 'Estrutura bidimensional de dados organizada em linhas e colunas',
    category: 'tecnologia',
  },
  {
    word: 'INDICE',
    clue: 'Número inteiro que especifica a posição de um item em uma coleção',
    category: 'tecnologia',
  },
  {
    word: 'STRING',
    clue: 'Tipo de dado que representa uma cadeia ordenada de caracteres de texto',
    category: 'tecnologia',
  },
  {
    word: 'NUMERO',
    clue: 'Tipo de dado utilizado para quantificação e operações matemáticas',
    category: 'tecnologia',
  },
  {
    word: 'BOOLEANO',
    clue: 'Tipo de dado lógico primitivo que admite apenas os valores verdadeiro ou falso',
    category: 'tecnologia',
  },
  {
    word: 'CONDICAO',
    clue: 'Estrutura de decisão que define bifurcações no fluxo do programa',
    category: 'tecnologia',
  },
  {
    word: 'LACO',
    clue: 'Estrutura de repetição que executa um bloco de código iterativamente',
    category: 'tecnologia',
  },
  {
    word: 'RETORNO',
    clue: 'Valor enviado de volta ao ponto de invocação de uma função',
    category: 'tecnologia',
  },
  {
    word: 'PARAMETRO',
    clue: 'Variável declarada na assinatura de uma função para receber argumentos',
    category: 'tecnologia',
  },
  {
    word: 'RECURSAO',
    clue: 'Conceito de programação onde uma função invoca a si própria diretamente',
    category: 'tecnologia',
  },
  {
    word: 'PONTEIRO',
    clue: 'Variável especial cujo valor armazenado é o endereço de memória de outra',
    category: 'tecnologia',
  },
  {
    word: 'TABELA',
    clue: 'Estrutura relacional do banco de dados composta por linhas e colunas',
    category: 'tecnologia',
  },
  {
    word: 'CONSULTA',
    clue: 'Instrução de requisição feita a um banco para recuperar registros',
    category: 'tecnologia',
  },
  {
    word: 'REGISTRO',
    clue: 'Linha individual de uma tabela que reúne atributos de uma entidade',
    category: 'tecnologia',
  },
  {
    word: 'COLUNA',
    clue: 'Campo vertical estruturado de dados com mesmo tipo em uma tabela',
    category: 'tecnologia',
  },
  {
    word: 'BANCO',
    clue: 'Sistema eletrônico projetado para armazenar, consultar e gerenciar dados',
    category: 'tecnologia',
  },
  {
    word: 'SCHEMA',
    clue: 'Estrutura descritiva ou diagrama formal de organização de um banco de dados',
    category: 'tecnologia',
  },
  {
    word: 'DEPLOY',
    clue: 'Ato de publicar, instalar e disponibilizar uma aplicação para os usuários',
    category: 'tecnologia',
  },
  {
    word: 'RELEASE',
    clue: 'Versão oficial distribuída de um produto de software após testes',
    category: 'tecnologia',
  },
  {
    word: 'KERNEL',
    clue: 'Núcleo essencial do sistema operacional que intermedeia software e hardware',
    category: 'tecnologia',
  },
  {
    word: 'CONSOLE',
    clue: 'Painel textual que exibe mensagens, advertências e saídas do sistema',
    category: 'tecnologia',
  },
  {
    word: 'JANELA',
    clue: 'Área retangular na interface gráfica delimitando a visualização de um aplicativo',
    category: 'tecnologia',
  },
  {
    word: 'ICONE',
    clue: 'Pequeno símbolo gráfico representativo de um arquivo, pasta ou aplicativo',
    category: 'tecnologia',
  },
  {
    word: 'BOTAO',
    clue: 'Elemento clicável da interface gráfica que dispara uma ação ao usuário',
    category: 'tecnologia',
  },
  {
    word: 'MENU',
    clue: 'Lista suspensa ou painel com opções de navegação e comandos disponíveis',
    category: 'tecnologia',
  },
  {
    word: 'FORMULARIO',
    clue: 'Interface com campos interativos para preenchimento e envio de dados',
    category: 'tecnologia',
  },
  {
    word: 'CAMPO',
    clue: 'Espaço de digitação delimitado em formulários para entrada de texto',
    category: 'tecnologia',
  },
  {
    word: 'CURSOR',
    clue: 'Indicador gráfico móvel na tela que aponta a posição de foco ou clique',
    category: 'tecnologia',
  },
  {
    word: 'ATALHO',
    clue: 'Combinação de teclas que aciona de forma rápida um comando frequente',
    category: 'tecnologia',
  },
  {
    word: 'ARQUIVO',
    clue: 'Unidade nomeada de dados gravada em suporte de memória não volátil',
    category: 'tecnologia',
  },
  {
    word: 'PASTA',
    clue: 'Diretório do sistema de arquivos usado para organizar itens hierarquicamente',
    category: 'tecnologia',
  },
  {
    word: 'EXTENSAO',
    clue: 'Identificador sufixado ao nome do arquivo que informa seu formato',
    category: 'tecnologia',
  },
  {
    word: 'BINARIO',
    clue: 'Sistema numérico de base dois constituído unicamente pelos dígitos 0 e 1',
    category: 'tecnologia',
  },
  {
    word: 'BYTE',
    clue: 'Unidade padrão de informação digital formada por uma sequência de 8 bits',
    category: 'tecnologia',
  },
  {
    word: 'BIT',
    clue: 'Menor unidade elementar de dado digital em computação binária',
    category: 'tecnologia',
  },
  {
    word: 'SITE',
    clue: 'Conjunto integrado de páginas na internet publicadas sob um domínio',
    category: 'tecnologia',
  },
  {
    word: 'PORTAL',
    clue: 'Página principal da internet que reúne serviços, links e buscas',
    category: 'tecnologia',
  },
  {
    word: 'LINK',
    clue: 'Elemento de hipertexto clicável que conduz a outra página ou recurso',
    category: 'tecnologia',
  },
  {
    word: 'DOMINIO',
    clue: 'Nome legível registrado na internet que identifica o endereço de um servidor',
    category: 'tecnologia',
  },
  {
    word: 'URL',
    clue: 'Endereço padronizado que localiza recursos específicos na rede mundial',
    category: 'tecnologia',
  },
  {
    word: 'SEGURANCA',
    clue: 'Conjunto de práticas e ferramentas para proteger dados e redes contra ataques',
    category: 'tecnologia',
  },
  {
    word: 'SENHA',
    clue: 'Código secreto de caracteres utilizado para autenticar acesso de usuário',
    category: 'tecnologia',
  },
  {
    word: 'TOKEN',
    clue: 'Chave eletrônica temporária gerada para autorização segura de requisições',
    category: 'tecnologia',
  },
  {
    word: 'HASH',
    clue: 'Código numérico irreversível de tamanho fixo derivado de dados arbitrários',
    category: 'tecnologia',
  },
  {
    word: 'CHAVE',
    clue: 'Informação secreta empregada em algoritmos para cifrar ou decifrar dados',
    category: 'tecnologia',
  },
  {
    word: 'ANTIVIRUS',
    clue: 'Programa voltado à detecção, isolamento e eliminação de softwares nocivos',
    category: 'tecnologia',
  },
  {
    word: 'MALWARE',
    clue: 'Programa mal-intencionado desenvolvido para causar danos ou espionar sistemas',
    category: 'tecnologia',
  },
  {
    word: 'SPAM',
    clue: 'Mensagem eletrônica enviada massivamente e sem consentimento dos destinatários',
    category: 'tecnologia',
  },
  {
    word: 'HACKER',
    clue: 'Indivíduo com alto domínio técnico sobre sistemas, redes e segurança',
    category: 'tecnologia',
  },
  {
    word: 'COOKIE',
    clue: 'Pequeno registro de texto gravado no navegador para salvar dados de navegação',
    category: 'tecnologia',
  },
  {
    word: 'SESSAO',
    clue: 'Intervalo temporal contínuo em que o usuário permanece ativo em uma aplicação',
    category: 'tecnologia',
  },
  {
    word: 'LOGIN',
    clue: 'Procedimento de identificação e validação de credenciais de um usuário',
    category: 'tecnologia',
  },
  {
    word: 'LOGOUT',
    clue: 'Encerramento formal e seguro de uma sessão autenticada em um sistema',
    category: 'tecnologia',
  },
  {
    word: 'PERFIL',
    clue: 'Conjunto individualizado de informações e preferências de uma conta',
    category: 'tecnologia',
  },
  {
    word: 'SERVICO',
    clue: 'Programa autônomo executado em segundo plano para prestar recursos contínuos',
    category: 'tecnologia',
  },
  {
    word: 'PROCESSO',
    clue: 'Programa em execução pelo sistema operacional com memória própria reservada',
    category: 'tecnologia',
  },
  {
    word: 'DRIVER',
    clue: 'Componente de software que ensina o sistema operacional a operar um periférico',
    category: 'tecnologia',
  },
  {
    word: 'ATUALIZAR',
    clue: 'Aplicar novas versões e correções de segurança em um programa instalado',
    category: 'tecnologia',
  },
  {
    word: 'INSTALAR',
    clue: 'Copiar e configurar os arquivos de um novo programa para uso no computador',
    category: 'tecnologia',
  },
  {
    word: 'EXECUTAR',
    clue: 'Iniciar o processamento e rodar os comandos de um programa de computador',
    category: 'tecnologia',
  },
  {
    word: 'SALVAR',
    clue: 'Gravar informações e arquivos editados em memória persistente de disco',
    category: 'tecnologia',
  },
  {
    word: 'COPIAR',
    clue: 'Duplicar dados selecionados para a memória temporária de transferência',
    category: 'tecnologia',
  },
  {
    word: 'COLAR',
    clue: 'Inserir dados previamente copiados na posição indicada do cursor',
    category: 'tecnologia',
  },
  {
    word: 'RECORTAR',
    clue: 'Remover a seleção atual do local de origem transferindo-a para colagem',
    category: 'tecnologia',
  },
  {
    word: 'DESFAZER',
    clue: 'Reverter a ação mais recente realizada em um editor ou software',
    category: 'tecnologia',
  },
  {
    word: 'REFAZER',
    clue: 'Reexecutar a última ação que havia sido desfeita pelo usuário',
    category: 'tecnologia',
  },
  {
    word: 'BUSCAR',
    clue: 'Localizar termos específicos dentro de documentos, bancos ou páginas',
    category: 'tecnologia',
  },
  {
    word: 'FILTRO',
    clue: 'Recurso computacional para selecionar somente dados que preencham critérios',
    category: 'tecnologia',
  },
  {
    word: 'ORDENAR',
    clue: 'Dispor registros em sequência lógica crescente ou decrescente',
    category: 'tecnologia',
  },
  {
    word: 'IMPRIMIR',
    clue: 'Emitir texto ou imagem eletrônica em meio físico de papel',
    category: 'tecnologia',
  },
  {
    word: 'FORMATAR',
    clue: 'Preparar a estrutura de um disco para gravação ou ajustar estilos de texto',
    category: 'tecnologia',
  },
  {
    word: 'DIGITAR',
    clue: 'Pressionar teclas mecânicas ou virtuais para formar palavras na tela',
    category: 'tecnologia',
  },
  {
    word: 'CLICAR',
    clue: 'Pressionar e liberar rapidamente o botão do mouse ou tocar na tela',
    category: 'tecnologia',
  },
  {
    word: 'ROLAR',
    clue: 'Deslizar o conteúdo visual da janela verticalmente ou lateralmente',
    category: 'tecnologia',
  },
  {
    word: 'ARRASTAR',
    clue: 'Mover itens na tela mantendo pressionado o botão do dispositivo apontador',
    category: 'tecnologia',
  },
  {
    word: 'FECHAR',
    clue: 'Encerrar a visualização ativa de uma aba, janela ou aplicativo',
    category: 'tecnologia',
  },
  {
    word: 'MINIMIZAR',
    clue: 'Ocultar a janela de um aplicativo recolhendo-a para a barra de tarefas',
    category: 'tecnologia',
  },
  {
    word: 'MAXIMIZAR',
    clue: 'Ampliar o tamanho da janela até ocupar as dimensões totais do monitor',
    category: 'tecnologia',
  },
  {
    word: 'REINICIAR',
    clue: 'Desligar e religar o computador para reinicializar todo o sistema',
    category: 'tecnologia',
  },
  {
    word: 'TRAVAR',
    clue: 'Condição em que um software para de responder aos comandos do usuário',
    category: 'tecnologia',
  },
  {
    word: 'FALHA',
    clue: 'Defeito ou interrupção que causa comportamento inesperado no sistema',
    category: 'tecnologia',
  },
  {
    word: 'CORRECAO',
    clue: 'Alteração pontual de código desenvolvida para eliminar um bug conhecido',
    category: 'tecnologia',
  },
  {
    word: 'PATCH',
    clue: 'Pequeno pacote de atualização criado para corrigir defeitos de software',
    category: 'tecnologia',
  },
  {
    word: 'VERSAO',
    clue: 'Identificação sequencial do estado de maturidade de um software',
    category: 'tecnologia',
  },
  {
    word: 'LICENCA',
    clue: 'Termo contratual que estabelece os direitos legais de uso de um software',
    category: 'tecnologia',
  },
  {
    word: 'FONTE',
    clue: 'Conjunto de arquivos de texto contendo o código original escrito pelo programador',
    category: 'tecnologia',
  },
  {
    word: 'REPO',
    clue: 'Abreviação técnica para repositório de controle de versão de software',
    category: 'tecnologia',
  },
  {
    word: 'GIT',
    clue: 'Sistema moderno distribuído para versionamento de código-fonte',
    category: 'tecnologia',
  },
  {
    word: 'DADO',
    clue: 'Informação bruta processada e armazenada por sistemas computacionais',
    category: 'tecnologia',
  },
  {
    word: 'LOG',
    clue: 'Registro sequencial de eventos ocorridos em um sistema ou programa',
    category: 'tecnologia',
  },
  {
    word: 'API',
    clue: 'Interface que possibilita a comunicação e integração entre sistemas',
    category: 'tecnologia',
  },
  {
    word: 'APP',
    clue: 'Aplicativo ou software projetado para uma finalidade específica',
    category: 'tecnologia',
  },
  {
    word: 'BRANCH',
    clue: 'Linha paralela e independente de desenvolvimento no controle de versão',
    category: 'tecnologia',
  },
  {
    word: 'COMMIT',
    clue: 'Ato de salvar e registrar alterações no histórico do sistema de versão',
    category: 'tecnologia',
  },
  {
    word: 'MERGE',
    clue: 'Fusão do código de duas ramificações distintas em uma ramificação única',
    category: 'tecnologia',
  },
  {
    word: 'CONFLITO',
    clue: 'Divergência entre alterações simultâneas no mesmo trecho de arquivo',
    category: 'tecnologia',
  },
  {
    word: 'TAG',
    clue: 'Marcador nomeado que aponta para um ponto específico do histórico do código',
    category: 'tecnologia',
  },
  {
    word: 'GITHUB',
    clue: 'Plataforma na nuvem para hospedagem e colaboração em projetos Git',
    category: 'tecnologia',
  },
];

function normalizeWord(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z]/g, '');
}

function cleanClue(rawDef: string): string {
  let cleaned = rawDef
    .replace(/<[^>]*>/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s,;.:-]+/, '')
    .trim();

  const dotIndex = cleaned.indexOf('.');
  if (dotIndex > 10 && dotIndex < 140) {
    cleaned = cleaned.substring(0, dotIndex).trim();
  } else if (cleaned.length > 130) {
    cleaned = cleaned.substring(0, 130).trim() + '...';
  }

  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned;
}

async function fetchLetterXML(letter: string): Promise<string> {
  const url = `https://raw.githubusercontent.com/ioxua/dicionario-aberto/master/raw/${letter}.xml`;
  console.log(`Baixando letra ${letter}...`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Falha ao baixar ${url}: status ${res.status}`);
  }
  return await res.text();
}

function parseEntries(xml: string): RawWordNode[] {
  const results: RawWordNode[] = [];
  const entryRegex = /<entry id="([^"]+)"[^>]*>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entryContent = match[2];

    const orthMatch = /<orth>([\s\S]*?)<\/orth>/.exec(entryContent);
    if (!orthMatch) continue;
    const rawWord = orthMatch[1].trim();

    const normalized = normalizeWord(rawWord);
    if (normalized.length < 3 || normalized.length > 10) continue;

    const defMatch = /<def>([\s\S]*?)<\/def>/.exec(entryContent);
    if (!defMatch) continue;
    const clue = cleanClue(defMatch[1]);
    if (clue.length < 5) continue;

    const usgMatch = /<usg type="dom">([\s\S]*?)<\/usg>/.exec(entryContent);
    let category = 'geral';
    if (usgMatch) {
      const dom = usgMatch[1].toLowerCase().trim();
      category = DOMAIN_MAP[dom] || 'geral';
    }

    // Classificação semântica por palavras-chave se ainda estiver como geral
    if (category === 'geral') {
      const lowerClue = clue.toLowerCase();
      if (
        /planta|árvore|flor|folha|fruto|ave|pássaro|peixe|animal|mamífero|inseto|réptil|floresta|erva|arbusto/i.test(
          lowerClue
        )
      ) {
        category = 'natureza';
      } else if (
        /física|química|mineral|átomo|molécula|célula|órbita|planeta|estrela|astronomia|matemática|doença|médic|bactéria|vírus/i.test(
          lowerClue
        )
      ) {
        category = 'ciencia';
      } else if (
        /país|cidade|rio|montanha|capital|ilha|continente|oceano|mar|província|região|relevo|lago|serra/i.test(
          lowerClue
        )
      ) {
        category = 'geografia';
      } else if (
        /antigo|século|guerra|imperador|monarca|dinastia|revolução|grego|romano|medieval|história|império/i.test(
          lowerClue
        )
      ) {
        category = 'historia';
      }
    }

    results.push({
      word: normalized,
      clue,
      category,
    });
  }

  return results;
}

async function main() {
  const wordMap = new Map<string, RawWordNode>();

  // 1. Adiciona as palavras de tecnologia
  for (const item of TECH_WORDS) {
    wordMap.set(item.word, item);
  }

  // 2. Extrai de múltiplas letras do alfabeto (A a Z)
  const letters = [
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'H',
    'I',
    'J',
    'M',
    'N',
    'O',
    'P',
    'Q',
    'T',
    'U',
    'V',
    'Z',
  ];
  const maxPerLetter = 380;

  for (const letter of letters) {
    try {
      const xml = await fetchLetterXML(letter);
      const entries = parseEntries(xml);

      let addedFromLetter = 0;
      for (const entry of entries) {
        if (!wordMap.has(entry.word)) {
          wordMap.set(entry.word, entry);
          addedFromLetter++;
          if (addedFromLetter >= maxPerLetter) break;
        }
      }
      console.log(`Letra ${letter}: adicionadas ${addedFromLetter} palavras.`);
    } catch (err) {
      console.error(`Erro ao processar letra ${letter}:`, err);
    }
  }

  console.log(`\nFinalizado com ${wordMap.size} palavras únicas!`);

  // 3. Organizar por categorias normalizadas (sem acentos nas chaves para evitar mismatch)
  const categorized: Record<string, { word: string; clue: string }[]> = {
    todos: [],
    geral: [],
    ciencia: [],
    natureza: [],
    geografia: [],
    historia: [],
    tecnologia: [],
  };

  for (const node of wordMap.values()) {
    const item = { word: node.word, clue: node.clue };
    categorized.todos.push(item);
    if (categorized[node.category]) {
      categorized[node.category].push(item);
    } else {
      categorized.geral.push(item);
    }
  }

  // Estatísticas
  console.log('\nDistribuição final por categorias:');
  for (const [cat, list] of Object.entries(categorized)) {
    console.log(`- ${cat}: ${list.length} palavras`);
  }

  // 4. Salvar em packages/shared-types/src/data/words.json
  const outDir = path.resolve(__dirname, '../packages/shared-types/src/data');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outFile = path.join(outDir, 'words.json');
  fs.writeFileSync(outFile, JSON.stringify(categorized, null, 2), 'utf-8');
  console.log(`\n✅ Arquivo salvo com sucesso em: ${outFile}`);
}

main().catch(console.error);
