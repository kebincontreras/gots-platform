-- Additive private image storage for the GOTS Labs inventory.  Images are
-- served only through an authenticated Labs route; nothing is placed in /public.
CREATE TABLE lab_inventory_images (
  inventory_item_id text PRIMARY KEY REFERENCES lab_inventory_items(id) ON DELETE CASCADE,
  media_type text NOT NULL CHECK (media_type = 'image/webp'),
  size_bytes integer NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 5242880),
  sha256 text NOT NULL,
  content bytea NOT NULL,
  created_at text NOT NULL
);

CREATE TABLE lab_inventory_imports (
  source_sha256 text PRIMARY KEY,
  source_file_name text NOT NULL,
  inventory_row_count integer NOT NULL CHECK (inventory_row_count >= 0),
  image_row_count integer NOT NULL CHECK (image_row_count >= 0),
  imported_at text NOT NULL
);
