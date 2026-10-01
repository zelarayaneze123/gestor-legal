# Gestor Legal

App básica para registrar vencimientos judiciales.

## Archivos

- index.html
- styles.css
- app.js

## Funciones

- Cargar carátula.
- Seleccionar tipo de trámite.
- Ingresar fecha de notificación.
- Calcular automáticamente días hábiles.
- Guardar vencimientos en el navegador.
- Eliminar vencimientos.
- Conectar con Google Calendar.
- Crear un evento en el calendario principal de Google.

## Configurar Google Calendar

1. Entrá a Google Cloud Console.
2. Creá un proyecto.
3. Activá Google Calendar API.
4. Configurá la pantalla de consentimiento OAuth.
5. Creá un OAuth Client ID para una aplicación web.
6. Agregá el origen donde vas a ejecutar la app, por ejemplo:
   http://localhost:5500
7. Copiá el Client ID.
8. Abrí `app.js`.
9. Reemplazá:

   REEMPLAZAR_CON_TU_CLIENT_ID.apps.googleusercontent.com

   por tu Client ID real.

## Ejecutar

No conviene abrir `index.html` directamente con doble clic para OAuth.

Una forma sencilla es usar VS Code + Live Server.

También podés ejecutar un servidor local con Python:

python -m http.server 5500

Luego abrir:

http://localhost:5500

## Importante

El cálculo implementado considera como días hábiles únicamente lunes a viernes.
No contempla todavía feriados judiciales, feriados nacionales ni días inhábiles específicos de un tribunal.
