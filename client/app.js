// VeriChain Document Verification System - JSON Auto-Loader
class VeriChainDocumentVerifier {
    constructor() {
        this.web3 = null;
        this.contract = null;
        this.contractData = null;
        this.accounts = [];
        this.currentUserRole = 'unknown';
        this.contractAddress = null;
        this.contractABI = null;
        this.currentFile = null;
        this.currentHash = null;

        this.init();
    }

    async init() {
        console.log('🚀 Initializing VeriChain Document Verification System...');
        this.attachEventListeners();
        this.setupDragAndDrop();
        await this.loadContractFromJSON();
        await this.checkConnection();
    }

    async loadContractFromJSON() {
        try {
            console.log('📄 Loading VeriChain contract data from VeriChain.json...');

            // Update status
            this.updateLoadingStatus('Loading VeriChain.json...', 'info');

            // Load the JSON file
            const response = await fetch('./VeriChain.json');
            if (!response.ok) {
                throw new Error(`Failed to load VeriChain.json: ${response.status} ${response.statusText}`);
            }

            this.contractData = await response.json();
            console.log('✅ VeriChain contract data loaded:', this.contractData);

            // Extract ABI
            this.contractABI = this.contractData.abi;

            // Extract contract address from networks
            const networkId = "5777"; // Ganache network
            if (this.contractData.networks && this.contractData.networks[networkId]) {
                this.contractAddress = this.contractData.networks[networkId].address;
                console.log('🎯 Contract address found:', this.contractAddress);
            } else {
                throw new Error(`Contract address not found for network ${networkId} in VeriChain.json`);
            }

            // Update UI with contract information
            this.updateContractInfo();

            this.updateLoadingStatus('VeriChain.json loaded successfully!', 'success');

        } catch (error) {
            console.error('❌ Error loading VeriChain contract JSON:', error);
            this.updateLoadingStatus(`Error: ${error.message}`, 'danger');
            this.showErrorModal('VeriChain Contract Loading Error', error.message);
        }
    }

    updateContractInfo() {
        if (!this.contractData) return;

        // Update contract name
        const contractName = this.contractData.contractName || 'VeriChain';
        document.title = `${contractName} - Document Verification System`;

        // Extract compiler version from metadata
        try {
            const metadata = JSON.parse(this.contractData.metadata);
            const compilerVersion = metadata.compiler?.version || 'Unknown';
            console.log('🔧 Compiler version:', compilerVersion);
        } catch (e) {
            console.log('⚠️ Could not parse metadata for compiler version');
        }

        // Update contract address display (will be shown when connected)
        if (this.contractAddress) {
            document.getElementById('contractAddress').textContent = this.formatAddress(this.contractAddress);
        }

        console.log('✅ Contract info updated from JSON');
    }

    updateLoadingStatus(message, type) {
        // Create a status message at the top of the page
        const existingStatus = document.getElementById('jsonLoadStatus');
        if (existingStatus) {
            existingStatus.remove();
        }

        const statusDiv = document.createElement('div');
        statusDiv.id = 'jsonLoadStatus';
        statusDiv.className = `alert alert-${type} alert-dismissible fade show`;
        statusDiv.innerHTML = `
            <strong>Contract Loading:</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        // Insert at the top of the container
        const container = document.querySelector('.container');
        container.insertBefore(statusDiv, container.firstChild);

        // Auto-remove success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                if (statusDiv.parentNode) {
                    statusDiv.remove();
                }
            }, 3000);
        }
    }

    showErrorModal(title, message) {
        // Create error modal dynamically if it doesn't exist
        let errorModal = document.getElementById('contractErrorModal');
        if (!errorModal) {
            errorModal = document.createElement('div');
            errorModal.className = 'modal fade';
            errorModal.id = 'contractErrorModal';
            errorModal.innerHTML = `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-danger text-white">
                            <h5 class="modal-title"><i class="fas fa-exclamation-triangle"></i> ${title}</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div id="contractErrorContent">${message}</div>
                            <div class="mt-3">
                                <strong>Possible solutions:</strong>
                                <ul>
                                    <li>Ensure VeriChain.json file is in the same directory as index.html</li>
                                    <li>Check that the JSON file is valid and properly formatted</li>
                                    <li>Verify the contract is deployed to network 5777 (Ganache)</li>
                                    <li>Use a proper web server (npm start, not file://)</li>
                                </ul>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" id="retryLoadVeriChain" class="btn btn-danger">Retry Loading</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(errorModal);

            // Add retry functionality
            document.getElementById('retryLoadVeriChain').addEventListener('click', () => {
                bootstrap.Modal.getInstance(errorModal).hide();
                this.loadContractFromJSON();
            });
        } else {
            document.getElementById('contractErrorContent').textContent = message;
        }

        const modal = new bootstrap.Modal(errorModal);
        modal.show();
    }

