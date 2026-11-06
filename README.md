# Goliath Portal

Puerta de operadores hacia GoliathOmics. La interfaz es Next.js. Los datos viven en la base PostgreSQL **`goliath`**: el shell (RBAC, NavTree, `wf`, `cfg`) lo aporta GoliathApp y el dominio clínico lo aporta [GoliathOmics](https://github.com/Goliath-Research/GoliathOmics) en `database/schema/`.

Esta app no crea ese esquema. Llama funciones que Omics ya publica:

| Pantalla | Función |
| --- | --- |
| Clínico | `portal.sp_list_diseases`, `portal.sp_list_groups_for_disease` |
| Muestras | `portal.spgetsamplesbycustomer` |
| Instituciones | `portal.spgetallinstitutionbycustomer` |
| Estudios | `portal.sp_get_study_process_defaults` |
| Enrolamiento | `portal.sp_list_samples_for_study_enrollment`, `portal.sp_list_group_sample_names` |
| Analitos | `portal.sp_list_analyte_catalog` |
| SamplePrep | `portal.sp_preview_study_start`, `portal.sp_request_study_start` |

SamplePrep solo encola `cfg.study_start_request`. El drenado sigue en `methyl-study-start drain-requests`. Los workers entran por el gateway; el portal no los llama.

La base de `goliath-test` está en Neon (`database.kind` es `neon`). El portal usa el host pooler de `deploy/targets/goliath-test.json` y el cliente de Neon. El rol es `goliath_portal` y la contraseña es la variable `GOLIATH_PORTAL_DB_PASSWORD`. Una URL explícita (`GOLIATH_DATABASE_URL`, `WF_DATABASE_URL` o `METHYLPIPELINE_DB`) o `POSTGRES_*` sustituye al target.

```bash
cp .env.example .env.local
npm install
npm test
npm run dev
```

Entra es el acceso de producción. `AUTH_DEV_LOGIN=1` abre un acceso local para el operador listado en `GOLIATH_PORTAL_OPERATORS`.
