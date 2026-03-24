function nanoid() {
  return Math.random().toString(36).slice(2, 10);
}

export const PROPOSAL_TEMPLATES = {
  blank: {
    name: "Blank Canvas",
    description: "Start from scratch",
    icon: "📝",
    slides: [
      {
        id: nanoid(),
        elements: [
          {
            id: nanoid(),
            type: "text",
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            content: "",
            fontSize: 16,
            color: "#ffffff",
            bgColor: "#ffffff"
          }
        ]
      }
    ]
  }
};