/**
 * A class to store the contents of a particular board configuration
 */
class BoardGameState {
  /**
   * @param {string[]} contents - The array to create the board game state from, default empty
   */
  constructor (contents = Array(9).fill(' ')) {
    this.contents = contents.slice();
  }

  /**
   * Inserts a symbol into the board at a certain index.
   * @param {number} idx 
   * @param {string} symbol 
   */
  insert(idx, symbol) {
    if (idx > this.contents.length || this.contents[idx] !== ' ') return false; // If the spot is taken or the spot does not exist
    this.contents[idx] = symbol;
  }

  /** @returns a duplicate of the current state. */
  clone() {
    return new BoardGameState(this.contents);
  }

  /**
   * @returns the heuristic value of the current state, depending on if someone won
   */
  get score() {
    if (this.result === 'X-won')
      return 10;
    if (this.result === 'O-won')
      return -10;
    return 0;
  }

  /**
   * @returns an array of the indices of the empty cells
   */
  get emptyCells() {
    // We map each empty cell to its index, and then remove all of the undefineds
    let empties = [];
    this.contents.forEach((val, idx) => { if (val === ' ') empties.push(idx); });
    return empties;
  }

  /**
   * @returns if the game is over for this current state.
   */
  get isTerminal() {
    // We get all the possible ways a row of 3 can be created: horizontally, vertically, and diagonally
    let lines = [0, 3, 6].map(i => [i, i+1, i+2])
      .concat([0, 1, 2].map(i => [i, i+3, i+6]))
      .concat([[0, 4, 8], [2, 4, 6]])
      .map(line => line.map(i => this.contents[i])); // We set each index in each line to the corresponding value on the board

    let result = (this.emptyCells.length === 0) ? 'draw' : false; // We set the default value to be a draw if the board is filled, or false otherwise
    lines.forEach(line => {
      if (!line.includes(' '))
        if (line[0] === line[1] && line[1] === line[2]) // If all three values in the line are the same
          result = `${line[0]}-won`; // We've got a winner
    });
    
    return result;
  }

  /**
   * @returns a formatted text representation of the board.
   */
  get grid() {
    let result = '';
    let numbers = ['zero', 'one', 'two', 'three'];
    
    for (let row = 0; row < this.height; row++) {
      result += `:${numbers[this.height - row]}:`;
      for (let col = 0; col < this.width; col++)
        result += this.emptyCells().includes(row * this.width + col) ? ':black_large_square:' : (this.contents[row * this.width + col] === 'X' ? ':regional_indicator_x:' : ':regional_indicator_o:');
      result += '\n';
    }

    result += ':black_large_square:';
    for (let col = 'a'.charCodeAt(0); col < 'a'.charCodeAt(0) + 3; col++)
      result += `:regional_indicator_${String.fromCharCode(col)}:`;
    return result;
  }
}

module.exports = BoardGameState;
