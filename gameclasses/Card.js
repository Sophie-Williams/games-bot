module.exports = Card;

const suits = {
  Spades: /s[pades]?/i,
  Hearts: /h[earts]?/i,
  Diamonds: /d[iamonds]?/i,
  Clubs: /c[lubs]?/i
};

function Card(value, suit) {
  // We exit if the value is not a number or a face card
  if (!parseInt(value) && !['A', 'K', 'Q', 'J'].includes(value)) return false;

  this.value = value;
  this.suit = suit;
  suits.getOwnPropertyNames.forEach(suitName => {
    if (suits[suitName].test(suit)) this.suit = suitName;
  });

  this.shortDescription = this.value + this.suit.charAt(0);
    
  this.imageURL = 'res/cards/' + this.shortDescription + '.jpg';
    
  this.description = 'The ' + this.value + ' of ' + this.suit;
}

Card.prototype.show = function (client, message) {
  message.channel.send(this.description(), {file: this.imageURL});
};

// function createDeck() {
// 	let suitNames = Object.getOwnPropertyNames(suits);
// 	let deck = [];
    
// 	for (let i = 0; i < suitNames.length; i++) {
// 		for (let val = 2; val < 11; val++) {
// 			deck.push(createCard(val, suitNames[i]));
// 		}
// 		for (let face = 0; face < faceCards.length; face++) {
// 			deck.push(createCard(faceCards[face], suitNames[i]));
// 		}
// 	}
    
// 	return deck;
// }
