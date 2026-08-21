# ARPSIS API Map (generated from HAR fixtures)

Generated: 2026-08-21T21:48:31.938Z

Total unique endpoints: 82

| Method | Host | Path | Sources |
|--------|------|------|---------|
| GET | identity.citytech.ec | `/.well-known/openid-configuration` | project.citytech.ec.har, project.citytech.ec_v2.har, project.citytech.ec_v3.har |
| GET | identity.citytech.ec | `/.well-known/openid-configuration/jwks` | project.citytech.ec.har, project.citytech.ec_v3.har |
| GET | identity.citytech.ec | `/connect/userinfo` | project.citytech.ec.har, project.citytech.ec_v3.har |
| GET | project.citytech.ec | `/api/v1/Activities` | project.citytech.ec.har |
| POST | project.citytech.ec | `/api/v1/Activities` | project.citytech.ec.har, project.citytech.ec_v2.har |
| GET | project.citytech.ec | `/api/v1/Activities/{id}` | project.citytech.ec.har |
| PUT | project.citytech.ec | `/api/v1/Activities/{id}` | project.citytech.ec.har |
| GET | project.citytech.ec | `/api/v1/Activities/project/{id}/list` | project.citytech.ec.har, project.citytech.ec_v2.har |
| PUT | project.citytech.ec | `/api/v1/Activities/Update2/{id}` | project.citytech.ec.har |
| GET | project.citytech.ec | `/api/v1/Activities/User` | project.citytech.ec.har, project.citytech.ec_v3.har |
| GET | project.citytech.ec | `/api/v1/ActivitiesElapsed/Activities/Developer` | project.citytech.ec.har, project.citytech.ec_v3.har |
| GET | project.citytech.ec | `/api/v1/ActivitiesElapsed/Summary` | project.citytech.ec.har, project.citytech.ec_v3.har |
| GET | project.citytech.ec | `/api/v1/ActivitiesElapsed/SummaryParameters` | project.citytech.ec.har, project.citytech.ec_v3.har |
| POST | project.citytech.ec | `/api/v1/ActivityGroups` | project.citytech.ec.har |
| DELETE | project.citytech.ec | `/api/v1/ActivityGroups/{id}` | project.citytech.ec.har |
| GET | project.citytech.ec | `/api/v1/ActivityGroups/{id}/list` | project.citytech.ec.har |
| GET | project.citytech.ec | `/api/v1/ActivityGroups/{id}/list/functional/{id}` | project.citytech.ec.har, project.citytech.ec_v2.har |
| GET | project.citytech.ec | `/api/v1/activityStatuss/list` | project.citytech.ec.har, project.citytech.ec_v2.har, project.citytech.ec_v3.har |
| GET | project.citytech.ec | `/api/v1/Calendars/days/enddate/{date}/5/7` | project.citytech.ec.har |
| GET | project.citytech.ec | `/api/v1/Calendars/days/norworking/range/{date}/{date}` | project.citytech.ec.har, project.citytech.ec_v2.har |
| GET | project.citytech.ec | `/api/v1/Calendars/months/{date}/{date}` | project.citytech.ec.har, project.citytech.ec_v2.har |
| GET | project.citytech.ec | `/api/v1/Dailies` | project.citytech.ec.har |
| GET | project.citytech.ec | `/api/v1/Departments` | project.citytech.ec.har, project.citytech.ec_v2.har, project.citytech.ec_v3.har |
| GET | project.citytech.ec | `/api/v1/Functionals` | project.citytech.ec.har, project.citytech.ec_v2.har |
| GET | project.citytech.ec | `/api/v1/Functionals/{id}` | project.citytech.ec.har |
| GET | project.citytech.ec | `/api/v1/Functionals/requirements` | project.citytech.ec.har |
| GET | project.citytech.ec | `/api/v1/Labels` | project.citytech.ec.har, project.citytech.ec_v2.har, project.citytech.ec_v3.har |
| GET | project.citytech.ec | `/api/v1/Projects` | project.citytech.ec.har, project.citytech.ec_v2.har, project.citytech.ec_v3.har |
| GET | project.citytech.ec | `/api/v1/Projects/{id}` | project.citytech.ec.har, project.citytech.ec_v2.har |
| GET | project.citytech.ec | `/api/v1/Projects/{id}/Attachments` | project.citytech.ec.har |
| GET | project.citytech.ec | `/api/v1/Projects/{id}/scheluder` | project.citytech.ec.har |
| GET | project.citytech.ec | `/api/v1/Projects/{id}/summary` | project.citytech.ec.har, project.citytech.ec_v2.har |
| GET | project.citytech.ec | `/api/v1/Projects/Desk` | project.citytech.ec.har, project.citytech.ec_v3.har |
| GET | project.citytech.ec | `/api/v1/Projects/ProjectsByPriority` | project.citytech.ec.har, project.citytech.ec_v3.har |
| GET | project.citytech.ec | `/api/v1/Projects/ProjectsToFinish` | project.citytech.ec.har |
| GET | project.citytech.ec | `/api/v1/Projects/user/list` | project.citytech.ec.har, project.citytech.ec_v3.har |
| GET | project.citytech.ec | `/api/v1/ProjectStatuss/list` | project.citytech.ec.har, project.citytech.ec_v2.har, project.citytech.ec_v3.har |
| GET | project.citytech.ec | `/api/v1/ProjectTraceGroups/{id}/list` | project.citytech.ec.har, project.citytech.ec_v2.har |
| GET | project.citytech.ec | `/api/v1/ProjectTraces` | project.citytech.ec.har, project.citytech.ec_v2.har |
| POST | project.citytech.ec | `/api/v1/ProjectTraces` | project.citytech.ec_v2.har |
| GET | project.citytech.ec | `/api/v1/ProjectTraces/GroupCounts` | project.citytech.ec.har |
| GET | project.citytech.ec | `/api/v1/ProjectTraces/Notifications` | project.citytech.ec.har, project.citytech.ec_v2.har, project.citytech.ec_v3.har |
| GET | project.citytech.ec | `/api/v1/ProjectTraces/Notifications/UnreadCount` | project.citytech.ec.har, project.citytech.ec_v2.har, project.citytech.ec_v3.har |
| PUT | project.citytech.ec | `/api/v1/ProjectTraces/SetManyRead` | project.citytech.ec.har, project.citytech.ec_v3.har |
| GET | project.citytech.ec | `/api/v1/Requirements` | project.citytech.ec.har, project.citytech.ec_v2.har |
| POST | project.citytech.ec | `/api/v1/Requirements` | project.citytech.ec.har |
| DELETE | project.citytech.ec | `/api/v1/Requirements/{id}` | project.citytech.ec.har |
| GET | project.citytech.ec | `/api/v1/Requirements/{id}` | project.citytech.ec.har |
| GET | project.citytech.ec | `/api/v1/Requirements/{id}/history` | project.citytech.ec.har |
| GET | project.citytech.ec | `/api/v1/Requirements/Project/{id}` | project.citytech.ec.har |
| GET | project.citytech.ec | `/api/v1/SprintImpediments` | project.citytech.ec.har, project.citytech.ec_v2.har, project.citytech.ec_v3.har |
| GET | project.citytech.ec | `/api/v1/Sprints` | project.citytech.ec.har, project.citytech.ec_v2.har |
| POST | project.citytech.ec | `/api/v1/Sprints` | project.citytech.ec.har |
| GET | project.citytech.ec | `/api/v1/Sprints/{id}` | project.citytech.ec.har, project.citytech.ec_v2.har |
| PUT | project.citytech.ec | `/api/v1/Sprints/{id}` | project.citytech.ec.har, project.citytech.ec_v2.har |
| GET | project.citytech.ec | `/api/v1/Sprints/{id}/complete` | project.citytech.ec.har |
| GET | project.citytech.ec | `/api/v1/Sprints/{id}/summary` | project.citytech.ec.har, project.citytech.ec_v2.har |
| PUT | project.citytech.ec | `/api/v1/Sprints/activity` | project.citytech.ec.har, project.citytech.ec_v2.har |
| GET | project.citytech.ec | `/api/v1/Sprints/activity/{id}` | project.citytech.ec.har, project.citytech.ec_v2.har |
| GET | project.citytech.ec | `/api/v1/sprintStatuss/list` | project.citytech.ec.har, project.citytech.ec_v2.har, project.citytech.ec_v3.har |
| GET | project.citytech.ec | `/api/v1/StickyNotes` | project.citytech.ec.har, project.citytech.ec_v3.har |
| GET | project.citytech.ec | `/api/v1/Suppliers` | project.citytech.ec.har |
| GET | project.citytech.ec | `/api/v1/SystemModules` | project.citytech.ec.har |
| GET | project.citytech.ec | `/api/v1/Systems` | project.citytech.ec.har |
| GET | project.citytech.ec | `/api/v1/systems/all` | project.citytech.ec.har, project.citytech.ec_v2.har |
| GET | project.citytech.ec | `/api/v1/TestCases` | project.citytech.ec.har |
| POST | project.citytech.ec | `/api/v1/TestCases` | project.citytech.ec.har |
| GET | project.citytech.ec | `/api/v1/TestCases/{id}` | project.citytech.ec.har |
| PUT | project.citytech.ec | `/api/v1/TestCases/{id}` | project.citytech.ec.har |
| PUT | project.citytech.ec | `/api/v1/TestCases/Update2/{id}` | project.citytech.ec.har |
| GET | project.citytech.ec | `/api/v1/TestRuns` | project.citytech.ec.har |
| GET | project.citytech.ec | `/api/v1/TestRuns/TestCases/Owner` | project.citytech.ec.har, project.citytech.ec_v3.har |
| GET | project.citytech.ec | `/api/v1/users/all` | project.citytech.ec.har, project.citytech.ec_v2.har, project.citytech.ec_v3.har |
| GET | project.citytech.ec | `/api/v1/Users/project/{id}/list` | project.citytech.ec.har, project.citytech.ec_v2.har |
| GET | project.citytech.ec | `/api/v1/Users/Session` | project.citytech.ec.har, project.citytech.ec_v2.har, project.citytech.ec_v3.har |
| GET | project.citytech.ec | `/fonts/nucleo-icons.2569aaea.woff` | project.citytech.ec_v3.har |
| GET | project.citytech.ec | `/fonts/nucleo-icons.42643978.woff2` | project.citytech.ec_v3.har |
| GET | project.citytech.ec | `/fonts/nucleo-icons.c1733565.eot` | project.citytech.ec_v3.har |
| GET | project.citytech.ec | `/fonts/nucleo-icons.f82ec6ba.ttf` | project.citytech.ec_v3.har |
| GET | project.citytech.ec | `/img/nucleo-icons.0b8a30b1.svg` | project.citytech.ec_v3.har |
| GET | project.citytech.ec | `/img/theme/vue.jpg` | project.citytech.ec_v3.har |
| GET | project.citytech.ec | `/index.html` | project.citytech.ec_v3.har |

