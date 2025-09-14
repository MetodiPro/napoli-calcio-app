# 🔑 Configurazione API - Guida Rapida

## ⚡ Setup Veloce (5 minuti)

### 1. News API
1. Vai su: https://newsapi.org
2. Clicca "Get API Key"
3. Registrati con email
4. Copia la API Key
5. Incolla in `js/app.js` alla riga 25:
   ```javascript
   apiKey: 'LA_TUA_API_KEY_QUI'
   ```

### 2. Football Data API
1. Vai su: https://www.football-data.org
2. Clicca "Register"
3. Compila il form (gratis)
4. Vai su "API" > "Your API Token"
5. Copia il token
6. Incolla in `js/app.js` alla riga 16:
   ```javascript
   'X-Auth-Token': 'IL_TUO_TOKEN_QUI'
   ```

## 🚀 Test Immediato

Dopo aver configurato le API:
1. Apri `index.html` nel browser
2. Dovresti vedere dati reali!
3. Se vedi errori, controlla la console (F12)

## 📍 Link Diretti

- **News API**: https://newsapi.org/register
- **Football Data**: https://www.football-data.org/client/register
- **Console Browser**: Premi F12 per vedere errori

## ⚠️ Note Importanti

- **Gratuito**: Entrambe le API sono gratuite
- **Limiti**: News API (1000/mese), Football Data (100/giorno)
- **Tempo**: La registrazione richiede 2-3 minuti ciascuna
- **Privacy**: Le chiavi rimangono sul tuo computer

## 🆘 Problemi?

- **403 Error**: API key non valida o scaduta
- **429 Error**: Troppi requests, aspetta un po'
- **CORS Error**: Usa un server locale o hosting online
- **No data**: Controlla connessione internet

---

✅ **Una volta configurato, avrai dati reali sul Napoli 24/7!**