    attachEventListeners() {
        // Wallet connection
        document.getElementById('connectWallet').addEventListener('click', () => this.connectWallet());

        // File upload events
        document.getElementById('browseFile').addEventListener('click', () => {
            document.getElementById('documentFile').click();
        });
        document.getElementById('documentFile').addEventListener('change', (e) => this.handleFileSelect(e));

        // Hash generation
        document.getElementById('generateHash').addEventListener('click', () => this.generateDocumentHash());
        document.getElementById('copyHash').addEventListener('click', () => this.copyHashToClipboard());

        // Blockchain storage
        document.getElementById('storeOnBlockchain').addEventListener('click', () => this.storeHashOnBlockchain());

        // Verification events
        document.getElementById('browseVerifyFile').addEventListener('click', () => {
            document.getElementById('verifyFile').click();
        });
        document.getElementById('verifyFile').addEventListener('change', (e) => this.handleVerifyFileSelect(e));
        document.getElementById('verifyByHashBtn').addEventListener('click', () => this.verifyByHash());

        // Verification method toggle
        document.querySelectorAll('input[name="verifyMethod"]').forEach(radio => {
            radio.addEventListener('change', () => this.toggleVerificationMethod());
        });

        // Management functions
        document.getElementById('addExporter').addEventListener('click', () => this.addExporter());
        document.getElementById('alterExporter').addEventListener('click', () => this.alterExporter());
        document.getElementById('deleteExporter').addEventListener('click', () => this.deleteExporter());
        document.getElementById('changeOwner').addEventListener('click', () => this.changeOwner());
        document.getElementById('addManualDocHash').addEventListener('click', () => this.addManualDocHash());
        document.getElementById('deleteDocumentHash').addEventListener('click', () => this.deleteDocumentHash());

        // Query functions
        document.getElementById('findDocHash').addEventListener('click', () => this.findDocumentHash());
        document.getElementById('checkExporter').addEventListener('click', () => this.checkExporterStatus());
        document.getElementById('checkDocumentExists').addEventListener('click', () => this.checkDocumentExists());

        // Quick stats functions
        document.getElementById('getStatsBtn').addEventListener('click', () => this.getContractStats());
        document.getElementById('getOwnerBtn').addEventListener('click', () => this.getContractOwner());
        document.getElementById('countExportersBtn').addEventListener('click', () => this.countExporters());
        document.getElementById('countHashesBtn').addEventListener('click', () => this.countHashes());

        // Statistics refresh
        document.getElementById('refreshStats').addEventListener('click', () => this.loadContractStats());

        // Log management
        document.getElementById('clearLog').addEventListener('click', () => this.clearTransactionLog());
        document.getElementById('exportLog').addEventListener('click', () => this.exportTransactionLog());
    }

    setupDragAndDrop() {
        // Upload area drag and drop
        const uploadArea = document.getElementById('fileUploadArea');
        const verifyArea = document.getElementById('verifyUploadArea');

        [uploadArea, verifyArea].forEach(area => {
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                area.addEventListener(eventName, this.preventDefaults, false);
            });

            ['dragenter', 'dragover'].forEach(eventName => {
                area.addEventListener(eventName, () => area.classList.add('drag-over'), false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                area.addEventListener(eventName, () => area.classList.remove('drag-over'), false);
            });
        });

        uploadArea.addEventListener('drop', (e) => this.handleDrop(e, 'upload'), false);
        uploadArea.addEventListener('click', () => document.getElementById('documentFile').click());

