// SPDX-License-Identifier: MIT
pragma solidity ^0.5.1;

/**
 * @title VeriChain
 * @dev Document verification system with exporter management
 * @author VeriChain Team
 */
contract VeriChain {

    // State variables
    address public owner;
    uint16 public count_Exporters = 0;
    uint16 public count_hashes = 0;

    // Structs
    struct Record {
        uint blockNumber; 
        uint minetime; 
        string info;
        string ipfs_hash;
    }

    struct Exporter_Record {
        uint blockNumber;
        string info;
    }

    // Mappings
    mapping(bytes32 => Record) private docHashes;
    mapping(address => Exporter_Record) private Exporters;

    // Events
    event AddHash(address indexed _exporter, string _ipfsHash);
    event ExporterAdded(address indexed _exporter, string _info);
    event ExporterRemoved(address indexed _exporter);
    event ExporterModified(address indexed _exporter, string _newInfo);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    modifier validAddress(address _addr) {
        require(_addr != address(0), "Invalid address");
        _;
    }

    modifier authorised_Exporter(bytes32 _doc) {
        require(
            keccak256(abi.encodePacked(Exporters[msg.sender].info)) ==
            keccak256(abi.encodePacked(docHashes[_doc].info)),
            "Caller is not authorised to edit this document"
        );
        _;
    }

    modifier canAddHash() {
        require(Exporters[msg.sender].blockNumber != 0, "Caller not authorised to add documents");
        _;
    }

    /**
     * @dev Constructor sets the original owner of the contract to the sender account
     */
    constructor() public {
        owner = msg.sender;
    }

    // -------------------- Exporter Management -------------------- //

    /**
     * @dev Add a new exporter (only owner)
     * @param _add Address of the exporter to add
     * @param _info Information about the exporter
     */
    function add_Exporter(address _add, string memory _info) public onlyOwner validAddress(_add) {
        require(Exporters[_add].blockNumber == 0, "Exporter already exists");
        require(bytes(_info).length > 0, "Exporter info cannot be empty");

        Exporters[_add].blockNumber = block.number;
        Exporters[_add].info = _info;
        count_Exporters++;

        emit ExporterAdded(_add, _info);
    }

    /**
     * @dev Delete an exporter (only owner)
     * @param _add Address of the exporter to delete
     */
    function delete_Exporter(address _add) public onlyOwner validAddress(_add) {
        require(Exporters[_add].blockNumber != 0, "Exporter does not exist");

        Exporters[_add].blockNumber = 0;
        Exporters[_add].info = "";
        count_Exporters--;

        emit ExporterRemoved(_add);
    }

    /**
     * @dev Modify exporter information (only owner)
     * @param _add Address of the exporter to modify
     * @param _newInfo New information for the exporter
     */
    function alter_Exporter(address _add, string memory _newInfo) public onlyOwner validAddress(_add) {
        require(Exporters[_add].blockNumber != 0, "Exporter does not exist");
        require(bytes(_newInfo).length > 0, "Exporter info cannot be empty");

        Exporters[_add].info = _newInfo;

        emit ExporterModified(_add, _newInfo);
    }

    /**
     * @dev Transfer ownership of the contract (only owner)
     * @param _newOwner Address of the new owner
     */
    function changeOwner(address _newOwner) public onlyOwner validAddress(_newOwner) {
        require(_newOwner != owner, "New owner must be different from current owner");

        address previousOwner = owner;
        owner = _newOwner;

        emit OwnershipTransferred(previousOwner, _newOwner);
    }

    // -------------------- Document Management -------------------- //

    /**
     * @dev Add a document hash (only authorized exporters)
     * @param _hash Document hash to add
     * @param _ipfs IPFS hash of the document
     */
    function addDocHash(bytes32 _hash, string memory _ipfs) public canAddHash {
        require(_hash != bytes32(0), "Hash cannot be empty");
        require(bytes(_ipfs).length > 0, "IPFS hash cannot be empty");
        require(docHashes[_hash].blockNumber == 0 && docHashes[_hash].minetime == 0, "Hash already exists");

        Record memory newRecord = Record(
            block.number,
            now, // Using 'now' for Solidity 0.5.1 compatibility
            Exporters[msg.sender].info,
            _ipfs
        );
        docHashes[_hash] = newRecord;
        count_hashes++;

        emit AddHash(msg.sender, _ipfs);
    }

    /**
     * @dev Find a document by hash
     * @param _hash Document hash to find
     * @return blockNumber Block number when document was added
     * @return minetime Timestamp when document was added
     * @return info Exporter information
     * @return ipfs_hash IPFS hash of the document
     */
    function findDocHash(bytes32 _hash) public view returns (uint, uint, string memory, string memory) {
        Record memory r = docHashes[_hash];
        return (r.blockNumber, r.minetime, r.info, r.ipfs_hash);
    }

    /**
     * @dev Delete a document hash (only authorized exporter who added it)
     * @param _hash Document hash to delete
     */
    function deleteHash(bytes32 _hash) public authorised_Exporter(_hash) canAddHash {
        require(docHashes[_hash].minetime != 0, "Document does not exist");
        require(_hash != bytes32(0), "Hash cannot be empty");

        docHashes[_hash].blockNumber = 0;
        docHashes[_hash].minetime = 0;
        docHashes[_hash].info = "";
        docHashes[_hash].ipfs_hash = "";
        count_hashes--;
    }

    /**
     * @dev Get exporter information
     * @param _add Address of the exporter
     * @return info Information about the exporter
     */
    function getExporterInfo(address _add) public view returns (string memory) {
        return Exporters[_add].info;
    }

    /**
     * @dev Check if an address is an authorized exporter
     * @param _add Address to check
     * @return true if address is an authorized exporter
     */
    function isExporter(address _add) public view returns (bool) {
        return Exporters[_add].blockNumber != 0;
    }

    /**
     * @dev Get contract statistics
     * @return exporterCount Number of exporters
     * @return hashCount Number of document hashes
     */
    function getStats() public view returns (uint16, uint16) {
        return (count_Exporters, count_hashes);
    }

    /**
     * @dev Check if a document hash exists
     * @param _hash Document hash to check
     * @return true if document exists
     */
    function documentExists(bytes32 _hash) public view returns (bool) {
        return docHashes[_hash].minetime != 0;
    }
}