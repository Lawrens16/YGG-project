module achievement_wallet::achievement {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use std::string::{Self, String};

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

    /// Initialize the module and create verifier cap
    fun init(ctx: &mut TxContext) {
        let verifier_cap = VerifierCap {
            id: object::new(ctx),
        };
        transfer::share_object(verifier_cap);
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
}