        verifyArea.addEventListener('drop', (e) => this.handleDrop(e, 'verify'), false);
        verifyArea.addEventListener('click', () => document.getElementById('verifyFile').click());
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    handleDrop(e, type) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            if (type === 'upload') {
                this.handleFile(files[0], 'upload');
            } else if (type === 'verify') {
                this.handleFile(files[0], 'verify');
            }
        }
    }

    async checkConnection() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0 && this.contractAddress && this.contractABI) {
                    await this.setConnected(accounts[0]);
                }
            } catch (error) {
                console.error('Error checking connection:', error);
            }
        }
    }

    async connectWallet() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                if (!this.contractAddress || !this.contractABI) {
                    this.showError('Contract not loaded. Please ensure VeriChain.json is loaded first.');
                    return;
                }

                this.showLoading('Connecting to MetaMask...', 'Please approve the connection request');

                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                await this.setConnected(accounts[0]);

                this.hideLoading();
                this.showSuccess('Wallet Connected', 'MetaMask wallet connected successfully!');
            } catch (error) {
                this.hideLoading();
                console.error('Error connecting wallet:', error);
                this.showError('Connection failed: ' + error.message);
            }
        } else {
            this.showError('MetaMask not found. Please install MetaMask browser extension.');
        }
    }

    async setConnected(account) {
        this.web3 = new Web3(window.ethereum);
        this.accounts = [account];

        // Initialize contract with data from JSON
        try {
            this.contract = new this.web3.eth.Contract(this.contractABI, this.contractAddress);
            console.log('✅ Contract initialized from VeriChain.json:', this.contractAddress);
        } catch (error) {
            console.error('Error initializing contract:', error);
            this.showError('Failed to initialize contract: ' + error.message);
            return;
        }

        // Update UI
        document.getElementById('statusText').textContent = 'Connected';
        document.getElementById('connectionStatus').className = 'alert alert-success';
        document.getElementById('currentAccount').textContent = this.formatAddress(account);
        document.getElementById('contractAddress').textContent = this.formatAddress(this.contractAddress);
        document.getElementById('accountInfo').classList.remove('d-none');
        document.getElementById('connectWallet').innerHTML = '<i class="fas fa-check"></i> Connected';
        document.getElementById('connectWallet').className = 'btn btn-success';

        // Load contract data
        await this.loadContractData();
    }

    async loadContractData() {
        try {
            // Get contract owner
            const owner = await this.contract.methods.owner().call();
            document.getElementById('contractOwner').textContent = this.formatAddress(owner);
            document.getElementById('ownerAddress').textContent = this.formatAddress(owner);

            // Determine user role
            const isOwner = owner.toLowerCase() === this.accounts[0].toLowerCase();
            const isExporter = await this.contract.methods.isExporter(this.accounts[0]).call();

            if (isOwner) {
                this.currentUserRole = 'owner';
                document.getElementById('userRole').textContent = 'Owner';
                document.getElementById('userRole').className = 'badge bg-danger';
            } else if (isExporter) {
                this.currentUserRole = 'exporter';
                document.getElementById('userRole').textContent = 'Exporter';
                document.getElementById('userRole').className = 'badge bg-success';
            } else {
                this.currentUserRole = 'user';
                document.getElementById('userRole').textContent = 'User';
                document.getElementById('userRole').className = 'badge bg-secondary';
            }

            // Load statistics
            await this.loadContractStats();

            this.logTransaction('info', 'System', 'Connected to VeriChain contract', null);

        } catch (error) {
            console.error('Error loading contract data:', error);
            this.showError('Failed to load contract data: ' + error.message);
        }
    }

    async loadContractStats() {
        try {
            const stats = await this.contract.methods.getStats().call();
            document.getElementById('exporterCount').textContent = stats[0];
            document.getElementById('hashCount').textContent = stats[1];
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    // File handling functions
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.handleFile(file, 'upload');
        }
    }

    handleVerifyFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.handleFile(file, 'verify');
        }
    }

    handleFile(file, type) {
        if (!file) return;

        // Validate file type
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
        if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.pdf')) {
            this.showError('Please select a PDF, DOC, DOCX, or TXT file');
            return;
        }

        if (type === 'upload') {
            this.currentFile = file;
            this.displayFileInfo(file);
            this.updateProgressStep(1, 'completed');
            this.updateProgressStep(2, 'active');
        } else if (type === 'verify') {
            this.verifyUploadedFile(file);
        }
    }

    displayFileInfo(file) {
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSize').textContent = this.formatFileSize(file.size);
        document.getElementById('fileType').textContent = file.type || 'Unknown';
        document.getElementById('fileModified').textContent = new Date(file.lastModified).toLocaleString();

        document.getElementById('fileInfo').classList.remove('d-none');
        document.getElementById('hashSection').classList.remove('d-none');
    }

    async generateDocumentHash() {
        if (!this.currentFile) {
            this.showError('Please select a file first');
            return;
        }

        try {
            this.showLoading('Generating Hash', 'Computing SHA-256 hash of the document...');

            const arrayBuffer = await this.readFileAsArrayBuffer(this.currentFile);
            const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            this.currentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            document.getElementById('documentHashDisplay').textContent = this.currentHash;
            document.getElementById('hashResult').classList.remove('d-none');
            document.getElementById('storeSection').classList.remove('d-none');

            this.updateProgressStep(2, 'completed');
            this.updateProgressStep(3, 'active');

            this.hideLoading();
            this.showSuccess('Hash Generated', 'SHA-256 hash calculated successfully!');

        } catch (error) {
            this.hideLoading();
            console.error('Error generating hash:', error);
            this.showError('Failed to generate hash: ' + error.message);
        }
    }

    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file);
        });
    }

    copyHashToClipboard() {
        if (this.currentHash) {
            navigator.clipboard.writeText(this.currentHash).then(() => {
                this.showSuccess('Hash Copied', 'Document hash copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy hash:', err);
                this.showError('Failed to copy hash to clipboard');
            });
        }
    }

    async storeHashOnBlockchain() {
        if (!this.currentHash) {
            this.showError('Please generate document hash first');
            return;
        }

        if (!this.contract) {
            this.showError('Please connect your wallet first');
            return;
        }

        try {
            this.showLoading('Storing on Blockchain', 'Submitting transaction to store document hash...');

            const ipfsHash = document.getElementById('ipfsHash').value || 'Document hash only';
            const hashBytes32 = '0x' + this.currentHash;

            const gasEstimate = await this.contract.methods.addDocHash(hashBytes32, ipfsHash).estimateGas({
                from: this.accounts[0]
            });

            const transaction = await this.contract.methods.addDocHash(hashBytes32, ipfsHash).send({
                from: this.accounts[0],
                gas: Math.floor(gasEstimate * 1.2)
            });

            this.updateProgressStep(3, 'completed');
            this.updateProgressStep(4, 'completed');

            this.hideLoading();
            this.showSuccessModal('Document Stored Successfully', `
                <div class="text-center">
                    <i class="fas fa-check-circle fa-3x text-success mb-3"></i>
                    <h5>Document Hash Stored on Blockchain!</h5>
                    <p><strong>Document:</strong> ${this.currentFile.name}</p>
                    <p><strong>Hash:</strong> <span class="font-monospace">${this.currentHash}</span></p>
                    <p><strong>Transaction:</strong> <span class="font-monospace">${transaction.transactionHash}</span></p>
                    <p><strong>Contract:</strong> <span class="font-monospace">${this.contractAddress}</span></p>
                </div>
            `);

            this.logTransaction('success', 'Document Storage', `Stored: ${this.currentFile.name}`, transaction.transactionHash);

            // Reset form
            setTimeout(() => {
                this.resetUploadForm();
            }, 2000);

        } catch (error) {
            this.hideLoading();
            console.error('Error storing hash:', error);
            this.showError('Failed to store on blockchain: ' + error.message);
            this.logTransaction('error', 'Document Storage', `Failed: ${error.message}`, null);
        }
    }

    // Verification functions
    toggleVerificationMethod() {
        const byFile = document.getElementById('verifyByFile').checked;

        if (byFile) {
            document.getElementById('verifyByFileSection').classList.remove('d-none');
            document.getElementById('verifyByHashSection').classList.add('d-none');
        } else {
            document.getElementById('verifyByFileSection').classList.add('d-none');
            document.getElementById('verifyByHashSection').classList.remove('d-none');
        }
    }

    async verifyUploadedFile(file) {
        try {
            this.showVerificationResult('pending', 'Verifying...', 'Computing hash and checking blockchain...');

            const arrayBuffer = await this.readFileAsArrayBuffer(file);
            const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            await this.verifyHashOnBlockchain(hash, file.name);

        } catch (error) {
            console.error('Error verifying file:', error);
            this.showVerificationResult('failure', 'Verification Error', error.message);
        }
    }

    async verifyByHash() {
        const hash = document.getElementById('verifyHashInput').value.trim();

        if (!hash) {
            this.showError('Please enter a document hash');
            return;
        }

        if (hash.length !== 64) {
            this.showError('Hash must be exactly 64 characters long');
            return;
        }

        await this.verifyHashOnBlockchain(hash, 'Manual hash input');
    }

    async verifyHashOnBlockchain(hash, source) {
        if (!this.contract) {
            this.showError('Please connect your wallet first');
            return;
        }

        try {
            const hashBytes32 = '0x' + hash;
            const exists = await this.contract.methods.documentExists(hashBytes32).call();

            if (exists) {
                const docInfo = await this.contract.methods.findDocHash(hashBytes32).call();
                const blockNumber = docInfo[0];
                const timestamp = docInfo[1];
                const exporterInfo = docInfo[2];
                const ipfsHash = docInfo[3];

                this.showVerificationResult('success', 'Document Verified ✓', `
                    <div class="verification-details">
                        <p><strong>Status:</strong> <span class="badge bg-success">AUTHENTIC</span></p>
                        <p><strong>Source:</strong> ${source}</p>
                        <p><strong>Hash:</strong> <span class="font-monospace">${hash}</span></p>
                        <p><strong>Stored by:</strong> ${exporterInfo}</p>
                        <p><strong>Block Number:</strong> ${blockNumber}</p>
                        <p><strong>Timestamp:</strong> ${new Date(timestamp * 1000).toLocaleString()}</p>
                        <p><strong>IPFS:</strong> ${ipfsHash}</p>
                        <p><strong>Contract:</strong> <span class="font-monospace">${this.contractAddress}</span></p>
                    </div>
                `);

                this.logTransaction('success', 'Document Verification', `Verified: ${source}`, null);

            } else {
                this.showVerificationResult('failure', 'Document Not Found ✗', `
                    <div class="verification-details">
                        <p><strong>Status:</strong> <span class="badge bg-danger">NOT FOUND</span></p>
                        <p><strong>Source:</strong> ${source}</p>
                        <p><strong>Hash:</strong> <span class="font-monospace">${hash}</span></p>
                        <p>This document hash does not exist in the blockchain.</p>
                        <p>The document may not be authentic or has not been stored in this system.</p>
                        <p><strong>Contract:</strong> <span class="font-monospace">${this.contractAddress}</span></p>
                    </div>
                `);

                this.logTransaction('warning', 'Document Verification', `Not found: ${source}`, null);
            }

        } catch (error) {
            console.error('Error verifying hash:', error);
            this.showVerificationResult('failure', 'Verification Error', error.message);
            this.logTransaction('error', 'Document Verification', `Error: ${error.message}`, null);
        }
    }

    showVerificationResult(type, title, content) {
        const resultDiv = document.getElementById('verificationResult');
        let className = 'verification-pending';
        let icon = 'fas fa-clock';

        if (type === 'success') {
            className = 'verification-success';
            icon = 'fas fa-check-circle';
        } else if (type === 'failure') {
            className = 'verification-failure';  
            icon = 'fas fa-times-circle';
        }

        resultDiv.innerHTML = `
            <div class="${className}">
                <div class="text-center mb-3">
                    <i class="${icon} fa-3x mb-2"></i>
                    <h6>${title}</h6>
                </div>
                ${content}
            </div>
        `;
    }

    // Contract management functions (add_Exporter, delete_Exporter, etc. - keeping the same)
    async addExporter() {
        const address = document.getElementById('newExporterAddress').value.trim();
        const info = document.getElementById('newExporterInfo').value.trim();

        if (!address || !info) {
            this.showError('Please fill in all fields');
            return;
        }

        if (this.currentUserRole !== 'owner') {
            this.showError('Only contract owner can add exporters');
            return;
        }

        try {
            this.showLoading('Adding Exporter', 'Submitting transaction...');

            const gasEstimate = await this.contract.methods.add_Exporter(address, info).estimateGas({
                from: this.accounts[0]
            });

            const transaction = await this.contract.methods.add_Exporter(address, info).send({
                from: this.accounts[0],
                gas: Math.floor(gasEstimate * 1.2)
            });

            this.hideLoading();
            this.showSuccess('Exporter Added', `Successfully added exporter: ${info}`);
            this.logTransaction('success', 'Add Exporter', `Added: ${info} (${this.formatAddress(address)})`, transaction.transactionHash);

            // Clear form
            document.getElementById('newExporterAddress').value = '';
            document.getElementById('newExporterInfo').value = '';

            // Refresh stats
            await this.loadContractStats();

        } catch (error) {
            this.hideLoading();
            console.error('Error adding exporter:', error);
            this.showError('Failed to add exporter: ' + error.message);
            this.logTransaction('error', 'Add Exporter', `Failed: ${error.message}`, null);
        }
    }

    // [Continue with remaining contract management functions - same as before]
    async alterExporter() {
        const address = document.getElementById('modifyExporterAddress').value.trim();
        const info = document.getElementById('modifyExporterInfo').value.trim();

        if (!address || !info) {
            this.showError('Please fill in all fields');
            return;
        }

        if (this.currentUserRole !== 'owner') {
            this.showError('Only contract owner can modify exporters');
            return;
        }

        try {
            this.showLoading('Modifying Exporter', 'Submitting transaction...');

            const transaction = await this.contract.methods.alter_Exporter(address, info).send({
                from: this.accounts[0]
            });

            this.hideLoading();
            this.showSuccess('Exporter Modified', `Successfully updated exporter information`);
            this.logTransaction('success', 'Modify Exporter', `Modified: ${this.formatAddress(address)}`, transaction.transactionHash);

            // Clear form
            document.getElementById('modifyExporterAddress').value = '';
            document.getElementById('modifyExporterInfo').value = '';

        } catch (error) {
            this.hideLoading();
            console.error('Error modifying exporter:', error);
            this.showError('Failed to modify exporter: ' + error.message);
        }
    }

    async deleteExporter() {
        const address = document.getElementById('deleteExporterAddress').value.trim();

        if (!address) {
            this.showError('Please enter exporter address');
            return;
        }

        if (this.currentUserRole !== 'owner') {
            this.showError('Only contract owner can delete exporters');
            return;
        }

        if (!confirm('Are you sure you want to remove this exporter?')) {
            return;
        }

        try {
            this.showLoading('Removing Exporter', 'Submitting transaction...');

            const transaction = await this.contract.methods.delete_Exporter(address).send({
                from: this.accounts[0]
            });

            this.hideLoading();
            this.showSuccess('Exporter Removed', `Successfully removed exporter`);
            this.logTransaction('success', 'Remove Exporter', `Removed: ${this.formatAddress(address)}`, transaction.transactionHash);

            // Clear form
            document.getElementById('deleteExporterAddress').value = '';

            // Refresh stats
            await this.loadContractStats();

        } catch (error) {
            this.hideLoading();
            console.error('Error deleting exporter:', error);
            this.showError('Failed to remove exporter: ' + error.message);
        }
    }

    async changeOwner() {
        const newOwner = document.getElementById('newOwnerAddress').value.trim();

        if (!newOwner) {
            this.showError('Please enter new owner address');
            return;
        }

        if (this.currentUserRole !== 'owner') {
            this.showError('Only contract owner can transfer ownership');
            return;
        }

        if (!confirm('Are you sure you want to transfer ownership? This action cannot be undone!')) {
            return;
        }

        try {
            this.showLoading('Transferring Ownership', 'Submitting transaction...');

            const transaction = await this.contract.methods.changeOwner(newOwner).send({
                from: this.accounts[0]
            });

            this.hideLoading();
            this.showSuccess('Ownership Transferred', `Contract ownership transferred to: ${this.formatAddress(newOwner)}`);
            this.logTransaction('success', 'Transfer Ownership', `New owner: ${this.formatAddress(newOwner)}`, transaction.transactionHash);

            // Clear form
            document.getElementById('newOwnerAddress').value = '';

            // Refresh contract data
            await this.loadContractData();

        } catch (error) {
            this.hideLoading();
            console.error('Error changing owner:', error);
            this.showError('Failed to transfer ownership: ' + error.message);
        }
    }

    async addManualDocHash() {
        const hash = document.getElementById('manualDocHash').value.trim();
        const ipfs = document.getElementById('manualIpfsHash').value.trim() || 'Manual hash entry';

        if (!hash) {
            this.showError('Please enter document hash');
            return;
        }

        if (hash.length !== 64) {
            this.showError('Hash must be exactly 64 characters long');
            return;
        }

        try {
            this.showLoading('Adding Document Hash', 'Submitting transaction...');

            const hashBytes32 = '0x' + hash;
            const transaction = await this.contract.methods.addDocHash(hashBytes32, ipfs).send({
                from: this.accounts[0]
            });

            this.hideLoading();
            this.showSuccess('Document Hash Added', `Successfully stored document hash on blockchain`);
            this.logTransaction('success', 'Add Document Hash', `Hash: ${hash.substring(0, 16)}...`, transaction.transactionHash);

            // Clear form
            document.getElementById('manualDocHash').value = '';
            document.getElementById('manualIpfsHash').value = '';

            // Refresh stats
            await this.loadContractStats();

        } catch (error) {
            this.hideLoading();
            console.error('Error adding document hash:', error);
            this.showError('Failed to add document hash: ' + error.message);
        }
    }

    async deleteDocumentHash() {
        const hash = document.getElementById('deleteDocHash').value.trim();

        if (!hash) {
            this.showError('Please enter document hash');
            return;
        }

        if (!confirm('Are you sure you want to delete this document hash?')) {
            return;
        }

        try {
            this.showLoading('Deleting Document Hash', 'Submitting transaction...');

            const hashBytes32 = '0x' + hash;
            const transaction = await this.contract.methods.deleteHash(hashBytes32).send({
                from: this.accounts[0]
            });

            this.hideLoading();
            this.showSuccess('Document Hash Deleted', `Successfully removed document hash from blockchain`);
            this.logTransaction('success', 'Delete Document Hash', `Hash: ${hash.substring(0, 16)}...`, transaction.transactionHash);

            // Clear form
            document.getElementById('deleteDocHash').value = '';

            // Refresh stats
            await this.loadContractStats();

        } catch (error) {
            this.hideLoading();
            console.error('Error deleting document hash:', error);
            this.showError('Failed to delete document hash: ' + error.message);
        }
    }

    // Query functions
    async findDocumentHash() {
        const hash = document.getElementById('findDocHashInput').value.trim();

        if (!hash) {
            this.showError('Please enter document hash');
            return;
        }

        try {
            const hashBytes32 = '0x' + hash;
            const result = await this.contract.methods.findDocHash(hashBytes32).call();

            const blockNumber = result[0];
            const timestamp = result[1];
            const exporterInfo = result[2];
            const ipfsHash = result[3];

            if (blockNumber == 0) {
                document.getElementById('docQueryResult').innerHTML = `
                    <div class="alert alert-warning">
                        <strong>Document Not Found</strong><br>
                        Hash: ${hash}<br>
                        This document does not exist in the blockchain.
                    </div>
                `;
            } else {
                document.getElementById('docQueryResult').innerHTML = `
                    <div class="alert alert-success">
                        <strong>Document Found</strong><br>
                        <strong>Block Number:</strong> ${blockNumber}<br>
                        <strong>Timestamp:</strong> ${new Date(timestamp * 1000).toLocaleString()}<br>
                        <strong>Exporter:</strong> ${exporterInfo}<br>
                        <strong>IPFS Hash:</strong> ${ipfsHash}<br>
                        <strong>Hash:</strong> <span class="font-monospace">${hash}</span>
                    </div>
                `;
            }

            document.getElementById('docQueryResult').classList.remove('d-none');

        } catch (error) {
            console.error('Error finding document:', error);
            this.showError('Failed to find document: ' + error.message);
        }
    }

    async checkExporterStatus() {
        const address = document.getElementById('checkExporterAddress').value.trim();

        if (!address) {
            this.showError('Please enter exporter address');
            return;
        }

        try {
            const isExporter = await this.contract.methods.isExporter(address).call();
            const exporterInfo = await this.contract.methods.getExporterInfo(address).call();

            if (isExporter) {
                document.getElementById('exporterQueryResult').innerHTML = `
                    <div class="alert alert-success">
                        <strong>Authorized Exporter</strong><br>
                        <strong>Address:</strong> ${this.formatAddress(address)}<br>
                        <strong>Information:</strong> ${exporterInfo}<br>
                        <strong>Status:</strong> <span class="badge bg-success">ACTIVE</span>
                    </div>
                `;
            } else {
                document.getElementById('exporterQueryResult').innerHTML = `
                    <div class="alert alert-warning">
                        <strong>Not an Authorized Exporter</strong><br>
                        <strong>Address:</strong> ${this.formatAddress(address)}<br>
                        <strong>Status:</strong> <span class="badge bg-secondary">NOT AUTHORIZED</span>
                    </div>
                `;
            }

            document.getElementById('exporterQueryResult').classList.remove('d-none');

        } catch (error) {
            console.error('Error checking exporter:', error);
            this.showError('Failed to check exporter: ' + error.message);
        }
    }

    async checkDocumentExists() {
        const hash = document.getElementById('checkDocExists').value.trim();

        if (!hash) {
            this.showError('Please enter document hash');
            return;
        }

        try {
            const hashBytes32 = '0x' + hash;
            const exists = await this.contract.methods.documentExists(hashBytes32).call();

            document.getElementById('existsQueryResult').innerHTML = `
                <div class="alert ${exists ? 'alert-success' : 'alert-warning'}">
                    <strong>Document ${exists ? 'Exists' : 'Does Not Exist'}</strong><br>
                    <strong>Hash:</strong> <span class="font-monospace">${hash}</span><br>
                    <strong>Status:</strong> <span class="badge ${exists ? 'bg-success' : 'bg-secondary'}">${exists ? 'FOUND' : 'NOT FOUND'}</span>
                </div>
            `;

            document.getElementById('existsQueryResult').classList.remove('d-none');

        } catch (error) {
            console.error('Error checking document existence:', error);
            this.showError('Failed to check document: ' + error.message);
        }
    }

    // Quick stats functions
    async getContractStats() {
        try {
            const stats = await this.contract.methods.getStats().call();
            document.getElementById('quickStatsResult').innerHTML = `
                <div class="alert alert-info">
                    <strong>Contract Statistics</strong><br>
                    Total Exporters: ${stats[0]}<br>
                    Total Documents: ${stats[1]}
                </div>
            `;
        } catch (error) {
            this.showError('Failed to get stats: ' + error.message);
        }
    }

    async getContractOwner() {
        try {
            const owner = await this.contract.methods.owner().call();
            document.getElementById('quickStatsResult').innerHTML = `
                <div class="alert alert-info">
                    <strong>Contract Owner</strong><br>
                    ${this.formatAddress(owner)}
                </div>
            `;
        } catch (error) {
            this.showError('Failed to get owner: ' + error.message);
        }
    }

    async countExporters() {
        try {
            const count = await this.contract.methods.count_Exporters().call();
            document.getElementById('quickStatsResult').innerHTML = `
                <div class="alert alert-info">
                    <strong>Total Exporters</strong><br>
                    ${count}
                </div>
            `;
        } catch (error) {
            this.showError('Failed to count exporters: ' + error.message);
        }
    }

    async countHashes() {
        try {
            const count = await this.contract.methods.count_hashes().call();
            document.getElementById('quickStatsResult').innerHTML = `
                <div class="alert alert-info">
                    <strong>Total Documents</strong><br>
                    ${count}
                </div>
            `;
        } catch (error) {
            this.showError('Failed to count documents: ' + error.message);
        }
    }

    // Utility functions
    updateProgressStep(stepNumber, status) {
        const step = document.getElementById(`step${stepNumber}`);
        if (step) {
            step.className = `progress-step ${status}`;
            const statusSpan = step.querySelector('.step-status');
            if (statusSpan) {
                if (status === 'completed') {
                    statusSpan.textContent = 'Completed';
                } else if (status === 'active') {
                    statusSpan.textContent = 'In Progress';
                } else {
                    statusSpan.textContent = 'Pending';
                }
            }
        }
    }

    resetUploadForm() {
        this.currentFile = null;
        this.currentHash = null;

        document.getElementById('documentFile').value = '';
        document.getElementById('ipfsHash').value = '';
        document.getElementById('fileInfo').classList.add('d-none');
        document.getElementById('hashSection').classList.add('d-none');
        document.getElementById('hashResult').classList.add('d-none');
        document.getElementById('storeSection').classList.add('d-none');

        // Reset progress steps
        for (let i = 1; i <= 4; i++) {
            this.updateProgressStep(i, '');
        }
        this.updateProgressStep(1, 'active');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    logTransaction(type, category, description, txHash) {
        const logDiv = document.getElementById('transactionLog');
        const timestamp = new Date().toLocaleString();

        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <strong>${category}</strong><br>
                    <span>${description}</span>
                    ${txHash ? `<br><span class="log-hash">TX: ${txHash}</span>` : ''}
                </div>
                <small class="log-timestamp">${timestamp}</small>
            </div>
        `;

        // Remove placeholder if exists
        const placeholder = logDiv.querySelector('.text-center');
        if (placeholder) {
            placeholder.remove();
        }

        logDiv.insertBefore(logEntry, logDiv.firstChild);

        // Keep only last 50 entries
        while (logDiv.children.length > 50) {
            logDiv.removeChild(logDiv.lastChild);
        }
    }

    clearTransactionLog() {
        const logDiv = document.getElementById('transactionLog');
        logDiv.innerHTML = `
            <div class="text-center text-muted">
                <i class="fas fa-clipboard-list fa-2x mb-3"></i>
                <p>Transaction log cleared.</p>
            </div>
        `;
    }

    exportTransactionLog() {
        const logEntries = document.querySelectorAll('.log-entry');
        let logData = 'VeriChain Transaction Log\n\n';

        logEntries.forEach(entry => {
            const category = entry.querySelector('strong').textContent;
            const description = entry.querySelector('span').textContent;
            const timestamp = entry.querySelector('.log-timestamp').textContent;
            const txHash = entry.querySelector('.log-hash');

            logData += `${timestamp} - ${category}: ${description}`;
            if (txHash) {
                logData += ` (${txHash.textContent})`;
            }
            logData += '\n';
        });

        const blob = new Blob([logData], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `verichain-log-${new Date().getTime()}.txt`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    showLoading(title, message) {
        document.getElementById('loadingTitle').textContent = title;
        document.getElementById('loadingMessage').textContent = message;
        const modal = new bootstrap.Modal(document.getElementById('loadingModal'));
        modal.show();
    }

    hideLoading() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('loadingModal'));
        if (modal) {
            modal.hide();
        }
    }

    showSuccess(title, message) {
        this.showNotification(title + ': ' + message, 'success');
    }

    showError(message) {
        this.showNotification('Error: ' + message, 'danger');
    }

    showSuccessModal(title, content) {
        document.getElementById('successContent').innerHTML = content;
        const modal = new bootstrap.Modal(document.getElementById('successModal'));
        modal.show();
    }

    showNotification(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.insertBefore(alertDiv, document.body.firstChild);

        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 Initializing VeriChain Document Verification System with JSON Auto-Loader...');
    new VeriChainDocumentVerifier();
});

// Handle MetaMask account/network changes
if (window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts) => {
        console.log('👤 Accounts changed:', accounts);
        location.reload();
    });

    window.ethereum.on('chainChanged', (chainId) => {
        console.log('🔗 Chain changed:', chainId);
        location.reload();
    });
}