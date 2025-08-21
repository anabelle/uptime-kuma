exports.up = function(knex) {
    return knex.schema
        // Anonymous sessions table
        .createTable('anonymous_session', function (table) {
            table.increments('id');
            table.uuid('session_id').notNullable().unique();
            table.datetime('created_date').notNullable().defaultTo(knex.fn.now());
            table.datetime('last_active').notNullable().defaultTo(knex.fn.now());
            table.boolean('active').notNullable().defaultTo(true);
            table.string('user_agent', 500);
            table.string('ip_address', 45); // IPv6 compatible
        })
        // Credits table
        .createTable('credits', function (table) {
            table.increments('id');
            table.integer('user_id').unsigned()
                .references('id').inTable('user')
                .onDelete('CASCADE')
                .onUpdate('CASCADE');
            table.integer('anonymous_session_id').unsigned()
                .references('id').inTable('anonymous_session')
                .onDelete('CASCADE')
                .onUpdate('CASCADE');
            table.bigInteger('balance').notNullable().defaultTo(0); // Balance in sats
            table.datetime('updated_date').notNullable().defaultTo(knex.fn.now());
            table.datetime('created_date').notNullable().defaultTo(knex.fn.now());

            // Ensure only one of user_id or anonymous_session_id is set
            table.check('?? IS NOT NULL OR ?? IS NOT NULL', ['user_id', 'anonymous_session_id']);
            table.check('?? IS NULL OR ?? IS NULL', ['user_id', 'anonymous_session_id']);
        })
        // Payments table for tracking NakaPay transactions
        .createTable('payment', function (table) {
            table.increments('id');
            table.integer('user_id').unsigned()
                .references('id').inTable('user')
                .onDelete('SET NULL')
                .onUpdate('CASCADE');
            table.integer('anonymous_session_id').unsigned()
                .references('id').inTable('anonymous_session')
                .onDelete('SET NULL')
                .onUpdate('CASCADE');
            table.string('invoice_id', 255).notNullable(); // NakaPay invoice ID
            table.bigInteger('amount').notNullable(); // Amount in sats
            table.string('status', 50).notNullable().defaultTo('pending'); // pending, paid, failed, expired
            table.datetime('created_date').notNullable().defaultTo(knex.fn.now());
            table.datetime('paid_date');

            table.index(['status', 'created_date']);
        })
        // Credit usage log for tracking deductions
        .createTable('credit_usage', function (table) {
            table.increments('id');
            table.integer('user_id').unsigned()
                .references('id').inTable('user')
                .onDelete('SET NULL')
                .onUpdate('CASCADE');
            table.integer('anonymous_session_id').unsigned()
                .references('id').inTable('anonymous_session')
                .onDelete('SET NULL')
                .onUpdate('CASCADE');
            table.integer('monitor_id').unsigned()
                .references('id').inTable('monitor')
                .onDelete('SET NULL')
                .onUpdate('CASCADE');
            table.bigInteger('amount').notNullable(); // Amount deducted in sats
            table.string('action', 100).notNullable(); // monitor_created, alert_sent, check_performed
            table.datetime('created_date').notNullable().defaultTo(knex.fn.now());

            table.index(['created_date']);
            table.index(['user_id', 'created_date']);
            table.index(['anonymous_session_id', 'created_date']);
        });
};

exports.down = function(knex) {
    return knex.schema
        .dropTableIfExists('credit_usage')
        .dropTableIfExists('payment')
        .dropTableIfExists('credits')
        .dropTableIfExists('anonymous_session');
};