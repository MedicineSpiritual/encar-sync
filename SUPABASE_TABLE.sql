create table if not exists cars (

  id bigint primary key,

  title text,
  slug text,

  manufacturer text,
  model text,
  grade text,

  year integer,
  month integer,

  mileage integer,

  fuel_type text,
  transmission text,
  color text,

  displacement integer,

  thumbnail text,

  images jsonb,

  options jsonb,

  inspection jsonb,

  diagnosis jsonb,

  verification jsonb,

  raw_data jsonb,

  created_at timestamptz default now()
);