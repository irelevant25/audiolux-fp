# Kontaktný Formulár - Dokumentácia

## Prehľad

Kontaktný formulár je implementovaný pomocou PHP s bezpečnostnými opatreniami na ochranu pred spam botmi a útokami.

## Súbory

1. **api.php** - Spracováva odosielanie emailov
2. **get-token.php** - Generuje CSRF tokeny pre ochranu formulára
3. **index.html** - Obsahuje kontaktný formulár
4. **script.js** - JavaScript logika pre odosielanie formulára
5. **styles.css** - Štýly pre formulár a správy

## Konfigurácia

### Nastavenie emailovej adresy

V súbore `api.php` (riadok 69):
```php
$to = "lmadro@proman.sk";
```

### Odosielacia adresa

V súbore `api.php` (riadky 83-84):
```php
$headers = "From: noreply@proman.sk\r\n";
$headers .= "Reply-To: noreply@proman.sk\r\n";
```

## Bezpečnostné funkcie

1. **CSRF ochrana** - Každý formulár má jedinečný token
2. **Rate limiting** - Maximálne 1 odoslanie každých 10 sekúnd
3. **Honeypot pole** - Skryté pole "website" na zachytenie botov
4. **Input validácia** - Sanitizácia a validácia všetkých vstupov
5. **Header injection ochrana** - Kontrola nebezpečných znakov
6. **Limit dĺžky** - Obmedzenie dĺžky vstupov

## Polia formulára

- **Meno** (povinné) - max 100 znakov
- **Email** (povinné) - validovaný formát
- **Telefón** (voliteľné)
- **Predmet** (povinné) - max 200 znakov
- **Správa** (povinná) - max 5000 znakov

## Požiadavky servera

1. PHP 7.0+ s povolenou funkciou `mail()`
2. Sessions musia byť povolené
3. SMTP server musí byť nakonfigurovaný na serveri

## Testovanie

Pre testovanie funkcionality:
1. Otvorte stránku v prehliadači
2. Vyplňte všetky povinné polia
3. Kliknite na "Odoslať správu"
4. Skontrolujte email na adrese `lmadro@proman.sk`

## Riešenie problémov

### Email sa neodosiela

1. Skontrolujte, či je funkcia `mail()` povolená v PHP
2. Skontrolujte SMTP konfiguráciu servera
3. Skontrolujte error logy PHP: `/var/log/php-errors.log`

### CSRF token chyby

1. Skontrolujte, či sú PHP sessions povolené
2. Vyčistite cookies prehliadača
3. Obnovte stránku

## Produkčné nasadenie

Pre produkčné nasadenie odporúčame:

1. **Použiť SMTP službu** ako SendGrid, Mailgun alebo AWS SES namiesto PHP `mail()` funkcie
2. **Pridať reCAPTCHA** pre extra ochranu proti botom
3. **Logovať všetky pokusy** o odoslanie emailov
4. **Nastaviť email notifikácie** pri zlyhaní odosielania
