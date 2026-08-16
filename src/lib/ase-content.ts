import type { Purpose, Question, ScoreValue } from "./ase-types";

// The five biblical purposes, in the order the conductor works through them.
export const PURPOSES: Purpose[] = [
  { id: "adoracao", name: "Adoração", order: 1 },
  { id: "comunhao", name: "Comunhão", order: 2 },
  { id: "discipulado", name: "Discipulado", order: 3 },
  { id: "ministerio", name: "Ministério", order: 4 },
  { id: "evangelismo", name: "Evangelismo", order: 5 },
];

// Questions transcribed from the current ASE spreadsheet, each with the
// biblical verse that grounds it (7 questions per purpose = 35 total).
type RawQuestion = { text: string; verseRef: string; verseText: string };

const RAW: Record<string, RawQuestion[]> = {
  adoracao: [
    {
      text: "A maneira como vive mostra que Deus é sua maior prioridade em sua vida?",
      verseRef: "Mateus 22:37",
      verseText:
        "Jesus respondeu: — “Ame o Senhor, seu Deus, com todo o coração, com toda a alma e com toda a mente.”",
    },
    {
      text: "Costuma buscar a direção de Deus nas decisões importantes da sua vida?",
      verseRef: "Provérbios 3:5-6",
      verseText:
        "Confie no Senhor de todo o coração e não se apoie na sua própria inteligência. Lembre de Deus em tudo o que fizer, e ele lhe mostrará o caminho certo.",
    },
    {
      text: "Demonstra disposição para submeter todas as áreas da sua vida à vontade de Deus?",
      verseRef: "Romanos 12:1-2",
      verseText:
        "Portanto, meus irmãos, por causa da grande misericórdia divina, peço que vocês se ofereçam completamente a Deus como um sacrifício vivo, dedicado ao seu serviço e agradável a ele. Esta é a verdadeira adoração que vocês devem oferecer a Deus. Não vivam como vivem as pessoas deste mundo, mas deixem que Deus os transforme por meio de uma completa mudança da mente de vocês. Assim vocês conhecerão a vontade de Deus, isto é, aquilo que é bom, perfeito e agradável a ele.",
    },
    {
      text: "Medita regularmente na Palavra de Deus e procura aplicá-la nas atividades do dia a dia?",
      verseRef: "Salmos 119:105",
      verseText:
        "A tua palavra é lâmpada para guiar os meus passos, é luz que ilumina o meu caminho.",
    },
    {
      text: "Demonstra interesse em cultivar momentos regulares de oração e comunhão com Deus?",
      verseRef: "Lucas 5:16",
      verseText: "Porém Jesus ia para lugares desertos e orava.",
    },
    {
      text: "É coerente em sua vida, sendo a mesma pessoa em público e em privado?",
      verseRef: "Provérbios 10:9",
      verseText:
        "A pessoa honesta anda em paz e segurança, mas a desonesta será desmascarada.",
    },
    {
      text: "Mesmo em períodos difíceis, continua reconhecendo a fidelidade e a ação de Deus em sua vida?",
      verseRef: "Habacuque 3:17-18",
      verseText:
        "Ainda que as figueiras não produzam frutas, e as parreiras não deem uvas; ainda que não haja azeitonas para apanhar nem trigo para colher; ainda que não haja mais ovelhas nos campos nem gado nos currais, mesmo assim eu darei graças ao Senhor e louvarei a Deus, o meu Salvador.",
    },
  ],
  comunhao: [
    {
      text: "Demonstra abertura e honestidade ao compartilhar sua vida, desafios e necessidades com pessoas de confiança?",
      verseRef: "Tiago 5:16",
      verseText:
        "Portanto, confessem os seus pecados uns aos outros e façam oração uns pelos outros, para que vocês sejam curados. A oração de uma pessoa obediente a Deus tem muito poder.",
    },
    {
      text: "Regularmente usa seu tempo e recursos para cuidar das necessidades dos outros?",
      verseRef: "Atos 2:44-45",
      verseText:
        "Todos os que criam estavam juntos e unidos e repartiam uns com os outros o que tinham. Vendiam as suas propriedades e outras coisas e dividiam o dinheiro com todos, de acordo com a necessidade de cada um.",
    },
    {
      text: "Mantém relacionamentos próximos e saudáveis com pessoas da igreja?",
      verseRef: "Hebreus 10:24-25",
      verseText:
        "Pensemos uns nos outros a fim de ajudarmos todos a terem mais amor e a fazerem o bem. Não abandonemos, como alguns estão fazendo, o costume de assistir às nossas reuniões. Pelo contrário, animemos uns aos outros e ainda mais agora que vocês veem que o dia está chegando.",
    },
    {
      text: "Recebe conselhos, encorajamentos e correções com humildade e disposição para aprender?",
      verseRef: "Provérbios 12:15",
      verseText:
        "O tolo pensa que sempre está certo, mas os sábios aceitam conselhos.",
    },
    {
      text: "Participa regularmente de um pequeno grupo para desfrutar de comunhão e prestar contas?",
      verseRef: "Atos 2:46",
      verseText:
        "Todos os dias, unidos, se reuniam no pátio do Templo. E nas suas casas partiam o pão e participavam das refeições com alegria e humildade.",
    },
    {
      text: "Ele busca manter relacionamentos saudáveis e reconciliados com as pessoas ao seu redor?",
      verseRef: "Mateus 18:15",
      verseText:
        "Se o seu irmão pecar contra você, vá e mostre-lhe o seu erro. Mas faça isso em particular, só entre vocês dois. Se essa pessoa ouvir o seu conselho, então você ganhou de volta o seu irmão.",
    },
    {
      text: "Fala sobre as pessoas com respeito, evitando críticas destrutivas, fofocas ou comentários que não faria na presença delas?",
      verseRef: "Efésios 4:29",
      verseText:
        "Não digam palavras que fazem mal aos outros, mas usem apenas palavras boas, que ajudam os outros a crescer na fé e a conseguir o que necessitam, para que as coisas que vocês dizem façam bem aos que ouvem.",
    },
  ],
  discipulado: [
    {
      text: "Confessa com sinceridade qualquer aspecto do seu caráter que ainda não reflita a semelhança com Cristo?",
      verseRef: "1 João 1:9",
      verseText:
        "Mas, se confessarmos os nossos pecados a Deus, ele cumprirá a sua promessa e fará o que é correto: ele perdoará os nossos pecados e nos limpará de toda maldade.",
    },
    {
      text: "Uma revisão de como usa seus recursos/finanças mostram que pensa mais em Deus e nos outros do que em si mesmo?",
      verseRef: "Mateus 6:21",
      verseText:
        "Pois onde estiverem as suas riquezas, aí estará o coração de vocês.",
    },
    {
      text: "Suas decisões e atitudes demonstram que procura viver de acordo com os ensinamentos da Palavra de Deus?",
      verseRef: "Tiago 1:22",
      verseText:
        "Não se enganem; não sejam apenas ouvintes dessa mensagem, mas a ponham em prática.",
    },
    {
      text: "Mesmo em momentos difíceis, continua confiando em Deus e mantendo uma atitude de fé?",
      verseRef: "Romanos 5:3-5",
      verseText:
        "E também nos alegramos nos sofrimentos, pois sabemos que os sofrimentos produzem a paciência, a paciência traz a aprovação de Deus, e essa aprovação cria a esperança. Essa esperança não nos deixa decepcionados, pois Deus derramou o seu amor no nosso coração, por meio do Espírito Santo, que ele nos deu.",
    },
    {
      text: "Toma decisões visando fazer o que é certo, mesmo quando enfrenta tentações para agir de forma contrária?",
      verseRef: "1 Coríntios 10:13",
      verseText:
        "As tentações que vocês têm de enfrentar são as mesmas que os outros enfrentam; mas Deus cumpre a sua promessa e não deixará que vocês sofram tentações que vocês não têm forças para suportar. Quando uma tentação vier, Deus dará forças a vocês para suportá-la, e assim vocês poderão sair dela.",
    },
    {
      text: "Já percebeu que a oração tem mudado a forma como vê e se relaciona com o mundo?",
      verseRef: "Filipenses 4:6-7",
      verseText:
        "Não se preocupem com nada, mas em todas as orações peçam a Deus o que vocês precisam e orem sempre com o coração agradecido. E a paz de Deus, que ninguém consegue entender, guardará o coração e a mente de vocês, pois vocês estão unidos com Cristo Jesus.",
    },
    {
      text: "Busca cultivar hábitos que moldem sua vida para se parecer cada vez mais com Jesus?",
      verseRef: "1 Timóteo 4:7-8",
      verseText:
        "Mas não tenha nada a ver com as lendas pagãs e tolas. Para progredir na vida cristã, faça sempre exercícios espirituais. Pois os exercícios físicos têm alguma utilidade, mas o exercício espiritual tem valor para tudo porque o seu resultado é a vida, tanto agora como no futuro.",
    },
  ],
  ministerio: [
    {
      text: "Costuma dedicar regularmente seu tempo para servir a Deus?",
      verseRef: "Colossenses 3:23-24",
      verseText:
        "O que vocês fizerem façam de todo o coração, como se estivessem servindo o Senhor e não as pessoas. Lembrem que o Senhor lhes dará como recompensa aquilo que ele tem guardado para o seu povo, pois o verdadeiro Senhor que vocês servem é Cristo.",
    },
    {
      text: "Atualmente, está servindo a Deus usando os dons e a paixão que Ele lhe deu?",
      verseRef: "1 Pedro 4:10",
      verseText:
        "Sejam bons administradores dos diferentes dons que receberam de Deus. Que cada um use o seu próprio dom para o bem dos outros!",
    },
    {
      text: "Regularmente reflete sobre como sua vida pode impactar o Reino de Deus?",
      verseRef: "Mateus 6:33",
      verseText:
        "Portanto, ponham em primeiro lugar na sua vida o Reino de Deus e aquilo que Deus quer, e ele lhes dará todas essas coisas.",
    },
    {
      text: "Procura oportunidades para colocar seus dons e habilidades a serviço de Deus?",
      verseRef: "Romanos 12:6-8",
      verseText:
        "Portanto, usemos os nossos diferentes dons de acordo com a graça que Deus nos deu. Se o dom que recebemos é o de anunciar a mensagem de Deus, façamos isso de acordo com a fé que temos. Se é o dom de servir, então devemos servir; se é o de ensinar, então ensinemos; se é o dom de animar os outros, então animemos. Quem reparte com os outros o que tem, que faça isso com generosidade. Quem tem autoridade, que use a sua autoridade com todo o cuidado. Quem ajuda os outros, que ajude com alegria.",
    },
    {
      text: "Gosta de atender às necessidades dos outros sem esperar nada em troca?",
      verseRef: "Filipenses 2:3-4",
      verseText:
        "Não façam nada por interesse pessoal ou por desejos tolos de receber elogios; mas sejam humildes e considerem os outros superiores a vocês mesmos. Que ninguém procure somente os seus próprios interesses, mas também os dos outros.",
    },
    {
      text: "Pessoas próximas diriam que sua vida é um reflexo de dar mais do que receber?",
      verseRef: "Atos 20:35",
      verseText:
        "Em tudo tenho mostrado a vocês que é trabalhando assim que podemos ajudar os necessitados. Lembrem das palavras do Senhor Jesus: “É mais feliz quem dá do que quem recebe.”",
    },
    {
      text: "Vê suas experiências dolorosas como oportunidades de ministrar a outras pessoas?",
      verseRef: "2 Coríntios 1:3-4",
      verseText:
        "Louvado seja o Deus e Pai do nosso Senhor Jesus Cristo, o Pai bondoso, o Deus de quem todos recebem ajuda! Ele nos auxilia em todas as nossas aflições para podermos ajudar os que têm as mesmas aflições que nós temos. E nós damos aos outros a mesma ajuda que recebemos de Deus.",
    },
  ],
  evangelismo: [
    {
      text: "Demonstra interesse e iniciativa em compartilhar sua fé com pessoas que ainda não conhecem Jesus?",
      verseRef: "Mateus 28:19-20",
      verseText:
        "Portanto, vão a todos os povos do mundo e façam com que sejam meus seguidores, batizando esses seguidores em nome do Pai, do Filho e do Espírito Santo e ensinando-os a obedecer a tudo o que tenho ordenado a vocês. E lembrem disto: eu estou com vocês todos os dias, até o fim dos tempos.",
    },
    {
      text: "Procura oportunidades de criar relacionamentos com aqueles que não conhecem Jesus?",
      verseRef: "Colossenses 4:5-6",
      verseText:
        "Sejam sábios na sua maneira de agir com os que não creem e aproveitem bem o tempo que passarem com eles. Que as suas conversas sejam sempre agradáveis e de bom gosto, e que vocês saibam também como responder a cada pessoa!",
    },
    {
      text: "Ora regularmente por aqueles que não conhecem a Jesus Cristo?",
      verseRef: "1 Timóteo 2:1-4",
      verseText:
        "Em primeiro lugar peço que sejam feitos orações, pedidos, súplicas e ações de graças a Deus em favor de todas as pessoas. Orem pelos reis e por todos os outros que têm autoridade, para que possamos viver uma vida calma e pacífica, com dedicação a Deus e respeito aos outros. Isso é bom, e Deus, o nosso Salvador, gosta disso. Ele quer que todos sejam salvos e venham a conhecer a verdade.",
    },
    {
      text: "Demonstra segurança e disposição para compartilhar sua fé quando surgem oportunidades?",
      verseRef: "1 Pedro 3:15",
      verseText:
        "Tenham no coração de vocês respeito por Cristo e o tratem como Senhor. Estejam sempre prontos para responder a qualquer pessoa que pedir que expliquem a esperança que vocês têm.",
    },
    {
      text: "Seu coração está cheio de paixão por compartilhar as boas novas do evangelho com aqueles que nunca as ouviram?",
      verseRef: "Romanos 1:16",
      verseText:
        "Eu não me envergonho do evangelho, pois ele é o poder de Deus para salvar todos os que creem, primeiro os judeus e também os não judeus.",
    },
    {
      text: "Seu relacionamento com Jesus é percebido naturalmente em suas conversas e atitudes?",
      verseRef: "Mateus 5:16",
      verseText:
        "Assim também a luz de vocês deve brilhar para que os outros vejam as coisas boas que vocês fazem e louvem o Pai de vocês, que está no céu.",
    },
    {
      text: "Está aberto para ir aonde Deus lhe chamar, com a capacidade que Ele lhe der, para compartilhar sua fé?",
      verseRef: "Isaías 6:8",
      verseText:
        "Em seguida, ouvi o Senhor dizer: — Quem é que eu vou enviar? Quem será o nosso mensageiro? Então respondi: — Aqui estou eu. Envia-me a mim!",
    },
  ],
};

