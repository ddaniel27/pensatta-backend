# Pensatta Backend

Documentacion de la aplicacion backend para Pensatta

## Tecnologias

- ExpressJS

- BcryptJS

- Cors

- Dotenv

- Express - Session

- Express - mySQL - Session

- mySQL

- Passport

- Passport - Local



## Estructura

La estructura del codigo se encuentra dispuesta de la siguiente forma

```
/
|- index.js
|- package.json
|- package-lock.json
|- .gitignore
|
|- /controllers
|   |- [endpoint].controller.js
|
|- /middlewares
|   |- [middleware].middleware.js
|
|- /routes
    |- router.js
```

En `/` se encuentran todos los archivos de configuracion global del proyecto, como `index.js` donde se importan los modulos como `express`, `mysql`, `express-session`, `cors` entre otros. En `index.js` tambien se configuran cosas como el puerto de la aplicacion y el prefijo de la API REST.



En `/controllers` se definen los controladores de cada endpoint. Tambien son definidos controladores usados por otros controladores, tales como `sqlQueries`.



En `/middlewares` se encuentran todos los archivos de procesado de peticion. En el estado actual solo se encuentra el middleware `auth`, el cual maneja las peticiones de usuario logueado y el rol de administrador.



En `/routes` esta el `router` de la aplicacion, el cual se encarga de crear los endpoints, gestionar los middlewares y controladores.



## Notas Importantes

- Esta branch es distinta a la branch de produccion ya que se rehizo la estructura de usuarios y roles.

- El backend se encuentra en una instancia de GoDaddy y para correr el codigo es necesario el uso de npx. [Este tutorial](https://leandrobarone.com.ar/blog/1/aplicacion-nodejs-en-godaddy-actualizado-2019/) me ayudo a montar el backend.

- Cada componente general tiene una pequeña descripcion de su funcionamiento en el codigo.


