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

### Listar cotizaciones

```
GET /api/quotations
```

Devuelve las cotizaciones de la organizacion del usuario autenticado, con paginacion y filtro por status. Requiere autenticacion.

**Headers**

| Header | Valor |
|---|---|
| `Authorization` | `Bearer <accessToken>` |

**Query params**

| Parametro | Tipo | Requerido | Default | Descripcion |
|---|---|---|---|---|
| `status` | string | No | — | Filtrar por status: `borrador`, `pendiente`, `aceptada`, `rechazada` |
| `page` | number | No | `1` | Numero de pagina |
| `limit` | number | No | `20` | Cantidad de resultados por pagina (max 100) |

**Ejemplo**

```
GET /api/quotations?status=pendiente&page=1&limit=10
```

**Respuesta exitosa** `200`

```json
{
  "data": [
    {
      "_id": "683f1a2b3c4d5e6f7a8b9c01",
      "organization_id": "664f1a2b3c4d5e6f7a8b9c0a",
      "created_by": "664f1a2b3c4d5e6f7a8b9c0d",
      "number": "COT-2025-001",
      "client": "Constructora del Norte S.A.",
      "date": "2025-03-01T00:00:00.000Z",
      "valid_until": "2025-04-01T00:00:00.000Z",
      "status": "pendiente",
      "items": [
        {
          "name": "Ventana corrediza 1.5m x 1.2m",
          "description": "Aluminio natural, vidrio claro 6mm",
          "quantity": 12,
          "unit_price": 2850.0,
          "discount": 10
        }
      ],
      "general_discount": 5,
      "tax_rate": 16,
      "notes": "Entrega estimada: 3 semanas",
      "created_at": "2025-03-01T10:30:00.000Z",
      "updated_at": "2025-03-01T10:30:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

**Errores**

| Codigo | Mensaje | Causa |
|---|---|---|
| `401` | `Access denied. No token provided.` | No se envio el header Authorization |
| `401` | `Invalid or expired token.` | El access token es invalido o expiro |
| `403` | `User is not assigned to an organization.` | El usuario no tiene organizacion asignada |
| `500` | `Error fetching quotations` | Error interno del servidor |

---

### Obtener cotizacion por ID

```
GET /api/quotations/:id
```

Devuelve una cotizacion especifica. Solo devuelve cotizaciones de la organizacion del usuario. Requiere autenticacion.

**Headers**

| Header | Valor |
|---|---|
| `Authorization` | `Bearer <accessToken>` |

**Parametros de ruta**

| Parametro | Tipo | Descripcion |
|---|---|---|
| `id` | string | ID de la cotizacion (MongoDB ObjectId) |

**Ejemplo**

```
GET /api/quotations/683f1a2b3c4d5e6f7a8b9c01
```

**Respuesta exitosa** `200`

```json
{
  "_id": "683f1a2b3c4d5e6f7a8b9c01",
  "organization_id": "664f1a2b3c4d5e6f7a8b9c0a",
  "created_by": "664f1a2b3c4d5e6f7a8b9c0d",
  "number": "COT-2025-001",
  "client": "Constructora del Norte S.A.",
  "date": "2025-03-01T00:00:00.000Z",
  "valid_until": "2025-04-01T00:00:00.000Z",
  "status": "pendiente",
  "items": [
    {
      "name": "Ventana corrediza 1.5m x 1.2m",
      "description": "Aluminio natural, vidrio claro 6mm",
      "quantity": 12,
      "unit_price": 2850.0,
      "discount": 10
    }
  ],
  "general_discount": 5,
  "tax_rate": 16,
  "notes": "Entrega estimada: 3 semanas",
  "created_at": "2025-03-01T10:30:00.000Z",
  "updated_at": "2025-03-01T10:30:00.000Z"
}
```

**Errores**

| Codigo | Mensaje | Causa |
|---|---|---|
| `401` | `Access denied. No token provided.` | No se envio el header Authorization |
| `401` | `Invalid or expired token.` | El access token es invalido o expiro |
| `403` | `User is not assigned to an organization.` | El usuario no tiene organizacion asignada |
| `404` | `Quotation not found.` | No existe o no pertenece a la organizacion del usuario |
| `500` | `Error fetching quotation` | Error interno del servidor |

---

### Obtener cotizacion por ID (publico)

```
GET /api/quotations/public/:id
```

Obtiene una cotizacion por ID. **No requiere autenticacion.** Cualquier persona con el ID puede ver la cotizacion (por ejemplo, mediante un enlace compartido).

**Parametros de ruta**

| Parametro | Tipo | Descripcion |
|---|---|---|
| `id` | string | ID de la cotizacion (MongoDB ObjectId) |

**Ejemplo**

```
GET /api/quotations/public/683f1a2b3c4d5e6f7a8b9c01
```

**Respuesta exitosa** `200` — Mismo cuerpo JSON que `GET /api/quotations/:id`.

**Errores**

| Codigo | Mensaje | Causa |
|---|---|---|
| `400` | `Invalid quotation ID.` | El `id` no es un ObjectId valido |
| `404` | `Quotation not found.` | No existe una cotizacion con ese ID |
| `500` | `Error fetching quotation` | Error interno del servidor |

---

### Crear cotizacion

```
POST /api/quotations
```

Crea una nueva cotizacion. El `number` se genera automaticamente con formato `COT-{year}-{sequential}` (ej. `COT-2025-001`). Los campos `organization_id` y `created_by` se inyectan desde el token JWT. Requiere autenticacion.

**Headers**

| Header | Valor |
|---|---|
| `Authorization` | `Bearer <accessToken>` |
| `Content-Type` | `application/json` |

**Body**

| Campo | Tipo | Requerido | Default | Descripcion |
|---|---|---|---|---|
| `client` | string | Si | — | Nombre del cliente |
| `date` | string (ISO 8601) | Si | — | Fecha de la cotizacion |
| `items` | array | Si | — | Lista de articulos (minimo 1) |
| `items[].name` | string | Si | — | Nombre del articulo |
| `items[].description` | string | No | `""` | Descripcion del articulo |
| `items[].quantity` | number | Si | — | Cantidad (minimo 1) |
| `items[].unit_price` | number | Si | — | Precio unitario (minimo 0) |
| `items[].discount` | number | No | `0` | Descuento por articulo en porcentaje (0-100) |
| `tax_rate` | number | No | `16` | Porcentaje de impuesto (ej. IVA) |
| `valid_until` | string (ISO 8601) | No | `null` | Fecha de vencimiento |
| `general_discount` | number | No | `0` | Descuento general en porcentaje (0-100) |
| `notes` | string | No | `null` | Notas u observaciones |

**Ejemplo de body**

```json
{
  "client": "Constructora del Norte S.A.",
  "date": "2025-03-01T00:00:00.000Z",
  "items": [
    {
      "name": "Ventana corrediza 1.5m x 1.2m",
      "description": "Aluminio natural, vidrio claro 6mm",
      "quantity": 12,
      "unit_price": 2850.0,
      "discount": 10
    },
    {
      "name": "Puerta abatible 0.9m x 2.1m",
      "description": "Aluminio blanco, vidrio templado 6mm",
      "quantity": 4,
      "unit_price": 4200.0
    }
  ],
  "tax_rate": 16,
  "valid_until": "2025-04-01T00:00:00.000Z",
  "general_discount": 5,
  "notes": "Entrega estimada: 3 semanas"
}
```

**Respuesta exitosa** `201`

```json
{
  "_id": "683f1a2b3c4d5e6f7a8b9c01",
  "organization_id": "664f1a2b3c4d5e6f7a8b9c0a",
  "created_by": "664f1a2b3c4d5e6f7a8b9c0d",
  "number": "COT-2025-001",
  "client": "Constructora del Norte S.A.",
  "date": "2025-03-01T00:00:00.000Z",
  "valid_until": "2025-04-01T00:00:00.000Z",
  "status": "borrador",
  "items": [
    {
      "name": "Ventana corrediza 1.5m x 1.2m",
      "description": "Aluminio natural, vidrio claro 6mm",
      "quantity": 12,
      "unit_price": 2850.0,
      "discount": 10
    },
    {
      "name": "Puerta abatible 0.9m x 2.1m",
      "description": "Aluminio blanco, vidrio templado 6mm",
      "quantity": 4,
      "unit_price": 4200.0,
      "discount": 0
    }
  ],
  "general_discount": 5,
  "tax_rate": 16,
  "notes": "Entrega estimada: 3 semanas",
  "created_at": "2025-03-01T10:30:00.000Z",
  "updated_at": "2025-03-01T10:30:00.000Z"
}
```

**Errores**

| Codigo | Mensaje | Causa |
|---|---|---|
| `400` | `client, date, and at least one item are required.` | Faltan campos obligatorios |
| `401` | `Access denied. No token provided.` | No se envio el header Authorization |
| `401` | `Invalid or expired token.` | El access token es invalido o expiro |
| `403` | `User is not assigned to an organization.` | El usuario no tiene organizacion asignada |
| `500` | `Error creating quotation` | Error interno del servidor |

---

### Actualizar cotizacion

```
PUT /api/quotations/:id
```

Actualiza una cotizacion existente. Solo se actualizan los campos enviados en el body (actualizacion parcial). Requiere autenticacion.

**Headers**

| Header | Valor |
|---|---|
| `Authorization` | `Bearer <accessToken>` |
| `Content-Type` | `application/json` |

**Parametros de ruta**

| Parametro | Tipo | Descripcion |
|---|---|---|
| `id` | string | ID de la cotizacion (MongoDB ObjectId) |

**Body**

Cualquier combinacion de los siguientes campos:

| Campo | Tipo | Descripcion |
|---|---|---|
| `client` | string | Nombre del cliente |
| `date` | string (ISO 8601) | Fecha de la cotizacion |
| `items` | array | Lista de articulos (reemplaza todos los items) |
| `tax_rate` | number | Porcentaje de impuesto |
| `valid_until` | string / null | Fecha de vencimiento |
| `general_discount` | number | Descuento general (0-100) |
| `notes` | string / null | Notas u observaciones |
| `status` | string | `borrador`, `pendiente`, `aceptada`, `rechazada` |

**Ejemplo de body**

```json
{
  "client": "Constructora del Sur S.A.",
  "general_discount": 10,
  "notes": "Entrega estimada: 2 semanas"
}
```

**Respuesta exitosa** `200`

Devuelve el documento actualizado completo.

**Errores**

| Codigo | Mensaje | Causa |
|---|---|---|
| `400` | `Invalid status. Must be one of: borrador, pendiente, aceptada, rechazada` | Se envio un status invalido |
| `401` | `Access denied. No token provided.` | No se envio el header Authorization |
| `401` | `Invalid or expired token.` | El access token es invalido o expiro |
| `403` | `User is not assigned to an organization.` | El usuario no tiene organizacion asignada |
| `404` | `Quotation not found.` | No existe o no pertenece a la organizacion del usuario |
| `500` | `Error updating quotation` | Error interno del servidor |

---

### Cambiar status de cotizacion

```
PATCH /api/quotations/:id/status
```

Cambia unicamente el status de una cotizacion. Requiere autenticacion.

**Headers**

| Header | Valor |
|---|---|
| `Authorization` | `Bearer <accessToken>` |
| `Content-Type` | `application/json` |

**Parametros de ruta**

| Parametro | Tipo | Descripcion |
|---|---|---|
| `id` | string | ID de la cotizacion (MongoDB ObjectId) |

**Body**

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `status` | string | Si | Nuevo status: `borrador`, `pendiente`, `aceptada`, `rechazada` |

**Ejemplo de body**

```json
{
  "status": "aceptada"
}
```

**Respuesta exitosa** `200`

Devuelve el documento actualizado completo.

**Errores**

| Codigo | Mensaje | Causa |
|---|---|---|
| `400` | `Invalid status. Must be one of: borrador, pendiente, aceptada, rechazada` | Se envio un status invalido o no se envio |
| `401` | `Access denied. No token provided.` | No se envio el header Authorization |
| `401` | `Invalid or expired token.` | El access token es invalido o expiro |
| `403` | `User is not assigned to an organization.` | El usuario no tiene organizacion asignada |
| `404` | `Quotation not found.` | No existe o no pertenece a la organizacion del usuario |
| `500` | `Error updating quotation status` | Error interno del servidor |

---

### Eliminar cotizacion

```
DELETE /api/quotations/:id
```

Elimina una cotizacion por su ID. Solo puede eliminar cotizaciones de su organizacion. Requiere autenticacion.

**Headers**

| Header | Valor |
|---|---|
| `Authorization` | `Bearer <accessToken>` |

**Parametros de ruta**

| Parametro | Tipo | Descripcion |
|---|---|---|
| `id` | string | ID de la cotizacion (MongoDB ObjectId) |

**Ejemplo**

```
DELETE /api/quotations/683f1a2b3c4d5e6f7a8b9c01
```

**Respuesta exitosa** `200`

```json
{
  "message": "Quotation deleted successfully."
}
```

**Errores**

| Codigo | Mensaje | Causa |
|---|---|---|
| `401` | `Access denied. No token provided.` | No se envio el header Authorization |
| `401` | `Invalid or expired token.` | El access token es invalido o expiro |
| `403` | `User is not assigned to an organization.` | El usuario no tiene organizacion asignada |
| `404` | `Quotation not found.` | No existe o no pertenece a la organizacion del usuario |
| `500` | `Error deleting quotation` | Error interno del servidor |

---

## Colecciones en MongoDB

| Coleccion | Descripcion |
|---|---|
| `users` | Usuarios registrados (`name`, `email`, `phone`, `password`) |
| `tokens` | Refresh tokens activos (`userId`, `refreshToken`, `expiresAt`) con TTL index que los elimina automaticamente al expirar |
| `organizations` | Organizaciones (`name`, `slug`, `settings`, `created_at`) con indice unico en `slug` |
| `quotations` | Cotizaciones (`number`, `client`, `date`, `status`, `items`, `tax_rate`, etc.) con indices compuestos en `organization_id` + `number` (unique), `organization_id` + `status`, y `organization_id` + `created_at` |

## Flujo de autenticacion

1. **Register** o **Login** para obtener `accessToken` + `refreshToken`
2. Usar el `accessToken` en el header `Authorization: Bearer <token>` en cada request protegido
3. Cuando el `accessToken` expire (1h), llamar a `/api/auth/refresh` con el `refreshToken` para obtener nuevos tokens
4. El `refreshToken` expira en 7 dias. Si expira, el usuario debe hacer login de nuevo
5. Al hacer **logout**, los refresh tokens se eliminan de la base de datos