## Sample bodies (redacted)

### POST /api/v1/Activities

```json
{"projectId":"0e166a8e-5a79-4f2d-a69c-2fcbf894bf34","functionalId":"c9fc628e-9f44-4822-be83-7e6a974b4415","groupId":"7525f84e-53e5-440b-a8ca-965f4bcba344","requirementId":"f6aa96eb-d781-4c30-ac69-a3e74e084e59","order":3,"name":"qqq","description":"","activityStatus":1,"activityStatusId":1,"itemStatusCode":1,"score":1,"plannedHours":1,"workedHours":0,"references":"","developerId":"819bf184-680a-4b5c-a4d1-b7adc4b60992","developerName":"Christian Gabriel Morales","isEditing":true,"__id":"A1B48102-AFED-53F3-5AF7-57A400A6163D","over":true}
```

### PUT /api/v1/Activities/{id}

```json
{"id":"f29ce0e0-b5e0-4c96-9e5b-788df50af6fa","projectId":"0e166a8e-5a79-4f2d-a69c-2fcbf894bf34","functionalId":null,"sprintId":null,"groupId":"7525f84e-53e5-440b-a8ca-965f4bcba344","requirementId":"f6aa96eb-d781-4c30-ac69-a3e74e084e59","order":1,"code":"ACT005-1","name":"[#CT005] | Las columnas “Fecha de Creación” y “Última Actualización” muestran “Fecha inválida” en la grilla de “Tipos de Usuarios”","description":"","references":"","startDate":"2026-08-11","endDate":"2026-08-25","score":1,"plannedHours":1,"workedHours":1,"status":null,"priority":0,"activityStatus":4,"note":{"content":"<p><strong>Descripción:</strong><br>En la grilla del menú <strong>“Tipos de Usuarios”</strong>, las columnas <strong>“Fecha de Creación”</strong> y <strong>“Última Actualización”</strong> no muestran las fechas registradas y, en su lugar, presentan el texto <strong>“Fecha inválida”</strong> en todos los registros.</p><p><strong>Pasos para reproducir:</strong></p><ol><li><p>Ingresar al menú <strong>“Tipos de Usuarios”</strong>.</p></li><li><p>Esperar la carga de la grilla de registros.</p></li><li><p>Revisar las columnas <strong>“Fecha de Creación”</strong> y <strong>“Última Actualización”</strong>.</p></li><li><p>Comparar las fechas mostradas con la información enviada por el backend o almacenada en el sistema.</p></li></ol><p><strong>Resultado actual:</strong><br>Las columnas <strong>“Fecha de Creación”</strong> y <strong>“Última Actualización”</strong> muestran el texto <strong>“Fecha inválida”</strong> en todos los registros, en lugar de la fecha correspondiente.</p><p></p><p><strong>Resultado esperado:</strong><br>Las columnas <strong>“Fecha de Creación”</strong> y <strong>“Última Actualización”</strong> deben mostrar correctamente las fechas de cada registro, utilizando el formato definido para la aplicación y sin presentar el mensaje <strong>“Fecha inválida”</strong>.</p>","attachments":[]},"itemStatusCode":1,"itemStatusName":"POR HACER","developerId":"819bf184-680a-4b5c-a4d1-b7
```

