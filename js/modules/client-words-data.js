import { TRUST_PROFILES } from "./trust-data.js";

const CLIENT_QUOTES = [
  {
    name: "Ayo Sim",
    text: "I went from raw footage to published in three days. Never thought outsourcing could feel this easy.",
  },
  {
    name: "ProducerGrind",
    text: "These guys understand the culture. The pacing on my long-forms is exactly what I would have done myself.",
  },
  {
    name: "TB Digital",
    text: "My channel finally has a consistent look. Every thumbnail feels like it belongs to the same brand.",
  },
];

export const CLIENT_WORDS = CLIENT_QUOTES.map((quote) => {
  const profile = TRUST_PROFILES.find((entry) => entry.name === quote.name);

  if (!profile) {
    return quote;
  }

  return {
    ...profile,
    text: quote.text,
  };
});
