"""
Blockchain service for interacting with smart contracts
Handles escrow creation, milestone management, and dispute resolution
"""

import json
import logging
from decimal import Decimal
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta

from web3 import Web3
from web3.contract import Contract
from web3.exceptions import ContractLogicError, TransactionNotFound
from eth_account import Account
from eth_utils import to_checksum_address

from app.core.config import settings
from app.models.project import Project
from app.models.user import User
from app.schemas.blockchain import (
    EscrowCreateRequest,
    EscrowData,
    MilestoneData,
    DisputeData,
    BlockchainTransactionResult
)

logger = logging.getLogger(__name__)

class BlockchainService:
    """Service for blockchain operations"""
    
    def __init__(self):
        self.w3 = None
        self.escrow_contract = None
        self.payment_token_contract = None
        self._initialize_web3()
        
    def _initialize_web3(self) -> None:
        """Initialize Web3 connection and contracts"""
        try:
            # Connect to blockchain network
            if settings.BLOCKCHAIN_NETWORK == "mainnet":
                self.w3 = Web3(Web3.HTTPProvider(settings.ETHEREUM_RPC_URL))
            elif settings.BLOCKCHAIN_NETWORK == "polygon":
                self.w3 = Web3(Web3.HTTPProvider(settings.POLYGON_RPC_URL))
            elif settings.BLOCKCHAIN_NETWORK == "testnet":
                self.w3 = Web3(Web3.HTTPProvider(settings.TESTNET_RPC_URL))
            else:
                # Local development
                self.w3 = Web3(Web3.HTTPProvider(settings.LOCAL_RPC_URL))
            
            # Check connection
            if not self.w3.is_connected():
                logger.error("Failed to connect to blockchain network")
                return
                
            logger.info(f"Connected to blockchain network: {settings.BLOCKCHAIN_NETWORK}")
            
            # Load contract ABIs and addresses
            self._load_contracts()
            
        except Exception as e:
            logger.error(f"Error initializing Web3: {e}")
            
    def _load_contracts(self) -> None:
        """Load smart contract instances"""
        try:
            # Load escrow contract ABI
            with open(settings.ESCROW_CONTRACT_ABI_PATH, 'r') as f:
                escrow_abi = json.load(f)
                
            self.escrow_contract = self.w3.eth.contract(
                address=to_checksum_address(settings.ESCROW_CONTRACT_ADDRESS),
                abi=escrow_abi
            )
            
            # Load payment token contract if configured
            if settings.PAYMENT_TOKEN_CONTRACT_ADDRESS:
                with open(settings.PAYMENT_TOKEN_ABI_PATH, 'r') as f:
                    token_abi = json.load(f)
                    
                self.payment_token_contract = self.w3.eth.contract(
                    address=to_checksum_address(settings.PAYMENT_TOKEN_CONTRACT_ADDRESS),
                    abi=token_abi
                )
                
            logger.info("Smart contracts loaded successfully")
            
        except Exception as e:
            logger.error(f"Error loading contracts: {e}")
    
    async def create_escrow(
        self, 
        project_id: int,
        client_address: str,
        freelancer_address: str,
        escrow_data: EscrowCreateRequest,
        private_key: Optional[str] = None
    ) -> BlockchainTransactionResult:
        """Create a new escrow contract"""
        try:
            if not self.escrow_contract:
                raise ValueError("Escrow contract not initialized")
                
            # Validate addresses
            client_address = to_checksum_address(client_address)
            freelancer_address = to_checksum_address(freelancer_address)
            
            # Convert milestone amounts to Wei if using ETH
            milestone_amounts = []
            total_amount = Decimal('0')
            
            for milestone in escrow_data.milestones:
                if escrow_data.payment_token == "0x0000000000000000000000000000000000000000":
                    # ETH payment - convert to Wei
                    amount_wei = self.w3.to_wei(milestone.amount, 'ether')
                else:
                    # Token payment - use token decimals
                    token_decimals = await self._get_token_decimals(escrow_data.payment_token)
                    amount_wei = int(milestone.amount * (10 ** token_decimals))
                    
                milestone_amounts.append(amount_wei)
                total_amount += amount_wei
            
            # Prepare milestone data
            milestone_descriptions = [m.description for m in escrow_data.milestones]
            milestone_due_dates = [int(m.due_date.timestamp()) for m in escrow_data.milestones]
            milestone_auto_release = [m.auto_release for m in escrow_data.milestones]
            auto_release_delays = [m.auto_release_delay for m in escrow_data.milestones]
            
            # Build transaction
            function_call = self.escrow_contract.functions.createEscrow(
                project_id,
                freelancer_address,
                to_checksum_address(escrow_data.payment_token),
                milestone_amounts,
                milestone_descriptions,
                milestone_due_dates,
                milestone_auto_release,
                auto_release_delays,
                escrow_data.platform_fee_percent
            )
            
            # Get account for transaction signing
            account = Account.from_key(private_key) if private_key else None
            from_address = account.address if account else client_address
            
            # Estimate gas
            gas_estimate = function_call.estimate_gas({
                'from': from_address,
                'value': int(total_amount) if escrow_data.payment_token == "0x0000000000000000000000000000000000000000" else 0
            })
            
            # Build transaction
            transaction = function_call.build_transaction({
                'from': from_address,
                'gas': int(gas_estimate * 1.2),  # Add 20% buffer
                'gasPrice': self.w3.to_wei(escrow_data.gas_price_gwei or 20, 'gwei'),
                'nonce': self.w3.eth.get_transaction_count(from_address),
                'value': int(total_amount) if escrow_data.payment_token == "0x0000000000000000000000000000000000000000" else 0
            })
            
            if account:
                # Sign and send transaction
                signed_txn = account.sign_transaction(transaction)
                tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            else:
                # Return unsigned transaction for client signing
                return BlockchainTransactionResult(
                    success=False,
                    transaction_hash=None,
                    gas_estimate=gas_estimate,
                    unsigned_transaction=transaction,
                    message="Transaction ready for signing"
                )
            
            logger.info(f"Escrow creation transaction sent: {tx_hash.hex()}")
            
            return BlockchainTransactionResult(
                success=True,
                transaction_hash=tx_hash.hex(),
                gas_estimate=gas_estimate,
                message="Escrow creation transaction sent successfully"
            )
            
        except ContractLogicError as e:
            logger.error(f"Contract logic error in create_escrow: {e}")
            return BlockchainTransactionResult(
                success=False,
                error=f"Contract error: {str(e)}"
            )
        except Exception as e:
            logger.error(f"Error creating escrow: {e}")
            return BlockchainTransactionResult(
                success=False,
                error=str(e)
            )
    
    async def submit_milestone(
        self,
        escrow_id: int,
        milestone_index: int,
        deliverable_hash: str,
        freelancer_address: str,
        private_key: Optional[str] = None
    ) -> BlockchainTransactionResult:
        """Submit a milestone for approval"""
        try:
            if not self.escrow_contract:
                raise ValueError("Escrow contract not initialized")
                
            freelancer_address = to_checksum_address(freelancer_address)
            
            # Build transaction
            function_call = self.escrow_contract.functions.submitMilestone(
                escrow_id,
                milestone_index,
                deliverable_hash
            )
            
            # Get account for transaction signing
            account = Account.from_key(private_key) if private_key else None
            from_address = account.address if account else freelancer_address
            
            # Estimate gas
            gas_estimate = function_call.estimate_gas({'from': from_address})
            
            # Build transaction
            transaction = function_call.build_transaction({
                'from': from_address,
                'gas': int(gas_estimate * 1.2),
                'gasPrice': self.w3.to_wei(20, 'gwei'),  # Default gas price
                'nonce': self.w3.eth.get_transaction_count(from_address)
            })
            
            if account:
                # Sign and send transaction
                signed_txn = account.sign_transaction(transaction)
                tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            else:
                return BlockchainTransactionResult(
                    success=False,
                    transaction_hash=None,
                    gas_estimate=gas_estimate,
                    unsigned_transaction=transaction,
                    message="Transaction ready for signing"
                )
            
            logger.info(f"Milestone submission transaction sent: {tx_hash.hex()}")
            
            return BlockchainTransactionResult(
                success=True,
                transaction_hash=tx_hash.hex(),
                gas_estimate=gas_estimate,
                message="Milestone submission transaction sent successfully"
            )
            
        except Exception as e:
            logger.error(f"Error submitting milestone: {e}")
            return BlockchainTransactionResult(
                success=False,
                error=str(e)
            )
    
    async def approve_milestone(
        self,
        escrow_id: int,
        milestone_index: int,
        feedback: str,
        client_address: str,
        private_key: Optional[str] = None
    ) -> BlockchainTransactionResult:
        """Approve a submitted milestone"""
        try:
            if not self.escrow_contract:
                raise ValueError("Escrow contract not initialized")
                
            client_address = to_checksum_address(client_address)
            
            # Build transaction
            function_call = self.escrow_contract.functions.approveMilestone(
                escrow_id,
                milestone_index,
                feedback
            )
            
            # Get account for transaction signing
            account = Account.from_key(private_key) if private_key else None
            from_address = account.address if account else client_address
            
            # Estimate gas
            gas_estimate = function_call.estimate_gas({'from': from_address})
            
            # Build transaction
            transaction = function_call.build_transaction({
                'from': from_address,
                'gas': int(gas_estimate * 1.2),
                'gasPrice': self.w3.to_wei(20, 'gwei'),
                'nonce': self.w3.eth.get_transaction_count(from_address)
            })
            
            if account:
                # Sign and send transaction
                signed_txn = account.sign_transaction(transaction)
                tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            else:
                return BlockchainTransactionResult(
                    success=False,
                    transaction_hash=None,
                    gas_estimate=gas_estimate,
                    unsigned_transaction=transaction,
                    message="Transaction ready for signing"
                )
            
            logger.info(f"Milestone approval transaction sent: {tx_hash.hex()}")
            
            return BlockchainTransactionResult(
                success=True,
                transaction_hash=tx_hash.hex(),
                gas_estimate=gas_estimate,
                message="Milestone approval transaction sent successfully"
            )
            
        except Exception as e:
            logger.error(f"Error approving milestone: {e}")
            return BlockchainTransactionResult(
                success=False,
                error=str(e)
            )
    
    async def reject_milestone(
        self,
        escrow_id: int,
        milestone_index: int,
        feedback: str,
        client_address: str,
        private_key: Optional[str] = None
    ) -> BlockchainTransactionResult:
        """Reject a submitted milestone"""
        try:
            if not self.escrow_contract:
                raise ValueError("Escrow contract not initialized")
                
            client_address = to_checksum_address(client_address)
            
            # Build transaction
            function_call = self.escrow_contract.functions.rejectMilestone(
                escrow_id,
                milestone_index,
                feedback
            )
            
            # Get account for transaction signing
            account = Account.from_key(private_key) if private_key else None
            from_address = account.address if account else client_address
            
            # Estimate gas
            gas_estimate = function_call.estimate_gas({'from': from_address})
            
            # Build transaction
            transaction = function_call.build_transaction({
                'from': from_address,
                'gas': int(gas_estimate * 1.2),
                'gasPrice': self.w3.to_wei(20, 'gwei'),
                'nonce': self.w3.eth.get_transaction_count(from_address)
            })
            
            if account:
                # Sign and send transaction
                signed_txn = account.sign_transaction(transaction)
                tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            else:
                return BlockchainTransactionResult(
                    success=False,
                    transaction_hash=None,
                    gas_estimate=gas_estimate,
                    unsigned_transaction=transaction,
                    message="Transaction ready for signing"
                )
            
            logger.info(f"Milestone rejection transaction sent: {tx_hash.hex()}")
            
            return BlockchainTransactionResult(
                success=True,
                transaction_hash=tx_hash.hex(),
                gas_estimate=gas_estimate,
                message="Milestone rejection transaction sent successfully"
            )
            
        except Exception as e:
            logger.error(f"Error rejecting milestone: {e}")
            return BlockchainTransactionResult(
                success=False,
                error=str(e)
            )
    
    async def raise_dispute(
        self,
        escrow_id: int,
        reason: str,
        affected_milestones: List[int],
        user_address: str,
        private_key: Optional[str] = None
    ) -> BlockchainTransactionResult:
        """Raise a dispute for an escrow"""
        try:
            if not self.escrow_contract:
                raise ValueError("Escrow contract not initialized")
                
            user_address = to_checksum_address(user_address)
            
            # Build transaction
            function_call = self.escrow_contract.functions.raiseDispute(
                escrow_id,
                reason,
                affected_milestones
            )
            
            # Get account for transaction signing
            account = Account.from_key(private_key) if private_key else None
            from_address = account.address if account else user_address
            
            # Estimate gas
            gas_estimate = function_call.estimate_gas({'from': from_address})
            
            # Build transaction
            transaction = function_call.build_transaction({
                'from': from_address,
                'gas': int(gas_estimate * 1.2),
                'gasPrice': self.w3.to_wei(20, 'gwei'),
                'nonce': self.w3.eth.get_transaction_count(from_address)
            })
            
            if account:
                # Sign and send transaction
                signed_txn = account.sign_transaction(transaction)
                tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            else:
                return BlockchainTransactionResult(
                    success=False,
                    transaction_hash=None,
                    gas_estimate=gas_estimate,
                    unsigned_transaction=transaction,
                    message="Transaction ready for signing"
                )
            
            logger.info(f"Dispute raising transaction sent: {tx_hash.hex()}")
            
            return BlockchainTransactionResult(
                success=True,
                transaction_hash=tx_hash.hex(),
                gas_estimate=gas_estimate,
                message="Dispute raising transaction sent successfully"
            )
            
        except Exception as e:
            logger.error(f"Error raising dispute: {e}")
            return BlockchainTransactionResult(
                success=False,
                error=str(e)
            )
    
    async def get_escrow_data(self, escrow_id: int) -> Optional[EscrowData]:
        """Get escrow data from blockchain"""
        try:
            if not self.escrow_contract:
                raise ValueError("Escrow contract not initialized")
                
            # Get basic escrow data
            escrow_info = self.escrow_contract.functions.getEscrow(escrow_id).call()
            
            # Get milestone count
            milestone_count = self.escrow_contract.functions.getMilestoneCount(escrow_id).call()
            
            # Get all milestones
            milestones = []
            for i in range(milestone_count):
                milestone_info = self.escrow_contract.functions.getMilestone(escrow_id, i).call()
                milestones.append(MilestoneData(
                    amount=self._from_wei(milestone_info[0], escrow_info[3]),  # Convert from wei
                    description=milestone_info[1],
                    due_date=datetime.fromtimestamp(milestone_info[2]),
                    state=milestone_info[3],
                    deliverable_hash=milestone_info[4],
                    submitted_at=datetime.fromtimestamp(milestone_info[5]) if milestone_info[5] > 0 else None,
                    approved_at=datetime.fromtimestamp(milestone_info[6]) if milestone_info[6] > 0 else None,
                    feedback=milestone_info[7]
                ))
            
            # Get dispute data
            dispute_info = self.escrow_contract.functions.getDispute(escrow_id).call()
            dispute = DisputeData(
                state=dispute_info[0],
                initiator=dispute_info[1],
                reason=dispute_info[2],
                created_at=datetime.fromtimestamp(dispute_info[3]) if dispute_info[3] > 0 else None,
                resolved_at=datetime.fromtimestamp(dispute_info[4]) if dispute_info[4] > 0 else None,
                resolver=dispute_info[5],
                resolution=dispute_info[6]
            )
            
            return EscrowData(
                escrow_id=escrow_id,
                project_id=escrow_info[0],
                client=escrow_info[1],
                freelancer=escrow_info[2],
                payment_token=escrow_info[3],
                total_amount=self._from_wei(escrow_info[4], escrow_info[3]),
                state=escrow_info[5],
                created_at=datetime.fromtimestamp(escrow_info[6]),
                completed_at=datetime.fromtimestamp(escrow_info[7]) if escrow_info[7] > 0 else None,
                milestones=milestones,
                dispute=dispute
            )
            
        except Exception as e:
            logger.error(f"Error getting escrow data: {e}")
            return None
    
    async def get_user_escrows(self, user_address: str, user_type: str) -> List[int]:
        """Get escrow IDs for a user"""
        try:
            if not self.escrow_contract:
                raise ValueError("Escrow contract not initialized")
                
            user_address = to_checksum_address(user_address)
            
            if user_type == "client":
                escrow_ids = self.escrow_contract.functions.getClientEscrows(user_address).call()
            elif user_type == "freelancer":
                escrow_ids = self.escrow_contract.functions.getFreelancerEscrows(user_address).call()
            else:
                raise ValueError("Invalid user type")
                
            return list(escrow_ids)
            
        except Exception as e:
            logger.error(f"Error getting user escrows: {e}")
            return []
    
    async def get_transaction_status(self, tx_hash: str) -> Dict[str, Any]:
        """Get transaction status and details"""
        try:
            if not self.w3:
                raise ValueError("Web3 not initialized")
                
            # Get transaction receipt
            receipt = self.w3.eth.get_transaction_receipt(tx_hash)
            
            # Parse logs if transaction was successful
            parsed_logs = []
            if receipt.status == 1 and self.escrow_contract:
                try:
                    logs = self.escrow_contract.events.EscrowCreated().processReceipt(receipt)
                    parsed_logs.extend([dict(log) for log in logs])
                except:
                    pass
                    
                try:
                    logs = self.escrow_contract.events.MilestoneSubmitted().processReceipt(receipt)
                    parsed_logs.extend([dict(log) for log in logs])
                except:
                    pass
                    
                try:
                    logs = self.escrow_contract.events.PaymentReleased().processReceipt(receipt)
                    parsed_logs.extend([dict(log) for log in logs])
                except:
                    pass
            
            return {
                "transaction_hash": tx_hash,
                "status": "success" if receipt.status == 1 else "failed",
                "block_number": receipt.blockNumber,
                "gas_used": receipt.gasUsed,
                "logs": parsed_logs,
                "confirmations": self.w3.eth.block_number - receipt.blockNumber
            }
            
        except TransactionNotFound:
            return {
                "transaction_hash": tx_hash,
                "status": "pending",
                "message": "Transaction not yet mined"
            }
        except Exception as e:
            logger.error(f"Error getting transaction status: {e}")
            return {
                "transaction_hash": tx_hash,
                "status": "error",
                "error": str(e)
            }
    
    async def _get_token_decimals(self, token_address: str) -> int:
        """Get token decimals"""
        try:
            if not self.payment_token_contract or self.payment_token_contract.address != token_address:
                # Load token contract for this address
                with open(settings.PAYMENT_TOKEN_ABI_PATH, 'r') as f:
                    token_abi = json.load(f)
                    
                token_contract = self.w3.eth.contract(
                    address=to_checksum_address(token_address),
                    abi=token_abi
                )
                return token_contract.functions.decimals().call()
            else:
                return self.payment_token_contract.functions.decimals().call()
        except:
            return 18  # Default to 18 decimals
    
    def _from_wei(self, amount: int, token_address: str) -> Decimal:
        """Convert from wei to human readable amount"""
        if token_address == "0x0000000000000000000000000000000000000000":
            # ETH
            return Decimal(str(self.w3.from_wei(amount, 'ether')))
        else:
            # Token - assume 18 decimals for now
            return Decimal(amount) / Decimal(10 ** 18)
    
    async def estimate_gas_price(self) -> int:
        """Get current gas price estimate"""
        try:
            if not self.w3:
                return 20  # Default 20 gwei
                
            gas_price = self.w3.eth.gas_price
            return self.w3.from_wei(gas_price, 'gwei')
        except:
            return 20  # Default fallback

# Global service instance
blockchain_service = BlockchainService()