export const QUESTIONS: Question[] = PURPOSES.flatMap((p) =>
  RAW[p.id].map((raw, i) => ({
    id: `${p.id}-${i + 1}`,
    purposeId: p.id,
    order: i + 1,
    text: raw.text,
    verseRef: raw.verseRef,
    verseText: raw.verseText,
  })),
);

export const QUESTIONS_BY_PURPOSE: Record<string, Question[]> = PURPOSES.reduce(
  (acc, p) => {
    acc[p.id] = QUESTIONS.filter((q) => q.purposeId === p.id);
    return acc;
  },
  {} as Record<string, Question[]>,
);

export const TOTAL_QUESTIONS = QUESTIONS.length;

// ---------------------------------------------------------------------------
// Evaluation scale (1..5) — single source of truth for the descriptive labels
// used everywhere the ASE scale is shown (Matrix, dashboards, reports, ...).
// ---------------------------------------------------------------------------


export const SCORE_SCALE: { value: ScoreValue; label: string }[] = [
  { value: 1, label: "Não descreve" },
  { value: 2, label: "Pouco descreve" },
  { value: 3, label: "Descreve parcialmente" },
  { value: 4, label: "Descreve bem" },
  { value: 5, label: "Descreve totalmente" },
];

export const SCORE_LABELS: Record<number, string> = Object.fromEntries(
  SCORE_SCALE.map((s) => [s.value, s.label]),
);
