pragma solidity ^0.5.0;

contract Token {
    string public name = 'Art Token';
    string public symbol = 'ART';
    uint256 public decimals = 18;
    uint public totalSupply;

    constructor() public {
        totalSupply = 1000000 * (10 ** decimals);
    }
}