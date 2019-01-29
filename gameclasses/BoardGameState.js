/**
 * A class to store the contents of a particular board configuration
 */
class BoardGameState {
  /**
   * @param {string[]} contents - The array to create the board game state from, default empty
   */
  constructor (width = 3, height = 3) {
    this.contents = typeof width === 'number' ? Array(width * height).fill(' ') : width.slice();
  }

  /**
   * Inserts a symbol into the board at a certain index.
   * @param {number} idx 
   * @param {string} symbol 
   */
  insert(idx, symbol) {
    if (idx > this.contents.length || this.contents[idx] !== ' ') return false; // If the spot is taken or the spot does not exist
    this.contents[idx] = symbol;
    return this;
  }

  /** @returns a duplicate of the current state. */
  clone() {
    return new BoardGameState(this.contents);
  }

  /** @returns the heuristic value of the current state. */
  get score() {
    return this.lines.map(this.evalLine).reduce((prev, curr) => prev + curr);
  }

  /**
   * @param {string[]} line 
   * @returns 100, 10, 1 if 3, 2, 1 O's, -100, -10, -1 if 3, 2, 1, X's
   */
  evalLine(line) {
    let score = 0;
    if (line[0] === 'O') score = 1;
    else if (line[0] === 'X') score = -1;
    
    if (line[1] === 'O') {
      if (line[0] === 'O') score = 10;
      else if (line[0] === 'X') score = 0;
      else score = 1;
    } else if (line[1] === 'X') {
      if (line[0] === 'X') score = -10;
      else if (line[0] === 'O') return 0; // [O, X ] it doesn't matter what the last one is
      else score = -1;
    }

    if (line[2] === 'O') {
      if (score > 0) score *= 10; // If the first and/or second are O
      else if (score < 0) return 0; // If the first and/or second are X
      else score = 1;
    } else if (line[3] === 'X') {
      if (score < 0) score *= 10;
      else if (score > 1) return 0;
      else score = -1;
    }

    return score;
  }

  /** @returns an array of the indices of the empty cells */
  get emptyCells() {
    let empties = [];
    this.contents.forEach((val, idx) => { if (val === ' ') empties.push(idx); });
    return empties;
  }

  /** @returns if the game is over for this current state. */
  get isTerminal() {
    let result = (this.emptyCells.length === 0) ? 'draw' : false; // We set the default value to be a draw if the board is filled, or false otherwise
    this.lines.forEach(line => {
      if (!line.includes(' '))
        if (line[0] === line[1] && line[1] === line[2]) // If all three values in the line are the same
          result = `${line[0]}-won`; // We've got a winner
    });
    
    return result;
  }

  /**
   * We get all the possible ways a row of 3 can be created: horizontally, vertically, and diagonally,
   * and set each index in each line to the corresponding value on the board
   */
  get lines() {
    return ([0, 3, 6].map(i => [i, i+1, i+2])
      .concat([0, 1, 2].map(i => [i, i+3, i+6]))
      .concat([[0, 4, 8], [2, 4, 6]])
      .map(line => line.map(i => this.contents[i])));
  }

  /**
   * @returns a formatted text representation of the board.
   */
  get grid() {
    let result = '';
    let numbers = ['zero', 'one', 'two', 'three'];
    
    for (let row = 0; row < 3; row++) {
      result += `:${numbers[3 - row]}:`;
      for (let col = 0; col < 3; col++)
        result += this.emptyCells.includes(row * 3 + col) ? ':black_large_square:' : (this.contents[row * 3 + col] === 'X' ? ':regional_indicator_x:' : ':regional_indicator_o:');
      result += '\n';
    }

    result += ':black_large_square:';
    for (let col = 'a'.charCodeAt(0); col < 'a'.charCodeAt(0) + 3; col++)
      result += `:regional_indicator_${String.fromCharCode(col)}:`;
    return result;
  }
}

module.exports = BoardGameState;
