# Seal Backend API

API REST con autenticacion JWT (access token + refresh token).

**Base URL:** `http://localhost:2050`

## Variables de entorno

| Variable | Requerida | Descripcion |
|---|---|---|
| `MONGODB_URI` | Si | URI de conexion a MongoDB Atlas |
| `PORT` | No | Puerto del servidor (default: `3000`) |
| `JWT_SECRET` | Si | Clave secreta para firmar los JWT |

## Autenticacion

Las rutas protegidas requieren el header:

```
Authorization: Bearer <accessToken>
```

El `accessToken` se obtiene al hacer register o login. Expira en **1 hora**. Cuando expire, usa el endpoint `/api/auth/refresh` para obtener uno nuevo sin volver a hacer login.

---

## Endpoints

### Health Check

```
GET /
```

**Respuesta exitosa** `200`

```json
{
  "status": "ok",
  "message": "Seal Backend API"
}
```

---

### Registro de usuario

```
POST /api/auth/register
```

Crea un nuevo usuario y devuelve los tokens de acceso.

**Headers**

| Header | Valor |
|---|---|
| `Content-Type` | `application/json` |

**Body**

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `name` | string | Si | Nombre del usuario |
| `email` | string | Si | Email (debe ser unico) |
| `phone` | string | Si | Telefono |
| `password` | string | Si | Contrasena en texto plano |

**Ejemplo de body**

```json
{
  "name": "Juan Perez",
  "email": "juan@example.com",
  "phone": "+521234567890",
  "password": "miPassword123"
}
```

**Respuesta exitosa** `201`

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "a1b2c3d4e5f6..."
}
```

**Errores**

| Codigo | Mensaje | Causa |
|---|---|---|
| `400` | `Email already registered.` | El email ya existe en la base de datos |
| `500` | `Error registering user` | Error interno del servidor |

---

### Login

```
POST /api/auth/login
```

Autentica un usuario existente y devuelve los tokens de acceso.

**Headers**

| Header | Valor |
|---|---|
| `Content-Type` | `application/json` |

**Body**

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `email` | string | Si | Email registrado |
| `password` | string | Si | Contrasena |

**Ejemplo de body**

```json
{
  "email": "juan@example.com",
  "password": "miPassword123"
}
```

**Respuesta exitosa** `200`

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "a1b2c3d4e5f6..."
}
```

**Errores**

| Codigo | Mensaje | Causa |
|---|---|---|
| `401` | `Invalid email or password.` | Email no encontrado o contrasena incorrecta |
| `500` | `Error logging in` | Error interno del servidor |

---

### Refresh Token

```
POST /api/auth/refresh
```

Genera un nuevo par de tokens usando un refresh token valido. El refresh token anterior se invalida (rotacion de tokens).

**Headers**

| Header | Valor |
|---|---|
| `Content-Type` | `application/json` |

**Body**

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `refreshToken` | string | Si | Refresh token obtenido en login o register |

**Ejemplo de body**

```json
{
  "refreshToken": "a1b2c3d4e5f6..."
}
```

