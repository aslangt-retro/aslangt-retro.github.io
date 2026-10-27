# Aslan GT – kotisivu

Suomenkielinen yhden sivun GitHub Pages -sivusto: esittely, YouTube-tilaajatavoite, kolme uusinta videota ja yhteystiedot.

## Käyttöönotto GitHubissa

1. Siirrä tämän paketin **sisältö** (myös piilotettu `.github`-kansio) repositoryn `aslangt-retro/aslangt-retro.github.io` päähaaran juureen. Älä lisää ylimääräistä `aslangt-site`-kansiotasoa.
2. Avaa GitHubissa **Settings → Pages**. Valitse **Build and deployment → Source: Deploy from a branch**, **Branch: main**, kansio **/(root)**. Tallenna.
3. Avaa **Settings → Secrets and variables → Actions → New repository secret**. Nimeä salaisuus `YOUTUBE_API_KEY` ja syötä Google Cloudissa luomasi uusi YouTube Data API v3 -avain **GitHubiin, ei lähdekoodiin**.
4. Avaa **Actions → Päivitä YouTube-tilastot → Run workflow**, jotta ensimmäiset luvut ja videot haetaan saman tien.
5. Tarkista, että `data/channel.json` päivittyi ja että sivusto näkyy osoitteessa `https://aslangt-retro.github.io`.

Sen jälkeen GitHub Actions yrittää päivittää tiedot tunneittain. Ajastetut ajot voivat toisinaan viivästyä, ja GitHub voi poistaa pitkään käyttämättömien julkisten repositorioiden ajastetut ajot käytöstä.

## Turvallisuus

- Älä tallenna API-avainta lähdekoodiin, `data/channel.json`-tiedostoon tai README:hen.
- API-avaimen käyttö on rajattava Google Cloudissa YouTube Data API v3:een.
- Sivuston kävijät lukevat vain julkista `data/channel.json`-tiedostoa.
- YouTube API:n julkiset tilaajamäärät pyöristetään 1 000 tilaajan jälkeen YouTuben sääntöjen mukaisesti.

## Oma verkkotunnus

Liitä `aslangt.fi` vasta sen jälkeen, kun olet testannut sivuston GitHubin oletusosoitteessa. Lisää tarvittaessa GitHub Pagesin oma verkkotunnusasetuksen kautta `CNAME`, ja muuta vain verkkosivun DNS-tietueita Zonerissa. **Älä muuta toimivan sähköpostin MX-, SPF-, DKIM- tai DMARC-tietueita.**

## Paikallinen esikatselu

Voit käynnistää yksinkertaisen HTTP-palvelimen projektikansiossa, esimerkiksi `python3 -m http.server 8000`, ja avata `http://localhost:8000`.
