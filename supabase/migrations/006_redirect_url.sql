-- Custom URL redirect support: when set, scanning the QR goes to this URL instead of the profile page
alter table loofabag_loofas add column if not exists redirect_url text;
alter table qr_redirects add column if not exists redirect_url text;