### PUT /api/v1/Activities/Update2/{id}

```json
{"id":"f3dede46-91be-4628-9276-9726771b1951","name":"qqq","plannedHours":1,"order":3,"itemStatusCode":1,"activityStatus":2,"developerId":"819bf184-680a-4b5c-a4d1-b7adc4b60992"}
```

### POST /api/v1/ActivityGroups

```json
{"code":"","name":"sdfsdf","functionalId":"c9fc628e-9f44-4822-be83-7e6a974b4415","supplierId":"336cbf3b-65df-43a3-a425-164eced0c59e","systemId":"2b1ff9b7-34a0-45bd-b225-e816ae4900b4","description":{"content":"<p>sdfsdfs</p>","attachments":[]},"error":"","projectId":"0e166a8e-5a79-4f2d-a69c-2fcbf894bf34"}
```

### POST /api/v1/ProjectTraces

```json
{"projectId":"a8d30445-18e2-45c0-a65c-e01646a1a14d","groupId":"717e80ad-5779-494d-bed4-24b30a2b54cf","note":{"content":"<p>HI <span data-type=\"mention\" class=\"mention\" data-id=\"f9bab5ec-10d8-4847-8c2a-f73e3a87462b|[EMAIL_MOCK]\" data-label=\"Desarrollador 2\">@Desarrollador 2</span> </p>","attachments":[]},"action":"Note"}
```

