module achievement_wallet::achievement {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use std::string::{Self, String};
    use sui::balance::{Self, Balance};

    /// Achievement NFT - soulbound token (non-transferable)
    struct Achievement has key {
        id: UID,
        owner: address,
        verifier: address,
        event_id: vector<u8>, // Event ID (can be empty for non-event achievements)
        event_name: String,    // Event name (can be empty)
        category: String,
        title: String,
        description: String,
        proof_hash: vector<u8>,
        timestamp: u64,
        gps_data: String,
        verified: bool,
        sui_transaction_id: vector<u8>,
    }

    /// Mint and immediately verify a certificate (requires VerifierCap)
    public entry fun mint_certificate(
        verifier_cap: &VerifierCap,
        owner: address,
        category: vector<u8>,
        title: vector<u8>,
        description: vector<u8>,
        proof_hash: vector<u8>,
        gps_data: vector<u8>,
        ctx: &mut TxContext
    ) {
        mint_certificate_with_event(
            verifier_cap,
            owner,
            vector::empty<u8>(), // empty event_id
            vector::empty<u8>(), // empty event_name
            category,
            title,
            description,
            proof_hash,
            gps_data,
            ctx
        );
    }

    /// Mint and immediately verify a certificate with event info (requires VerifierCap)
    public entry fun mint_certificate_with_event(
        verifier_cap: &VerifierCap,
        owner: address,
        event_id: vector<u8>,
        event_name: vector<u8>,
        category: vector<u8>,
        title: vector<u8>,
        description: vector<u8>,
        proof_hash: vector<u8>,
        gps_data: vector<u8>,
        ctx: &mut TxContext
    ) {
        // Silence unused warning to assert possession of cap
        let _cap_id = object::id(verifier_cap);

        let category_string = string::utf8(category);
        let title_string = string::utf8(title);
        let description_string = string::utf8(description);
        let gps_string = string::utf8(gps_data);
        let event_name_string = string::utf8(event_name);
        let timestamp = tx_context::epoch_timestamp_ms(ctx);
        let sender = tx_context::sender(ctx);

        let achievement = Achievement {
            id: object::new(ctx),
            owner,
            verifier: sender,
            event_id,
            event_name: event_name_string,
            category: category_string,
            title: title_string,
            description: description_string,
            proof_hash,
            timestamp,
            gps_data: gps_string,
            verified: true,
            sui_transaction_id: tx_context::tx_hash(ctx),
        };

        let achievement_id = object::id(&achievement);
        transfer::transfer(achievement, owner);

        event::emit(AchievementCreated {
            achievement_id,
            owner,
            category: category_string,
            timestamp,
        });
        event::emit(AchievementVerified {
            achievement_id,
            verifier: sender,
            timestamp,
        });
    }

    /// Capability for verified organizers to mint achievements
    struct VerifierCap has key, store {
        id: UID,
    }

    /// Capability for event organizers to mint clearances
    struct OrganizerCap has key, store {
        id: UID,
        organizer: address,
    }

    /// Developer treasury to collect 2% fee from organizers
    struct DeveloperTreasury has key {
        id: UID,
        balance: Balance<SUI>,
    }

    /// Clearance NFT - custom clearance for event attendees (soulbound)
    struct Clearance has key {
        id: UID,
        owner: address,
        organizer: address,
        event_id: vector<u8>,
        event_name: String,
        clearance_type: String,
        title: String,
        description: String,
        metadata: String, // JSON string for custom metadata
        timestamp: u64,
        sui_transaction_id: vector<u8>,
    }

    /// Event emitted when an achievement is created
    struct AchievementCreated has copy, drop {
        achievement_id: ID,
        owner: address,
        category: String,
        timestamp: u64,
    }

    /// Event emitted when an achievement is verified
    struct AchievementVerified has copy, drop {
        achievement_id: ID,
        verifier: address,
        timestamp: u64,
    }

    /// Event emitted when a clearance is minted
    struct ClearanceMinted has copy, drop {
        clearance_id: ID,
        owner: address,
        organizer: address,
        event_id: vector<u8>,
        timestamp: u64,
    }

    /// Event emitted when batch clearances are minted
    struct BatchClearanceMinted has copy, drop {
        organizer: address,
        event_id: vector<u8>,
        attendee_count: u64,
        total_fee: u64,
        developer_fee: u64,
        clearance_ids: vector<ID>,
        timestamp: u64,
    }

    /// Initialize the module and create verifier cap, organizer registry, and developer treasury
    fun init(ctx: &mut TxContext) {
        let verifier_cap = VerifierCap {
            id: object::new(ctx),
        };
        transfer::share_object(verifier_cap);

        // Create developer treasury (owned by deployer/admin)
        let treasury = DeveloperTreasury {
            id: object::new(ctx),
            balance: balance::zero<SUI>(),
        };
        transfer::transfer(treasury, tx_context::sender(ctx));
    }

