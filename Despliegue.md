# Despliegue de PokeDex en Deno Deploy

Aquí explico cómo desplegué la aplicación PokeDex en Deno Deploy, con los comandos y configuraciones que usé. La creación de la cuenta está en [README.md](README.md).

- **Aplicación en línea:** https://pokedex.doimerh.deno.net
- **Repositorio:** https://github.com/doimerh/pokedex
- **Sistema usado:** Windows con PowerShell
- **Tecnología de la app:** Angular (se compila a archivos estáticos)

## 1. Herramientas que instalé

- **Node.js** versión LTS (v24.22.1), descargado de https://nodejs.org.
- **Git** y **GitHub CLI** (esta última sirve para iniciar sesión en GitHub desde la terminal):

```powershell
winget install --id Git.Git -e --source winget
winget install --id GitHub.cli -e --source winget
```

Después de instalar hay que cerrar y abrir PowerShell, y comprobar con `node -v` y `git --version`.

PowerShell bloqueó `npm` con un error de "ejecución de scripts deshabilitada". Lo arreglé permitiendo scripts locales solo para mi usuario:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

## 2. Descargar el código y probarlo

```powershell
git clone https://github.com/rcuello/ac4dem1a.git
cd ac4dem1a/sistemas-distribuidos/poke-dex-lab/source/pokedex-angular
npm install --ignore-scripts
npx ng serve
```

La app abrió bien en `http://localhost:4200`. El proyecto Angular está en la carpeta `source/pokedex-angular` (ahí están `package.json` y `angular.json`).

Usé `--ignore-scripts` porque el proyecto trae un paso llamado *husky* que falla al instalar (la carpeta no es un repositorio Git por sí sola) y solo sirve para el desarrollo, no para desplegar.

## 3. Crear mi repositorio `pokedex`

Creé en GitHub el repositorio `pokedex` (público, sin README ni licencia). Para que tuviera solo la PokeDex, copié el proyecto a una carpeta nueva, sin `node_modules`:

```powershell
robocopy "C:\Users\Jacob\ac4dem1a\sistemas-distribuidos\poke-dex-lab\source\pokedex-angular" "C:\Users\Jacob\pokedex" /E /XD node_modules
cd ~\pokedex
```

El primer `git push` falló con el error *"Password authentication is not supported"*, porque GitHub ya no acepta la contraseña para Git. Lo resolví iniciando sesión con GitHub CLI (respondí GitHub.com, HTTPS, Yes y "Login with a web browser", y puse el código que muestra en https://github.com/login/device):

```powershell
gh auth login
```

Luego subí el código:

```powershell
git init
git add .
git commit -m "Primer commit: app PokeDex Angular"
git branch -M main
git remote add origin https://github.com/doimerh/pokedex.git
git push -u origin main
```

## 4. Compilar para producción

Angular no se publica tal cual: se compila y el resultado son archivos estáticos (HTML, CSS y JavaScript).

```powershell
npm install --ignore-scripts
npx ng build --configuration production
```

El resultado queda en la carpeta `dist/pokedex-angular`.

## 5. Crear la aplicación en Deno Deploy

En https://console.deno.com hice clic en **+ New app**, elegí el repositorio `doimerh/pokedex` y le puse el nombre `pokedex` (por eso la dirección es `pokedex.doimerh.deno.net`). Deno no reconoció el proyecto como Angular ("No Preset"), así que en **Edit app config** configuré todo a mano:

| Campo | Valor |
|---|---|
| Install command | `npm install --ignore-scripts` |
| Build command | `npx ng build --configuration production` |
| Runtime Configuration | Static Site |
| Static Directory | `dist/pokedex-angular` |
| Single Page App mode | Activado |

Activé *Single Page App mode* porque en Angular las páginas internas (como "Acerca de") las maneja el propio JavaScript; con esta opción, cualquier ruta que no sea un archivo devuelve el `index.html` y no un error 404.

Al hacer clic en **Create App**, Deno corrió cinco etapas (Queue, Prepare, Install, Build y Deploy) y todas quedaron en verde. Desde ese momento, cada `git push` a la rama `main` despliega la app de nuevo automáticamente.

> Por error volví a hacer clic en *Create App* y se creó una segunda app (`pokedex-95`) con la configuración por defecto, cuyo build fallaba. La borré desde **Settings** y dejé solo `pokedex`.

## 6. Problema: no se veían las imágenes de los Pokémon

La página cargaba, pero los recuadros salían vacíos. Para buscar la causa abrí las herramientas del navegador (Ctrl + Shift + I), pestaña **Network**, y vi que el archivo `pokemon-green.png` llegaba como `text/html`, o sea que el servidor devolvía la página de inicio en vez de la imagen. La app pedía `/pokedex-angular/assets/images/...`, con un `/pokedex-angular/` de más, pero la imagen está en `/assets/images/...`.

La causa: el autor original publicó la app en GitHub Pages y dejó esa ruta escrita en `src/environments/environment.prod.ts`. Cambié la línea

```ts
imagesPath: '/pokedex-angular/assets/images',
```

por

```ts
imagesPath: '/assets/images',
```

y subí el cambio con `git add .`, `git commit` y `git push`. Deno compiló de nuevo y las imágenes aparecieron.


## 7. Seguridad: encabezados HTTP

Escaneé la app en https://securityheaders.com y la calificación fue **F**. Faltaban seis encabezados: Strict-Transport-Security, Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy y Permissions-Policy.


El modo *Static Site* de Deno solo entrega archivos y no permite agregar encabezados propios. Por eso agregué un pequeño servidor, `server.ts`, en la raíz del repositorio. Este servidor entrega los archivos de `dist/pokedex-angular`, devuelve el `index.html` para las rutas de Angular, responde 404 si un archivo no existe y **agrega los encabezados de seguridad a todas las respuestas**.

| Encabezado | Para qué sirve |
|---|---|
| `Strict-Transport-Security` | Obliga al navegador a usar siempre HTTPS |
| `Content-Security-Policy` | Define desde dónde se pueden cargar scripts, estilos, imágenes y datos; protege contra XSS. La app solo puede conectarse a sí misma y a la PokéAPI (`pokeapi.co`), de donde saca los datos |
| `X-Frame-Options: DENY` | Impide que otra página muestre mi app dentro de un `iframe` |
| `X-Content-Type-Options: nosniff` | Evita que el navegador adivine el tipo de un archivo |
| `Referrer-Policy` | Limita la información que se envía al navegar a otros sitios |
| `Permissions-Policy` | Desactiva funciones del navegador que la app no usa (cámara, micrófono, ubicación) |
| `Cross-Origin-Opener-Policy` y `Cross-Origin-Resource-Policy` | Dos encabezados extra que aíslan mi app de otros sitios |

Para usar el servidor cambié la configuración de la app en Deno (**Settings → App Configuration → Edit**): **Runtime Configuration = Dynamic App** y **Entrypoint = `server.ts`**. Dejé igual el Install command y el Build command. Subí el archivo con `git add .`, `git commit` y `git push`, y lancé un build nuevo con **Deploy Default Branch**.

## 8. Resultado

Volví a escanear la app y la calificación subió de **F a A+**, con los seis encabezados en verde. Además comprobé que la app siguió funcionando con los encabezados activados: carga normal y se ven las imágenes de los Pokémon.

