// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MicroPayment {
    address public owner;
    mapping(address => uint256) public balances;
    
    // Transaction yapısı
    struct Transaction {
        address from;
        address to;
        uint256 amount;
        uint256 timestamp;
        string description;
        bool isProcessed;
    }
    
    Transaction[] public transactions;
    
    // Olaylar
    event Deposit(address indexed user, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);
    event TransactionCreated(address indexed from, address indexed to, uint256 amount, uint256 transactionId);
    event TransactionProcessed(uint256 indexed transactionId);
    
    constructor() {
        owner = msg.sender;
    }
    
    // Para yatırma fonksiyonu
    function deposit() public payable {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }
    
    // Para çekme fonksiyonu
    function withdraw(uint256 amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
        emit Withdrawal(msg.sender, amount);
    }
    
    // Ödeme oluşturma
    function createTransaction(address to, uint256 amount, string memory description) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        uint256 transactionId = transactions.length;
        transactions.push(Transaction({
            from: msg.sender,
            to: to,
            amount: amount,
            timestamp: block.timestamp,
            description: description,
            isProcessed: false
        }));
        
        emit TransactionCreated(msg.sender, to, amount, transactionId);
    }
    
    // Ödeme işleme
    function processTransaction(uint256 transactionId) public {
        require(transactionId < transactions.length, "Transaction does not exist");
        Transaction storage txn = transactions[transactionId];
        
        require(!txn.isProcessed, "Transaction already processed");
        require(balances[txn.from] >= txn.amount, "Insufficient balance");
        
        balances[txn.from] -= txn.amount;
        balances[txn.to] += txn.amount;
        txn.isProcessed = true;
        
        emit TransactionProcessed(transactionId);
    }
    
    // Tüm işlemleri getir
    function getAllTransactions() public view returns (Transaction[] memory) {
        return transactions;
    }
    
    // Kullanıcı bakiyesini kontrol et
    function getBalance() public view returns (uint256) {
        return balances[msg.sender];
    }
}