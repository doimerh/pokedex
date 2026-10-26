# PokeDex en Deno Deploy

Despliegue de la aplicación **PokeDex** (hecha en Angular) en una nube pública, para Pueblo Paleta Inc.

- **Autor:** Doimer Herrera (usuario de GitHub: `doimerh`)
- **Nube usada:** Deno Deploy (https://console.deno.com)
- **Aplicación en línea:** https://pokedex.doimerh.deno.net
- **Calificación en securityheaders.com:** A+

El proceso de despliegue está explicado en [Despliegue.md](Despliegue.md).

## ¿Por qué Deno Deploy?

Era una de las opciones permitidas y me pareció la más sencilla: tiene plan gratuito (me registré con GitHub, sin pagar), se conecta directo con GitHub, da HTTPS automático y permite correr un pequeño servidor propio (lo necesité para los encabezados de seguridad).

## Cómo crear la cuenta, paso a paso

Deno Deploy no tiene registro con correo y contraseña. Se entra con una cuenta de GitHub o de Google, así que primero hay que tener cuenta de GitHub. Yo usé la mía (`doimerh`).

**1. Abrir la consola.** Entrar a https://console.deno.com. Aparece la pantalla "Iniciar sesión". Si no hay cuenta, Deno la crea sola la primera vez.

> En Google Chrome la verificación de Cloudflare falló ("La verificación falló") y no me dejó entrar con ningún botón. Lo solucioné entrando desde **Microsoft Edge**.

**2. Iniciar sesión con GitHub.** Esperar a que la verificación de Cloudflare quede en verde y hacer clic en "Iniciar sesión con GitHub".

**3. Autorizar a Deno Deploy.** GitHub muestra una pantalla de permisos. En este paso solo pide verificar mi identidad y ver mi correo. Hice clic en **Authorize**.

**4. Crear la organización.** Deno Deploy agrupa las aplicaciones dentro de una organización. Usé `doimerh` como nombre y como *slug* (el identificador que queda en la dirección de la app).

**5. Panel principal.** Al terminar aparece el panel de la organización (`console.deno.com/doimerh`) con el mensaje "No applications yet" y el botón **+ New app**. El aviso azul de "organización no verificada" solo indica límites de uso básicos; no hizo falta verificarla.

**6. Conectar GitHub con Deno.** Al crear una app, el selector de repositorios decía "No results found", porque Deno todavía no podía ver mis repositorios. Hice clic en **+ Add a GitHub account**, elegí la opción **Only select repositories** y seleccioné solo el repositorio `pokedex`, para que Deno no vea el resto de mis proyectos. Después de instalar, el selector ya mostraba `doimerh/pokedex`.

## Resultado

Cuenta de Deno Deploy creada con GitHub, organización `doimerh` y Deno con acceso únicamente al repositorio `pokedex`. Lo que sigue (crear la app, compilar y publicar) está en [Despliegue.md](Despliegue.md).