### PUT /api/v1/ProjectTraces/SetManyRead

```json
{"projectTraceIds":["1d13bef1-f14a-42f3-82ac-bc0da77e0f29"]}
```

### POST /api/v1/Requirements

```json
{"functionalId":"c9fc628e-9f44-4822-be83-7e6a974b4415","order":10,"name":"adasd","groupId":"7525f84e-53e5-440b-a8ca-965f4bcba344","developerId":"819bf184-680a-4b5c-a4d1-b7adc4b60992","activityStatusId":1,"description":{"content":"<p></p>","attachments":[]},"score":1,"dependencyIds":[],"dependencies":[],"projectId":"0e166a8e-5a79-4f2d-a69c-2fcbf894bf34"}
```

### POST /api/v1/Sprints

```json
{"number":"2","name":"Sprint 2","startDate":"2026-08-20","endDate":"2026-08-20","workHoursByDay":7,"plannedHours":5,"workedHours":0,"sprintStatusId":"","typeControl":1,"functionalId":"c9fc628e-9f44-4822-be83-7e6a974b4415","sprintStatus":1,"projectId":"0e166a8e-5a79-4f2d-a69c-2fcbf894bf34"}
```

### PUT /api/v1/Sprints/{id}

```json
{"id":"5d82d6e9-cfc2-4fde-848a-a6c9bad5e8e4","name":"Sprint 1","sprintStatus":2,"startDate":"2026-07-15","workHoursByDay":7,"endDate":"2026-08-31","typeControl":1,"activities":[],"groups":[{"id":"7525f84e-53e5-440b-a8ca-965f4bcba344","code":"RFCT005-1","name":"CERTIFICACIÓN DEL CORE 2.0","requirements":[{"id":"a3404bad-4cbd-4db2-95f8-cc3d7aafeea7","order":1,"code":"HCT005-1","name":"Levantamiento de Información técnica de cambios a módulos","activityStatus":3,"activityStatusName":null,"developerId":"819bf184-680a-4b5c-a4d1-b7adc4b60992","developerName":"Christian Gabriel Morales","score":1,"plannedHours":0,"workedHours":0,"startDate":"2026-07-15","endDate":"2026-08-21","finishedDate":"","priority":0,"percentageAdvance":0,"groupId":"7525f84e-53e5-440b-a8ca-965f4bcba344","groupCode":"RFCT005-1","groupName":"CERTIFICACIÓN DEL CORE 2.0","noteId":null,"note":null,"activities":[],"_filteredActivities":[],"selected":false,"editing":false},{"id":"fc154c79-9c54-4528-a0f0-34b24997086d","order":2,"code":"HCT005-2","name":"Levantamiento de Casos de Pruebas - Certificación Exploratoria de funcionalidad","activityStatus":4,"activityStatusName":null,"developerId":"99b95b55-9182-4426-87ff-7161302ef65e","developerName":"Jandry Anchundia","score":1,"plannedHours":0,"workedHours":0,"startDate":"2026-07-17","endDate":"2026-07-29","finishedDate":"2026-07-29","priority":0,"percentageAdvance":0,"groupId":"7525f84e-53e5-440b-a8ca-965f4bcba344","groupCode":"RFCT005-1","groupName":"CERTIFICACIÓN DEL CORE 2.0","noteId":null,"note":null,"activities":[],"_filteredActivities":[],"selected":false,"editing":false},{"id":"ce464e79-b3ce-464a-ad92-40ff73b5626f","order":3,"code":"HCT005-3","name":"Ejecución de Pruebas QA  - Iteración 1","activityStatus":4,"activityStatusName":null,"developerId":"99b95b55-9182-4426-87ff-7161302ef65e","developerName":"Jandry Anchundia","score":1,"plannedHours":0,"workedHours":0,"startDate":"2026-07-30","endDate":"2026-08-06","finishedDate":"2026-08-11","priority":0,"per
```