    /// Register an organizer (admin function - can be called by deployer)
    /// In production, this should be gated by admin cap
    public entry fun register_organizer(
        organizer: address,
        ctx: &mut TxContext
    ) {
        let organizer_cap = OrganizerCap {
            id: object::new(ctx),
            organizer,
        };
        transfer::transfer(organizer_cap, organizer);
    }

    /// Batch mint clearances for event attendees
    /// Organizer pays gas + 2% developer fee
    /// Fee is calculated as: base_fee_per_clearance * count * 1.02
    public entry fun batch_mint_clearances(
        organizer_cap: &OrganizerCap,
        treasury: &mut DeveloperTreasury,
        payment: Coin<SUI>,
        attendees: vector<address>,
        event_id: vector<u8>,
        event_name: vector<u8>,
        clearance_type: vector<u8>,
        title: vector<u8>,
        description: vector<u8>,
        metadata: vector<u8>,
        base_fee_per_clearance: u64, // Base fee in MIST (1 SUI = 1,000,000,000 MIST)
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == organizer_cap.organizer, 1); // Only the organizer can mint

        let attendee_count = vector::length(&attendees);
        assert!(attendee_count > 0, 2); // Must have at least one attendee

        // Calculate total fee: base_fee * count * 1.02 (2% developer fee)
        // Using integer math: fee = (base_fee * count * 102) / 100
        let total_fee = (base_fee_per_clearance * attendee_count * 102) / 100;
        let payment_value = coin::value(&payment);
        assert!(payment_value >= total_fee, 3); // Insufficient payment

        // Calculate developer fee (2% of base fee * count)
        let developer_fee = (base_fee_per_clearance * attendee_count * 2) / 100;
        
        // Split developer fee from payment and transfer to treasury
        let fee_coin = coin::split(&mut payment, developer_fee);
        let fee_balance = coin::into_balance(fee_coin);
        balance::join(&mut treasury.balance, fee_balance);
        
        // Return remainder to organizer (if any)
        let remaining_value = coin::value(&payment);
        if (remaining_value > 0) {
            transfer::transfer(payment, sender);
        };
        // If payment is exactly the fee, the empty coin will be dropped automatically

        // Convert strings
        let event_name_string = string::utf8(event_name);
        let clearance_type_string = string::utf8(clearance_type);
        let title_string = string::utf8(title);
        let description_string = string::utf8(description);
        let metadata_string = string::utf8(metadata);
        let timestamp = tx_context::epoch_timestamp_ms(ctx);
        let tx_hash = tx_context::tx_hash(ctx);

        // Mint clearances for all attendees
        let i = 0;
        let len = vector::length(&attendees);
        let clearance_ids = vector::empty<ID>();
        
        while (i < len) {
            let attendee = *vector::borrow(&attendees, i);
            
            let clearance = Clearance {
                id: object::new(ctx),
                owner: attendee,
                organizer: sender,
                event_id: event_id, // Copy event_id for each
                event_name: event_name_string,
                clearance_type: clearance_type_string,
                title: title_string,
                description: description_string,
                metadata: metadata_string,
                timestamp,
                sui_transaction_id: tx_hash,
            };

            let clearance_id = object::id(&clearance);
            vector::push_back(&mut clearance_ids, clearance_id);
            transfer::transfer(clearance, attendee);

            event::emit(ClearanceMinted {
                clearance_id,
                owner: attendee,
                organizer: sender,
                event_id: event_id,
                timestamp,
            });

            i = i + 1;
        };

