CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'client',
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    two_fa_enabled BOOLEAN NOT NULL DEFAULT false,
    two_fa_secret VARCHAR(255),
    wallet_address VARCHAR(255),
    bio TEXT,
    skills JSON,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    latitude FLOAT,
    longitude FLOAT,
    city VARCHAR(255),
    country VARCHAR(255),
    timezone_name VARCHAR(255)
);

\dt