### PUT /api/v1/Sprints/activity

```json
{"id":"f29ce0e0-b5e0-4c96-9e5b-788df50af6fa","sprintId":"5d82d6e9-cfc2-4fde-848a-a6c9bad5e8e4","developerId":"819bf184-680a-4b5c-a4d1-b7adc4b60992","developerName":"Christian Gabriel Morales","activityId":"00000000-0000-0000-0000-000000000000","activityOrder":1,"activityCode":null,"activityName":"[#CT005] | Las columnas “Fecha de Creación” y “Última Actualización” muestran “Fecha inválida” en la grilla de “Tipos de Usuarios”","activityDescription":"","activityGroupId":"7525f84e-53e5-440b-a8ca-965f4bcba344","activityGroupCode":"RFCT005-1","activityGroupName":"CERTIFICACIÓN DEL CORE 2.0","requirementId":"f6aa96eb-d781-4c30-ac69-a3e74e084e59","requirementOrder":4,"requirementCode":null,"requirementName":"Corrección de Errores - Iteración 1","requirementNoteId":null,"requirementNote":null,"activityStatus":2,"activityStatusName":null,"score":1,"percentageAdvance":"100","plannedHours":1,"workedHours":0,"observation":null,"startDate":"2026-08-11","endDate":"2026-08-25","finishedDate":null,"priority":0,"noteId":null,"note":{"content":"<p><strong>Descripción:</strong><br>En la grilla del menú <strong>“Tipos de Usuarios”</strong>, las columnas <strong>“Fecha de Creación”</strong> y <strong>“Última Actualización”</strong> no muestran las fechas registradas y, en su lugar, presentan el texto <strong>“Fecha inválida”</strong> en todos los registros.</p><p><strong>Pasos para reproducir:</strong></p><ol><li><p>Ingresar al menú <strong>“Tipos de Usuarios”</strong>.</p></li><li><p>Esperar la carga de la grilla de registros.</p></li><li><p>Revisar las columnas <strong>“Fecha de Creación”</strong> y <strong>“Última Actualización”</strong>.</p></li><li><p>Comparar las fechas mostradas con la información enviada por el backend o almacenada en el sistema.</p></li></ol><p><strong>Resultado actual:</strong><br>Las columnas <strong>“Fecha de Creación”</strong> y <strong>“Última Actualización”</strong> muestran el texto <strong>“Fecha inválida”</strong> en todos los registros, en lugar de la
```