        // Emit batch event
        event::emit(BatchClearanceMinted {
            organizer: sender,
            event_id: event_id,
            attendee_count,
            total_fee,
            developer_fee,
            clearance_ids,
            timestamp,
        });
    }

    /// Withdraw funds from developer treasury (admin function)
    public entry fun withdraw_from_treasury(
        treasury: &mut DeveloperTreasury,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        // In production, add admin cap check here
        let coin = coin::from_balance(balance::withdraw(&mut treasury.balance, amount), ctx);
        transfer::transfer(coin, recipient);
    }

    /// Mint a new achievement (pending verification)
    public entry fun mint_achievement(
        owner: address,
        category: vector<u8>,
        title: vector<u8>,
        description: vector<u8>,
        proof_hash: vector<u8>,
        gps_data: vector<u8>,
        ctx: &mut TxContext
    ) {
        mint_achievement_with_event(
            owner,
            vector::empty<u8>(), // empty event_id
            vector::empty<u8>(), // empty event_name
            category,
            title,
            description,
            proof_hash,
            gps_data,
            ctx
        );
    }

    /// Mint a new achievement with event info (pending verification)
    public entry fun mint_achievement_with_event(
        owner: address,
        event_id: vector<u8>,
        event_name: vector<u8>,
        category: vector<u8>,
        title: vector<u8>,
        description: vector<u8>,
        proof_hash: vector<u8>,
        gps_data: vector<u8>,
        ctx: &mut TxContext
    ) {
        let category_string = string::utf8(category);
        let title_string = string::utf8(title);
        let description_string = string::utf8(description);
        let gps_string = string::utf8(gps_data);
        let event_name_string = string::utf8(event_name);
        let timestamp = tx_context::epoch_timestamp_ms(ctx);

        let achievement = Achievement {
            id: object::new(ctx),
            owner,
            verifier: @0x0,
            event_id,
            event_name: event_name_string,
            category: category_string,
            title: title_string,
            description: description_string,
            proof_hash,
            timestamp,
            gps_data: gps_string,
            verified: false,
            sui_transaction_id: tx_context::tx_hash(ctx),
        };

        let achievement_id = object::id(&achievement);
        
        // Transfer to owner (soulbound - owner cannot transfer)
        transfer::transfer(achievement, owner);

        event::emit(AchievementCreated {
            achievement_id,
            owner,
            category: category_string,
            timestamp,
        });
    }

    /// Batch mint event badges for multiple owners
    public entry fun batch_mint_event_badges(
        verifier_cap: &VerifierCap,
        owners: vector<address>,
        event_id: vector<u8>,
        event_name: vector<u8>,
        category: vector<u8>,
        title: vector<u8>,
        description: vector<u8>,
        ctx: &mut TxContext
    ) {
        // Silence unused warning to assert possession of cap
        let _cap_id = object::id(verifier_cap);

        let category_string = string::utf8(category);
        let title_string = string::utf8(title);
        let description_string = string::utf8(description);
        let event_name_string = string::utf8(event_name);
        let timestamp = tx_context::epoch_timestamp_ms(ctx);
        let sender = tx_context::sender(ctx);
        let tx_hash = tx_context::tx_hash(ctx);

        let i = 0;
        let len = vector::length(&owners);
        while (i < len) {
            let owner = *vector::borrow(&owners, i);
            
            let achievement = Achievement {
                id: object::new(ctx),
                owner,
                verifier: sender,
                event_id: event_id, // Copy event_id for each
                event_name: event_name_string,
                category: category_string,
                title: title_string,
                description: description_string,
                proof_hash: vector::empty<u8>(), // Empty for batch minting
                timestamp,
                gps_data: string::utf8(b""),
                verified: true,
                sui_transaction_id: tx_hash,
            };

            let achievement_id = object::id(&achievement);
            transfer::transfer(achievement, owner);

            event::emit(AchievementCreated {
                achievement_id,
                owner,
                category: category_string,
                timestamp,
            });
            event::emit(AchievementVerified {
                achievement_id,
                verifier: sender,
                timestamp,
            });

            i = i + 1;
        };
    }

    /// Verify an achievement (only verifiers can call this)
    public entry fun verify_achievement(
        verifier_cap: &VerifierCap,
        achievement: &mut Achievement,
        ctx: &mut TxContext
    ) {
        assert!(object::id(verifier_cap) != object::id(achievement), 0);
        
        let verifier = tx_context::sender(ctx);
        let achievement_id = object::id(achievement);
        let timestamp = tx_context::epoch_timestamp_ms(ctx);

        achievement.verifier = verifier;
        achievement.verified = true;

        event::emit(AchievementVerified {
            achievement_id,
            verifier,
            timestamp,
        });
    }

    /// Get achievement details
    public fun get_owner(achievement: &Achievement): address {
        achievement.owner
    }

    public fun get_verifier(achievement: &Achievement): address {
        achievement.verifier
    }

    public fun is_verified(achievement: &Achievement): bool {
        achievement.verified
    }

    public fun get_category(achievement: &Achievement): String {
        achievement.category
    }

    public fun get_timestamp(achievement: &Achievement): u64 {
        achievement.timestamp
    }

    /// Get clearance details
    public fun get_clearance_owner(clearance: &Clearance): address {
        clearance.owner
    }

    public fun get_clearance_organizer(clearance: &Clearance): address {
        clearance.organizer
    }

    public fun get_clearance_event_id(clearance: &Clearance): vector<u8> {
        clearance.event_id
    }

    public fun get_clearance_type(clearance: &Clearance): String {
        clearance.clearance_type
    }

    public fun get_clearance_timestamp(clearance: &Clearance): u64 {
        clearance.timestamp
    }
}

