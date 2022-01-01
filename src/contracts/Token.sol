pragma solidity ^0.5.0;

contract Token {
    string public name = 'Art Token';
    string public symbol = 'ART';
    uint256 public decimals = 18;
    uint public totalSupply;
    // Track balances
    mapping(address => uint256) public balanceOf;

    // Send tokens
    

    constructor() public {
        totalSupply = 1000000 * (10 ** decimals);
        balanceOf[msg.sender] = totalSupply;
    }
}