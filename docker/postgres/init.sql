-- Family Recipes App Database Schema
-- PostgreSQL initialization script

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'editor', 'viewer');
CREATE TYPE language_preference AS ENUM ('en', 'es');
CREATE TYPE media_type AS ENUM ('image', 'video');

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'viewer',
    invited_by INTEGER REFERENCES users(id),
    language_pref language_preference NOT NULL DEFAULT 'en',
    is_active BOOLEAN NOT NULL DEFAULT true,
    invite_token VARCHAR(255),
    invite_token_expires TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for users table
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_invited_by ON users(invited_by);
CREATE INDEX idx_users_role ON users(role);

-- Recipes table
CREATE TABLE recipes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title_en VARCHAR(255) NOT NULL,
    title_es VARCHAR(255),
    ingredients_en JSONB NOT NULL,
    ingredients_es JSONB,
    instructions_en TEXT NOT NULL,
    instructions_es TEXT,
    prep_time INTEGER,
    cook_time INTEGER,
    servings INTEGER,
    tags TEXT[] DEFAULT '{}',
    categories TEXT[] DEFAULT '{}',
    is_public BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for recipes table
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_recipes_is_public ON recipes(is_public);
CREATE INDEX idx_recipes_tags ON recipes USING GIN(tags);
CREATE INDEX idx_recipes_categories ON recipes USING GIN(categories);

-- Create function to convert jsonb array to text for indexing
CREATE OR REPLACE FUNCTION jsonb_array_to_text(jsonb) RETURNS TEXT AS $$
SELECT string_agg(value, ' ') FROM jsonb_array_elements_text($1);
$$ LANGUAGE SQL IMMUTABLE;

-- Full-text search indexes for recipes
CREATE INDEX idx_recipes_title_en_search ON recipes USING GIN(to_tsvector('english', title_en));
CREATE INDEX idx_recipes_title_es_search ON recipes USING GIN(to_tsvector('spanish', title_es));
CREATE INDEX idx_recipes_ingredients_en_search ON recipes USING GIN(
    to_tsvector('english', jsonb_array_to_text(ingredients_en))
);
CREATE INDEX idx_recipes_ingredients_es_search ON recipes USING GIN(
    to_tsvector('spanish', jsonb_array_to_text(ingredients_es))
);

-- Comments table
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for comments table
CREATE INDEX idx_comments_recipe_id ON comments(recipe_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);

-- Favorites table
CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(recipe_id, user_id)
);

-- Create indexes for favorites table
CREATE INDEX idx_favorites_recipe_id ON favorites(recipe_id);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);

-- Media table
CREATE TABLE media (
    id SERIAL PRIMARY KEY,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    type media_type NOT NULL DEFAULT 'image',
    public_id VARCHAR(255), -- Cloudinary public ID for deletion
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for media table
CREATE INDEX idx_media_recipe_id ON media(recipe_id);
CREATE INDEX idx_media_type ON media(type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert a default admin user for development
-- Password: admin123 (hashed)
INSERT INTO users (email, password_hash, role, language_pref, is_active)
VALUES (
    'admin@familyrecipes.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8lWZQjzHq',
    'admin',
    'en',
    true
);

-- Insert some sample recipes for development
INSERT INTO recipes (user_id, title_en, title_es, ingredients_en, ingredients_es, instructions_en, instructions_es, prep_time, cook_time, servings, tags, categories, is_public)
VALUES
(1, 'Chocolate Chip Cookies', 'Galletas de Chispas de Chocolate',
 '["2 1/4 cups all-purpose flour", "1 teaspoon baking soda", "1 teaspoon salt", "1 cup butter, softened", "3/4 cup granulated sugar", "3/4 cup packed brown sugar", "1 teaspoon vanilla extract", "2 large eggs", "2 cups chocolate chips"]',
 '["2 1/4 tazas de harina para todo uso", "1 cucharadita de bicarbonato de sodio", "1 cucharadita de sal", "1 taza de mantequilla, ablandada", "3/4 taza de azúcar granulada", "3/4 taza de azúcar morena compacta", "1 cucharadita de extracto de vainilla", "2 huevos grandes", "2 tazas de chispas de chocolate"]',
 'Preheat oven to 375°F (190°C). In a bowl, combine flour, baking soda, and salt. In another bowl, cream butter and sugars until light and fluffy. Beat in vanilla and eggs. Gradually blend in flour mixture. Stir in chocolate chips. Drop rounded tablespoons onto ungreased cookie sheets. Bake 9-11 minutes or until golden brown.',
 'Precaliente el horno a 375°F (190°C). En un bowl, combine harina, bicarbonato de sodio y sal. En otro bowl, bata la mantequilla y azúcares hasta que estén ligeros y esponjosos. Agregue vainilla y huevos. Incorpore gradualmente la mezcla de harina. Agregue las chispas de chocolate. Coloque cucharadas redondeadas en bandejas para galletas sin engrasar. Hornee 9-11 minutos o hasta que estén doradas.',
 15, 11, 24, ARRAY['dessert', 'cookies', 'chocolate'], ARRAY['baking', 'american'], true),

(1, 'Spanish Tortilla', 'Tortilla Española',
 '["4 large potatoes", "1 large onion", "6 large eggs", "Olive oil", "Salt"]',
 '["4 papas grandes", "1 cebolla grande", "6 huevos grandes", "Aceite de oliva", "Sal"]',
 'Peel and slice potatoes thinly. Slice onion. Heat olive oil in a large frying pan. Add potatoes and onion, season with salt. Cook slowly until potatoes are tender but not browned. Beat eggs in a bowl. Drain potatoes and onion, add to eggs. Heat some oil in the pan, add mixture and cook until set. Flip and cook the other side.',
 'Pele y corte las papas en rodajas finas. Corte la cebolla. Caliente aceite de oliva en una sartén grande. Agregue papas y cebolla, sazone con sal. Cocine lentamente hasta que las papas estén tiernas pero no doradas. Bata los huevos en un bowl. Escurra las papas y cebolla, agregue a los huevos. Caliente aceite en la sartén, agregue la mezcla y cocine hasta que esté cuajada. Voltee y cocine el otro lado.',
 20, 25, 6, ARRAY['spanish', 'potatoes', 'eggs'], ARRAY['main course', 'traditional'], true);