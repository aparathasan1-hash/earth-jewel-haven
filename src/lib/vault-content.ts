export type VaultItemType = "Essay" | "Printable" | "Audio" | "Course";

export type VaultItem = {
  id: string;
  title: string;
  type: VaultItemType;
  tags: string[];
  blurb: string;
  body?: string[];
  printable?: string[];
  audioNote?: string;
  comingSoon?: boolean;
  premium?: boolean; // Gold üyelere özel — kilitli içerik
};

export const vaultItems: VaultItem[] = [
  {
    id: "1",
    title: "When the family you came from is the wound",
    type: "Essay",
    tags: ["narcissistic family", "matrescence"],
    blurb: "On mothering without a mother to lean on.",
    body: [
      "You learned early to read the room before you read yourself. Now there is a baby who cannot read anything at all — only feel you. The old skill still runs: anticipate, appease, shrink.",
      "Matrescence asks something different. It asks you to be large enough for two nervous systems while your own is still finding its edges.",
      "You are not betraying anyone by tending the child inside you first. The wound you came from does not get to name this season.",
    ],
  },
  {
    id: "2",
    title: "Scripts for low-contact holidays",
    type: "Printable",
    tags: ["narcissistic family", "boundaries"],
    blurb: "Printable cards for hard conversations.",
    printable: [
      "I love you. I am not available for a long visit this year.",
      "The baby and I need quiet. We will send photos.",
      "I am not discussing my body, my milk, or my sleep.",
      "If the tone shifts, I will leave the room without explaining.",
      "No, thank you — we have a plan that works for us.",
    ],
  },
  {
    id: "3",
    title: "Rage hum — 11 min",
    type: "Audio",
    tags: ["narcissistic family", "regulation"],
    blurb: "A vocal release for inherited anger.",
    premium: true,
    audioNote:
      "Open the Crisis Room for ambient sounds while you hum low in your chest. Start at a volume only you can hear. Let the sound widen slowly. There is no melody required.",
  },
  {
    id: "4",
    title: "Latch & let-down",
    type: "Essay",
    tags: ["nursing", "early days"],
    blurb: "Small adjustments that change everything.",
    body: [
      "Bring the baby to the breast, not the breast to the baby. Your shoulders drop when you remember this.",
      "Chin first, mouth wide, nose free. If it pinches, break the latch gently with your finger and begin again. Pain is information, not failure.",
      "Let-down can feel like grief — a sudden wave in the chest. Breathe through it. The milk and the tears often arrive together.",
    ],
  },
  {
    id: "5",
    title: "First bath, slow",
    type: "Printable",
    tags: ["ritual", "nursery"],
    blurb: "A printable sequence for unhurried bathing.",
    printable: [
      "1. Warm the room before you warm the water.",
      "2. Lay the cloth. Speak one sentence only: we are bathing now.",
      "3. Eyes, then face, then folds, then feet.",
      "4. Wrap immediately. Skin to skin if they protest.",
      "5. The bath is finished when calm returns — not when every drop is gone.",
    ],
  },
  {
    id: "6",
    title: "Rain for a long night",
    type: "Audio",
    tags: ["sleep", "calm"],
    blurb: "60 minutes of even, steady rain.",
    audioNote:
      "In the Crisis Room, choose Soft rain. Let it loop. Lower your phone brightness. You do not have to stay awake for all of it.",
  },
  {
    id: "7",
    title: "Matrescence (course)",
    type: "Course",
    tags: ["identity"],
    blurb: "Coming soon — a 6-week slow course.",
    comingSoon: true,
    premium: true,
    body: [
      "Six weeks of letters, one room at a time. Identity, rage, tenderness, boundaries, body, return.",
      "This course is still being written at the pace of a tired mother. Leave a bookmark here — it will open when it is ready.",
    ],
  },
  {
    id: "8",
    title: "The body keeps the postpartum",
    type: "Essay",
    tags: ["recovery", "somatic"],
    blurb: "Notes on healing in tissue.",
    premium: true,
    body: [
      "Healing is not a checklist on a pamphlet. Your pelvis remembers the opening. Your shoulders remember the vigil.",
      "Some days progress is measured in a deeper exhale, not in miles walked.",
      "Soft food, warm water, horizontal hours. The body does not need your hurry. It needs your permission to take its time.",
    ],
  },
  {
    id: "9",
    title: "A letter to your nervous system",
    type: "Printable",
    tags: ["regulation"],
    blurb: "Tape it to the fridge.",
    printable: [
      "Dear nervous system,",
      "You are not in the hospital anymore. The monitors are gone. The beeping stopped.",
      "The baby is small but alive. I am tired but here.",
      "We can go slowly now. We can exhale longer than we inhale.",
      "You are allowed to stand down.",
    ],
  },
  {
    id: "10",
    title: "The fourth trimester body",
    type: "Essay",
    tags: ["recovery", "body image"],
    blurb: "On the slow return to yourself.",
    body: [
      "Your body is not a before-and-after. It is a landscape that has been through weather.",
      "The linea nigra will fade. The softness may stay. The stretch marks are not mistakes — they are the map of where you expanded to meet someone.",
      "You do not owe anyone a smaller version of yourself. You owe yourself the patience to heal without performance.",
    ],
  },
  {
    id: "11",
    title: "Five-minute grounding",
    type: "Audio",
    tags: ["regulation", "crisis"],
    blurb: "A short, guided voice for when you need to land.",
    premium: true,
    audioNote:
      "Sit somewhere you can feel the surface beneath you. Press your feet into the floor. Listen to the ambient sound of your choice in the Crisis Room. Breathe in for four counts, out for six. Repeat until the room feels less loud.",
  },
  {
    id: "12",
    title: "What to pack for the hospital (a soft list)",
    type: "Printable",
    tags: ["birth", "preparation"],
    blurb: "Not a checklist — a comfort list.",
    printable: [
      "Your own pillow, in a bright case so you can find it in the dark.",
      "A long charger. The outlets are always too far.",
      "Lip balm. The air is dry and you will forget to ask.",
      "One thing that smells like home. A candle you won't light. A shirt from their drawer.",
      "A sentence written down: I am allowed to ask for help.",
    ],
  },
  {
    id: "13",
    title: "On being seen",
    type: "Essay",
    tags: ["identity", "matrescence"],
    blurb: "A reflection on visibility after birth.",
    body: [
      "Before the baby, you were seen in ways you may not have noticed. Your body was read as yours. Your time was read as yours.",
      "Now strangers touch your belly. Family members critique your parenting before it has fully begun. You are suddenly public property in a way no one warned you about.",
      "You are allowed to reclaim your visibility. You are allowed to be seen on your own terms. The woman behind the mother is still there, waiting to be recognised.",
    ],
  },
  {
    id: "14",
    title: "The art of doing nothing",
    type: "Essay",
    tags: ["rest", "permission"],
    blurb: "Why lying down is not laziness.",
    body: [
      "There is a reason your body wants to lie down. It is not weakness. It is wisdom.",
      "In many cultures, the postpartum period is called 'lying in' — a prescribed season of rest. We have lost this. We have replaced it with bouncing back.",
      "Doing nothing is not empty. It is full of repair. The cells are knitting. The hormones are settling. The nervous system is learning that it is safe again.",
      "Lie down without guilt. The dishes will wait. The baby will wake. You will rise when you are ready.",
    ],
  },
  {
    id: "15",
    title: "A permission slip for the hard days",
    type: "Printable",
    tags: ["permission", "crisis"],
    blurb: "Print this. Keep it in your pocket.",
    printable: [
      "Today I give myself permission to:",
      "— cry without fixing it",
      "— feed my body without judgement",
      "— say no to one thing that drains me",
      "— ask for help, even if I don't know what I need",
      "— exist without explaining myself",
      "— put the baby down in a safe place and walk away for five minutes",
      "— lower the bar and still call it enough",
    ],
  },
];
