const fs = require("fs");
const sets = require("../data/sets.json");
const cards = require("../data/cards.json");

const RARITY = {
  1: "Common",
  2: "Uncommon",
  3: "Rare",
  4: "Legendary",
  5: "Special"
};

const set = process.argv[2];
console.log("PROCESSING ", set);

const csv = [];

sets[set].cards.forEach(card => {
  const cardInfo = cards[card];
  const name = cardInfo.title !== "" ? `${cardInfo.cardName} ${cardInfo.title}` : cardInfo.cardName;
  const aspects = cardInfo.aspects.length? cardInfo.aspects.join(" ") : "Neutral";
  const count = cardInfo.type === "Leader" || cardInfo.type === "Base" ? 1 : 3;

  const data = [set, cardInfo.defaultCardNumber, name.replaceAll(",", " "), RARITY[cardInfo.rarity], cardInfo.type, aspects, count];

  csv.push(data.join(","));
});

try {
    fs.writeFileSync(`${set.toLowerCase()}.csv`, csv.join("\n"));
    console.log("DONE exporting csv");
  } catch (error) {
    console.log("ERROR writing csv");
    console.log(error);
  }
