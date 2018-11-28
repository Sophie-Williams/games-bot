module.exports = BoardGameState;

class BoardGameState {
  constructor (width, height, humanPlayerSymbol) {
    this.currentPlayerSymbol = 'X';
    this.humanPlayerSymbol = humanPlayerSymbol;
    this.width = width;
    this.height = height;
    this.contents = Array(width * height).fill(' ');
    this.result = 'running';
    this.aiMovesCount = 0;
  }

  /** @returns a duplicate of the current state. */
  clone() {
    let newState = Object.assign(new BoardGameState(this.width, this.height, this.humanPlayerSymbol), this);
    newState.contents = this.contents.slice();
    return newState;
  }

  /**
   * Gets the heuristic value of the current state, depending on if someone won
   */
  get score() {
    if (this.result === `${this.humanPlayerSymbol}-won`)
      return 10 - this.aiMovesCount;
    if (this.result === `${(this.humanPlayerSymbol === 'O') ? 'X' : 'O'}-won`)
      return -10 + this.aiMovesCount;
    return 0;
  }

  /**
   * @returns an array of the indices of the empty cells
   */
  get emptyCells() {
    // We map each empty cell to its index, and then remove all of the undefineds
    return this.contents.map((val, ind) => (val === ' ') ? ind : undefined).filter(num => typeof num !== 'undefined');
  }

  /**
   * Checks if the game is over for this current state.
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
   * Returns a formatted text representation of the board.
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