### POST /api/v1/TestCases

```json
{"projectId":"0e166a8e-5a79-4f2d-a69c-2fcbf894bf34","functionalId":"c9fc628e-9f44-4822-be83-7e6a974b4415","groupId":"7525f84e-53e5-440b-a8ca-965f4bcba344","requirementId":"f6aa96eb-d781-4c30-ac69-a3e74e084e59","name":"Corrección de Errores - Iteración 1","template":1,"type":2,"priority":1,"estimate":1,"preconditions":{},"steps":{},"expected":{},"itemStatusCode":1}
```

### PUT /api/v1/TestCases/{id}

```json
{"id":"d1b2671b-a5f8-44c7-ae4e-da72bc09ac3f","projectId":"0e166a8e-5a79-4f2d-a69c-2fcbf894bf34","functionalId":null,"sprintId":null,"groupId":"7525f84e-53e5-440b-a8ca-965f4bcba344","requirementId":"f6aa96eb-d781-4c30-ac69-a3e74e084e59","groupCode":null,"groupName":null,"code":"TCCT005-2","order":0,"name":"Corrección de Errores - Iteración 1","template":2,"type":1,"typeName":"Development","references":null,"priority":2,"priorityName":null,"estimate":1,"activityId":null,"activityName":null,"requirementOrder":0,"requirementName":null,"requirementDescription":null,"preconditions":{"content":"<p>asd</p>","attachments":[]},"steps":{"content":"<p>asda</p>","attachments":[]},"expected":{"content":"<p>asd</p>","attachments":[]},"stepsList":[],"itemStatusCode":1,"itemStatusName":"POR HACER","developerId":null,"developer":"","startDate":null,"endDate":null,"itemType":0}
```

### PUT /api/v1/TestCases/Update2/{id}

```json
{"id":"d1b2671b-a5f8-44c7-ae4e-da72bc09ac3f","requirementId":"f6aa96eb-d781-4c30-ac69-a3e74e084e59","name":"Corrección de Errores - Iteración 1","estimate":1,"itemStatusCode":1,"type":1}
```