**Respuesta exitosa** `200`

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "x7y8z9w0..."
}
```

**Errores**

| Codigo | Mensaje | Causa |
|---|---|---|
| `400` | `Refresh token is required.` | No se envio el refresh token en el body |
| `401` | `Invalid refresh token.` | El token no existe en la base de datos |
| `401` | `Refresh token expired.` | El token expiro (duracion: 7 dias) |
| `500` | `Error refreshing token` | Error interno del servidor |

---

### Logout

```
POST /api/auth/logout
```

Cierra la sesion eliminando los refresh tokens del usuario. Requiere autenticacion.

**Headers**

| Header | Valor |
|---|---|
| `Authorization` | `Bearer <accessToken>` |
| `Content-Type` | `application/json` |

**Body** (opcional)

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `refreshToken` | string | No | Si se envia, solo elimina ese refresh token. Si no se envia, elimina todos los refresh tokens del usuario (cierra todas las sesiones). |

**Ejemplo de body** (cerrar sesion actual)

```json
{
  "refreshToken": "a1b2c3d4e5f6..."
}
```

**Ejemplo sin body** (cerrar todas las sesiones)

```json
{}
```

**Respuesta exitosa** `200`

```json
{
  "message": "Logged out successfully."
}
```

**Errores**

| Codigo | Mensaje | Causa |
|---|---|---|
| `401` | `Access denied. No token provided.` | No se envio el header Authorization |
| `401` | `Invalid or expired token.` | El access token es invalido o expiro |
| `500` | `Error logging out` | Error interno del servidor |

---

### Listar usuarios

```
GET /api/users
```

Devuelve todos los usuarios registrados. Requiere autenticacion.

**Headers**

| Header | Valor |
|---|---|
| `Authorization` | `Bearer <accessToken>` |

**Respuesta exitosa** `200`

```json
[
  {
    "_id": "664f1a2b3c4d5e6f7a8b9c0d",
    "name": "Juan Perez",
    "email": "juan@example.com",
    "phone": "+521234567890",
    "password": "$2a$10$hashedpassword..."
  }
]
```

**Errores**

| Codigo | Mensaje | Causa |
|---|---|---|
| `401` | `Access denied. No token provided.` | No se envio el header Authorization |
| `401` | `Invalid or expired token.` | El access token es invalido o expiro |
| `500` | `Error fetching users` | Error interno del servidor |

---

### Obtener usuario por ID

```
GET /api/users/:id
```

Devuelve un usuario especifico por su ID. Requiere autenticacion.

**Headers**

| Header | Valor |
|---|---|
| `Authorization` | `Bearer <accessToken>` |

**Parametros de ruta**

| Parametro | Tipo | Descripcion |
|---|---|---|
| `id` | string | ID del usuario (MongoDB ObjectId) |

**Ejemplo**

```
GET /api/users/664f1a2b3c4d5e6f7a8b9c0d
```

**Respuesta exitosa** `200`

```json
{
  "_id": "664f1a2b3c4d5e6f7a8b9c0d",
  "name": "Juan Perez",
  "email": "juan@example.com",
  "phone": "+521234567890",
  "password": "$2a$10$hashedpassword..."
}
```

**Errores**

| Codigo | Mensaje | Causa |
|---|---|---|
| `401` | `Access denied. No token provided.` | No se envio el header Authorization |
| `401` | `Invalid or expired token.` | El access token es invalido o expiro |
| `404` | `User not found` | No existe un usuario con ese ID |
| `500` | `Error fetching user` | Error interno del servidor |

---

### Listar organizaciones

```
GET /api/organizations
```

Devuelve todas las organizaciones. Requiere autenticacion.

**Headers**

| Header | Valor |
|---|---|
| `Authorization` | `Bearer <accessToken>` |

**Respuesta exitosa** `200`

```json
[
  {
    "_id": "664f1a2b3c4d5e6f7a8b9c0d",
    "name": "Acme Corp",
    "slug": "acme-corp",
    "settings": {
      "theme_color": "#ffffff",
      "custom_domain": "acme.com"
    },
    "created_at": "2026-02-24T21:47:00.000Z"
  }
]
```

**Errores**

| Codigo | Mensaje | Causa |
|---|---|---|
| `401` | `Access denied. No token provided.` | No se envio el header Authorization |
| `401` | `Invalid or expired token.` | El access token es invalido o expiro |
| `500` | `Error fetching organizations` | Error interno del servidor |

---

### Obtener organizacion por ID

```
GET /api/organizations/:id
```

Devuelve una organizacion especifica por su ID. Requiere autenticacion.

**Headers**

| Header | Valor |
|---|---|
| `Authorization` | `Bearer <accessToken>` |

**Parametros de ruta**

| Parametro | Tipo | Descripcion |
|---|---|---|
| `id` | string | ID de la organizacion (MongoDB ObjectId) |

**Ejemplo**

```
GET /api/organizations/664f1a2b3c4d5e6f7a8b9c0d
```

**Respuesta exitosa** `200`

```json
{
  "_id": "664f1a2b3c4d5e6f7a8b9c0d",
  "name": "Acme Corp",
  "slug": "acme-corp",
  "settings": {
    "theme_color": "#ffffff",
    "custom_domain": "acme.com"
  },
  "created_at": "2026-02-24T21:47:00.000Z"
}
```

**Errores**

| Codigo | Mensaje | Causa |
|---|---|---|
| `401` | `Access denied. No token provided.` | No se envio el header Authorization |
| `401` | `Invalid or expired token.` | El access token es invalido o expiro |
| `404` | `Organization not found` | No existe una organizacion con ese ID |
| `500` | `Error fetching organization` | Error interno del servidor |

---

### Crear organizacion

```
POST /api/organizations
```

Crea una nueva organizacion. Si no se envia `slug`, se genera automaticamente a partir del `name` (lowercase, espacios reemplazados por guiones). Requiere autenticacion.

**Headers**

| Header | Valor |
|---|---|
| `Authorization` | `Bearer <accessToken>` |
| `Content-Type` | `application/json` |

**Body**

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `name` | string | Si | Nombre de la organizacion |
| `slug` | string | No | Slug unico (se autogenera si no se envia) |
| `settings` | object | No | Configuraciones de la organizacion |
| `settings.theme_color` | string | No | Color del tema (hex) |
| `settings.custom_domain` | string | No | Dominio personalizado |

**Ejemplo de body**

```json
{
  "name": "Acme Corp",
  "settings": {
    "theme_color": "#ffffff",
    "custom_domain": "acme.com"
  }
}
```

**Respuesta exitosa** `201`

```json
{
  "_id": "664f1a2b3c4d5e6f7a8b9c0d",
  "name": "Acme Corp",
  "slug": "acme-corp",
  "settings": {
    "theme_color": "#ffffff",
    "custom_domain": "acme.com"
  },
  "created_at": "2026-02-24T21:47:00.000Z"
}
```

**Errores**

| Codigo | Mensaje | Causa |
|---|---|---|
| `401` | `Access denied. No token provided.` | No se envio el header Authorization |
| `401` | `Invalid or expired token.` | El access token es invalido o expiro |
| `500` | `Error creating organization` | Error interno del servidor (ej. slug duplicado) |

---

### Actualizar organizacion

```
PUT /api/organizations/:id
```

Actualiza una organizacion existente y devuelve el documento actualizado. Requiere autenticacion.

**Headers**

| Header | Valor |
|---|---|
| `Authorization` | `Bearer <accessToken>` |
| `Content-Type` | `application/json` |

**Parametros de ruta**

| Parametro | Tipo | Descripcion |
|---|---|---|
| `id` | string | ID de la organizacion (MongoDB ObjectId) |

**Body**

Cualquier campo del modelo que se desee actualizar.

**Ejemplo de body**

```json
{
  "settings": {
    "theme_color": "#000000",
    "custom_domain": "new-acme.com"
  }
}
```

**Respuesta exitosa** `200`

```json
{
  "_id": "664f1a2b3c4d5e6f7a8b9c0d",
  "name": "Acme Corp",
  "slug": "acme-corp",
  "settings": {
    "theme_color": "#000000",
    "custom_domain": "new-acme.com"
  },
  "created_at": "2026-02-24T21:47:00.000Z"
}
```

**Errores**

| Codigo | Mensaje | Causa |
|---|---|---|
| `401` | `Access denied. No token provided.` | No se envio el header Authorization |
| `401` | `Invalid or expired token.` | El access token es invalido o expiro |
| `404` | `Organization not found` | No existe una organizacion con ese ID |
| `500` | `Error updating organization` | Error interno del servidor |

---

### Eliminar organizacion

```
DELETE /api/organizations/:id
```

Elimina una organizacion por su ID. Requiere autenticacion.

**Headers**

| Header | Valor |
|---|---|
| `Authorization` | `Bearer <accessToken>` |

**Parametros de ruta**

| Parametro | Tipo | Descripcion |
|---|---|---|
| `id` | string | ID de la organizacion (MongoDB ObjectId) |

**Ejemplo**

```
DELETE /api/organizations/664f1a2b3c4d5e6f7a8b9c0d
```

**Respuesta exitosa** `200`

```json
{
  "message": "Organization deleted successfully"
}
```

**Errores**

| Codigo | Mensaje | Causa |
|---|---|---|
| `401` | `Access denied. No token provided.` | No se envio el header Authorization |
| `401` | `Invalid or expired token.` | El access token es invalido o expiro |
| `404` | `Organization not found` | No existe una organizacion con ese ID |
| `500` | `Error deleting organization` | Error interno del servidor |

---

## Colecciones en MongoDB

| Coleccion | Descripcion |
|---|---|
| `users` | Usuarios registrados (`name`, `email`, `phone`, `password`) |
| `tokens` | Refresh tokens activos (`userId`, `refreshToken`, `expiresAt`) con TTL index que los elimina automaticamente al expirar |
| `organizations` | Organizaciones (`name`, `slug`, `settings`, `created_at`) con indice unico en `slug` |

## Flujo de autenticacion

1. **Register** o **Login** para obtener `accessToken` + `refreshToken`
2. Usar el `accessToken` en el header `Authorization: Bearer <token>` en cada request protegido
3. Cuando el `accessToken` expire (1h), llamar a `/api/auth/refresh` con el `refreshToken` para obtener nuevos tokens
4. El `refreshToken` expira en 7 dias. Si expira, el usuario debe hacer login de nuevo
5. Al hacer **logout**, los refresh tokens se eliminan de la base de datos
